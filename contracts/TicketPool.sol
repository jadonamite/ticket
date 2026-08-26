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

    error PoolFull();
    error NoSlot(address account);
    error PeriodTooLong(uint32 periodLength);
    error PeriodZero();

    event SlotAssigned(address indexed depositor, uint32 indexed slot);
    event Deposited(address indexed depositor, uint32 indexed slot);
    event Withdrawn(address indexed depositor, uint32 indexed slot);

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

        uint32 period = currentPeriod();
        _update(slot, transferred, false, uint32(block.timestamp), period, periodStart(period));
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

        uint32 period = currentPeriod();
        _update(slot, amount, true, uint32(block.timestamp), period, periodStart(period));
        _grantLeaf(slot, msg.sender);

        FHE.allowTransient(amount, address(token));
        token.confidentialTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, slot);
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
