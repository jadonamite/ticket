// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

import {Limits} from "./Limits.sol";
import {WeightTree} from "./WeightTree.sol";

/// @notice Deposits and withdrawals over the encrypted weight tree.
///
/// @dev Principal is never at risk here and never earns a discount: a withdrawal returns exactly
///      what was put in, and the only thing a deposit buys is time-weighted odds. The draw itself
///      lives in `DrawMachine`; this contract owns the money and the tree.
///
///      The token is a constructor argument typed as `IERC7984`, so the demo's faucet token and a
///      real confidential USDT are the same deployment with a different address.
contract TicketPool is WeightTree {
    /// @notice The confidential asset depositors hold.
    IERC7984 public immutable token;

    /// @notice When period 0 began.
    uint32 public immutable genesis;

    /// @notice Seconds per draw period.
    uint32 public immutable periodLength;

    /// @notice Slot 0 is a real slot, so occupancy is tracked separately rather than by `slot != 0`.
    mapping(address depositor => uint32 slot) private _slotOf;
    mapping(address depositor => bool assigned) private _hasSlot;
    mapping(uint32 slot => address depositor) public depositorAt;

    /// @notice Slots are assigned once and never reused, so this only ever climbs.
    uint32 public nextSlot;

    /// @notice An interaction that arrived while a draw held the tree still, waiting to be
    ///         executed the moment the draw settles.
    ///
    /// @dev `payTo` is zero for a deposit — the token already moved when it was queued — and the
    ///      depositor for a withdrawal, whose token movement is what is being deferred.
    struct Pending {
        uint32 slot;
        bool subtract;
        address payTo;
        euint64 amount;
    }

    /// @notice The cap on interactions parked behind one draw. A draw is eight transactions and
    ///         well under a minute, so this is a very deep queue in practice.
    uint256 internal constant MAX_QUEUE = 32;

    /// @notice Parked interactions executed per transaction.
    ///
    /// @dev Each one is a full leaf-to-root walk — the benchmark prices it at roughly half a
    ///      million gas — so draining a full queue inside `settle` would need thirty million and
    ///      no block would take it. The drain is paged instead: `settle` does the first page and
    ///      anyone may push the rest through. Settling is not allowed to depend on how many
    ///      people happened to act while the draw was running.
    uint256 internal constant DRAIN_PER_TX = 4;

    Pending[] private _queue;

    /// @dev Read index into `_queue`. The array is cleared once it is fully drained rather than
    ///      element by element, so this is what says where the drain has got to.
    uint256 private _drained;

    mapping(uint32 slot => bool queued) private _slotQueued;

    error PoolFull();
    error NoSlot(address account);
    error PeriodTooLong(uint32 periodLength);
    error PeriodZero();
    error QueueFull();
    error AlreadyQueued(uint32 slot);
    error QueueNotDrained(uint256 remaining);

    event SlotAssigned(address indexed depositor, uint32 indexed slot);
    event Deposited(address indexed depositor, uint32 indexed slot);
    event Withdrawn(address indexed depositor, uint32 indexed slot);
    event Queued(address indexed depositor, uint32 indexed slot, bool subtract, uint256 position);
    event QueueDrained(uint256 count);

    constructor(
        IERC7984 token_,
        uint32 arity_,
        uint32 capacity_,
        uint32 periodLength_
    ) WeightTree(arity_, capacity_) {
        if (periodLength_ == 0) revert PeriodZero();
        if (periodLength_ > Limits.MAX_PERIOD) revert PeriodTooLong(periodLength_);

        token = token_;
        periodLength = periodLength_;
        genesis = uint32(block.timestamp);
    }

    // ---------------------------------------------------------------- periods

    /// @notice The period `block.timestamp` falls in.
    function currentPeriod() public view returns (uint32) {
        return (uint32(block.timestamp) - genesis) / periodLength;
    }

    /// @notice When a period began.
    function periodStart(uint32 period) public view returns (uint32) {
        return genesis + period * periodLength;
    }

    // ------------------------------------------------------------------ slots

    /// @notice The caller's slot, and whether they have one at all.
    function slotOf(address account) public view returns (uint32 slot, bool assigned) {
        return (_slotOf[account], _hasSlot[account]);
    }

    /// @notice Depositors who have ever deposited. The draw descends over `capacity` leaves
    ///         regardless, so this is a UX number, not a cost.
    function participantCount() external view returns (uint32) {
        return nextSlot;
    }

    function _slotFor(address account) private returns (uint32) {
        if (_hasSlot[account]) return _slotOf[account];
        if (nextSlot >= capacity) revert PoolFull();

        uint32 slot = nextSlot++;
        _slotOf[account] = slot;
        _hasSlot[account] = true;
        depositorAt[slot] = account;

        emit SlotAssigned(account, slot);
        return slot;
    }

    // --------------------------------------------------------------- deposits

    /// @notice Deposit an encrypted amount. The caller must have made this contract an operator
    ///         on the token first.
    ///
    /// @dev The amount is clamped twice and neither clamp can revert, because reverting on an
    ///      encrypted comparison would leak the comparison. `FHE.min` caps it at `MAX_DEPOSIT` so
    ///      the aggregates cannot overflow, and the token itself caps it at the sender's balance
    ///      and returns what actually moved. That return value, not the request, is what enters
    ///      the tree — otherwise a depositor could claim odds on money they never sent.
    function deposit(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        uint32 slot = _slotFor(msg.sender);

        euint64 requested = FHE.fromExternal(encryptedAmount, inputProof);
        euint64 capped = FHE.min(requested, FHE.asEuint64(Limits.MAX_DEPOSIT));
        FHE.allowTransient(capped, address(token));

        euint64 transferred = token.confidentialTransferFrom(msg.sender, address(this), capped);
        FHE.allowThis(transferred);

        _applyOrQueue(slot, transferred, false, address(0));
        _grantLeaf(slot, msg.sender);

        emit Deposited(msg.sender, slot);
    }

    // ------------------------------------------------------------ withdrawals

    /// @notice Withdraw an encrypted amount, clamped to the caller's balance.
    ///
    /// @dev Asking for more than you hold is not an error and must not be one: an error is a
    ///      public signal about a private balance. The request is silently clamped, which is both
    ///      the safe behaviour and the honest one — you cannot underflow the tree by guessing.
    function withdraw(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        uint32 slot = _requireSlot(msg.sender);
        euint64 requested = FHE.fromExternal(encryptedAmount, inputProof);
        (euint64 balance, ) = _balanceOf(slot);
        _exit(slot, FHE.min(requested, balance));
    }

    /// @notice Withdraw the caller's entire principal.
    function withdrawAll() external {
        uint32 slot = _requireSlot(msg.sender);
        (euint64 balance, ) = _balanceOf(slot);
        _exit(slot, balance);
    }

    function _exit(uint32 slot, euint64 amount) private {
        FHE.allowThis(amount);
        _applyOrQueue(slot, amount, true, msg.sender);
        _grantLeaf(slot, msg.sender);

        emit Withdrawn(msg.sender, slot);
    }

    // ---------------------------------------------------------------- queueing

    /// @notice Whether a draw is currently holding the tree still. Always false here; the draw
    ///         machine that inherits this contract is what makes it true.
    function drawInFlight() public view virtual returns (bool) {
        return false;
    }

    /// @notice How many interactions are still waiting to be executed.
    function queueLength() public view returns (uint256) {
        return _queue.length - _drained;
    }

    /// @dev A draw is judged against the tree as it stood at its seal time, so the tree cannot
    ///      move while one is in flight. Blocking withdrawals for that window would breach the
    ///      promise that money is available at any time — the whole reason prize-linked saving is
    ///      not gambling — so interactions are parked instead and executed automatically when the
    ///      draw settles. The depositor acts once and the transaction lands without them.
    ///
    ///      One parked interaction per slot. A second withdrawal would clamp against a balance the
    ///      first has not yet spent, and two of them together could ask for more than the leaf
    ///      holds. The bound is on the slot, which is public, so refusing leaks nothing.
    function _applyOrQueue(uint32 slot, euint64 amount, bool subtract, address payTo) internal {
        if (!drawInFlight()) {
            _execute(slot, amount, subtract, payTo);
            return;
        }

        if (queueLength() >= MAX_QUEUE) revert QueueFull();
        if (_slotQueued[slot]) revert AlreadyQueued(slot);

        _slotQueued[slot] = true;
        _queue.push(Pending({slot: slot, subtract: subtract, payTo: payTo, amount: amount}));

        emit Queued(msg.sender, slot, subtract, _queue.length - 1);
    }

    /// @notice Execute up to `max` parked interactions, in arrival order.
    ///
    /// @dev Permissionless on purpose. A parked withdrawal is somebody's money, and whether they
    ///      get it back must not depend on a keeper choosing to finish its work.
    function drainQueue(uint256 max) public returns (uint256 executed) {
        uint256 end = _queue.length;
        uint256 i = _drained;
        uint256 stop = i + max;
        if (stop > end) stop = end;

        for (; i < stop; i++) {
            Pending memory p = _queue[i];
            _slotQueued[p.slot] = false;
            _execute(p.slot, p.amount, p.subtract, p.payTo);
            executed++;
        }

        _drained = i;
        if (i == end && end != 0) {
            delete _queue;
            _drained = 0;
        }

        emit QueueDrained(executed);
    }

    /// @dev One page, inside `settle`.
    function _drainQueue() internal {
        drainQueue(DRAIN_PER_TX);
    }

    /// @dev The leaf is re-granted to its owner on every execution, not only on the call that
    ///      queued it. `_update` replaces the ciphertexts it touches, and a handle nobody is
    ///      allowed to decrypt is a balance its owner has lost sight of — the grant has to follow
    ///      the write, wherever the write happens.
    function _execute(uint32 slot, euint64 amount, bool subtract, address payTo) private {
        uint32 period = currentPeriod();
        _update(slot, amount, subtract, uint32(block.timestamp), period, periodStart(period));
        _grantLeaf(slot, depositorAt[slot]);

        if (payTo != address(0)) {
            FHE.allowTransient(amount, address(token));
            token.confidentialTransfer(payTo, amount);
        }
    }

    function _requireSlot(address account) private view returns (uint32) {
        if (!_hasSlot[account]) revert NoSlot(account);
        return _slotOf[account];
    }

    // -------------------------------------------------------------- balances

    function _balanceOf(uint32 slot) private view returns (euint64 balance, euint64 accrued) {
        (euint64 a, euint64 b, , ) = _leaf(slot);
        return (b, a);
    }

    /// @notice The caller's principal, as a handle they are allowed to decrypt.
    function confidentialBalanceOf(address account) external view returns (euint64) {
        (euint64 balance, ) = _balanceOf(_slotOf[account]);
        return balance;
    }

    /// @notice The integral accrued so far this period, up to the last time this leaf moved.
    ///
    /// @dev Paired with `lastMoved`, this is everything the owner needs: the live weight is
    ///      `accrued + balance * (now - lastMoved)`, and the elapsed term is public, so the owner
    ///      finishes the calculation off chain after decrypting two handles.
    function confidentialWeightOf(address account) external view returns (euint64) {
        (, euint64 accrued) = _balanceOf(_slotOf[account]);
        return accrued;
    }

    /// @notice When this depositor's leaf last moved, and in which period.
    function lastMoved(address account) external view returns (uint32 at, uint32 period) {
        (, , uint32 lastUpdate, uint32 lastPeriod) = _leaf(_slotOf[account]);
        return (lastUpdate, lastPeriod);
    }
}
