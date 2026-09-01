// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, ebool, euint8, euint32, euint64, euint128} from "@fhevm/solidity/lib/FHE.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

import {TicketPool} from "./TicketPool.sol";

/// @notice Picks one winner out of an encrypted pool without ever reading a balance.
///
/// @dev `FHE` cannot branch on a ciphertext and cannot index an array by one. Those two facts
///      are why every confidential lottery published so far walks all N depositors: the only
///      oblivious construction available is "compare the random point against every prefix sum".
///
///      The way out is an observation about what the leak actually is. A tournament descent that
///      publicly reveals which child it took at each level reveals the winner's slot index one
///      digit at a time — and the winner's identity is published anyway. The path *is* the
///      answer. Revealing it early costs nothing, and it turns an O(N) scan into a descent over
///      `treeDepth` levels.
///
///      Scaling the random point is the other half. Division by a ciphertext does not exist, and
///      rejection sampling would leak a bit about the pool total on every retry. So the test
///
///          r / 2^32  <  prefix_j / total
///
///      is cross-multiplied into
///
///          r * total  <  prefix_j * 2^32          (in euint128)
///
///      exact, unbiased to one part in 2^32, no division, and no total ever revealed. Descending
///      needs no fresh randomness: the residual `R' = R - prefix_{j-1} * 2^32` is uniform on
///      `[0, w_j * 2^32)`, so the same test recurses against the child's own prefix sums. There is
///      one ciphertext-by-ciphertext multiply in the entire draw — the most expensive operation
///      available, spent exactly once, at the root.
///
///      **Why a level is two transactions.** The binding per-transaction ceiling is sequential
///      depth, not global compute, which is the opposite of what the sizing arithmetic suggested.
///      Sealing the k children is k independent chains and is depth-flat at every arity; the
///      selection that follows is 77% of the depth budget on its own. Measured together they
///      revert. Split, they fit — see `bench/RESULTS.md` and `deploy/params.ts`.
///
///      A draw is therefore `1 + 2 * treeDepth + 1` transactions: commit (which seals the root's
///      children), then select and reveal at each level, then settle. Bounded, driven by a
///      keeper, and presented to a depositor as one action with a real progress state.
contract DrawMachine is TicketPool {
    /// @dev `Prepared` means the current node's children are sealed and waiting to be scanned.
    ///      `Selected` means an index handle is published and waiting on the KMS.
    enum Phase {
        None,
        Prepared,
        Selected,
        Settled
    }

    struct Draw {
        uint32 period;
        uint32 sealTime;
        uint64 prize;
        address sponsor;
        uint32 node;
        uint8 level;
        Phase phase;
        bool leafReached;
        uint32 winnerSlot;
        address winner;
    }

    /// @notice How long a draw may sit unfinished before anyone may abandon it.
    ///
    /// @dev A draw holds the tree still, and an unfinished draw holds it still forever. The KMS is
    ///      a live service and live services stop: if a published index never comes back, the pool
    ///      would be frozen with people's money in it and no way out. So a draw that has not
    ///      settled within this window can be abandoned by anybody, which releases the pool and
    ///      returns the sponsor's prize. Generously long, because abandoning a draw that was only
    ///      slow is worse than waiting.
    uint32 public constant DRAW_TIMEOUT = 6 hours;

    /// @notice Whoever may open a draw. Driving one forward is permissionless on purpose: a
    ///         half-finished draw holds the pool, so nobody should be able to strand it.
    address public keeper;

    /// @notice The only privilege in the contract: naming the keeper.
    ///
    /// @dev Deliberately nothing else. The owner cannot pause the pool, cannot move a deposit,
    ///      cannot influence a draw and cannot reach the money — a depositor's withdrawal does not
    ///      depend on anybody's goodwill, which is the only reason a confidential pool is worth
    ///      trusting. Rotation exists because a keeper key that is lost or leaked would otherwise
    ///      end the pool's life: no key, no further draws, forever.
    address public immutable owner;

    uint256 public drawCount;

    mapping(uint256 id => Draw draw) private _draws;

    /// @dev The sealed weights of the current node's children. Overwritten level by level; the
    ///      draw never needs a level it has already descended past.
    mapping(uint256 id => euint64[] sealedChildren) private _children;

    /// @dev The residual random point, scaled by 2^32. Set once at the root, narrowed on descent.
    mapping(uint256 id => euint128 point) private _point;

    /// @dev The published child index for the level currently awaiting reveal.
    mapping(uint256 id => euint8 index) private _index;

    error NotKeeper(address caller);
    error NotOwner(address caller);
    error ZeroKeeper();
    error NoDraw(uint256 id);
    error WrongPhase(uint256 id, Phase expected, Phase actual);
    error DrawInFlight(uint256 id);
    error EmptyPool();
    error UnknownHandle();
    error ChildOutOfRange(uint8 child);
    error NotTimedOut(uint256 id, uint32 expiresAt);
    error DrawNotFinished(uint256 id, uint8 level, uint8 levels);

    event DrawCommitted(
        uint256 indexed id,
        uint32 indexed period,
        uint32 sealTime,
        uint64 prize,
        address sponsor,
        uint8 levels
    );
    event LevelPrepared(uint256 indexed id, uint8 indexed level, uint32 node);
    event LevelSelected(uint256 indexed id, uint8 indexed level, bytes32 indexHandle);
    event LevelRevealed(uint256 indexed id, uint8 indexed level, uint8 child, uint32 node);
    event DrawSettled(uint256 indexed id, address indexed winner, uint32 winnerSlot, uint64 prize, uint32 participants);
    event PrizeReturned(uint256 indexed id, address indexed sponsor, uint64 prize);
    event DrawAbandoned(uint256 indexed id, uint8 reachedLevel, address caller);
    event KeeperChanged(address indexed from, address indexed to);

    /// @dev Zero is not a live draw id, so `openDraw == 0` reads as "no draw in flight".
    uint256 public openDraw;

    constructor(
        IERC7984 token_,
        uint32 arity_,
        uint32 capacity_,
        uint32 periodLength_,
        address keeper_
    ) TicketPool(token_, arity_, capacity_, periodLength_) {
        if (keeper_ == address(0)) revert ZeroKeeper();
        keeper = keeper_;
        owner = msg.sender;
    }

    modifier onlyKeeper() {
        if (msg.sender != keeper) revert NotKeeper(msg.sender);
        _;
    }

    /// @notice Name a new keeper. Cannot be done while a draw is in flight, so a rotation can
    ///         never orphan one halfway down the tree.
    function setKeeper(address keeper_) external {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        if (keeper_ == address(0)) revert ZeroKeeper();
        if (openDraw != 0) revert DrawInFlight(openDraw);

        emit KeeperChanged(keeper, keeper_);
        keeper = keeper_;
    }

    // ------------------------------------------------------------------ views

    function drawOf(uint256 id) external view returns (Draw memory) {
        return _draws[id];
    }

    /// @notice True while a draw holds the tree still. Deposits and withdrawals are queued rather
    ///         than blocked during this window — see `TicketPool._applyOrQueue`.
    function drawInFlight() public view override returns (bool) {
        return openDraw != 0;
    }

    /// @notice The published index handle for the level awaiting reveal, for the relayer to
    ///         publicly decrypt.
    function levelIndexHandle(uint256 id) external view returns (euint8) {
        return _index[id];
    }

    // ----------------------------------------------------------------- commit

    /// @notice Open a draw, freeze the clock it will be judged against, and seal the root's
    ///         children in the same transaction.
    ///
    /// @dev The prize is plaintext and pulled from the sponsor here, not taken from the pool.
    ///      Depositors' principal is not a prize pool and paying out of it would silently make
    ///      this a lottery; the interface says "sponsor-funded" because the contract is.
    ///
    ///      `FHE.randEuint32` is a state-changing call — randomness cannot be produced by a
    ///      read-only call — which is one reason the commit is its own transaction rather than
    ///      something a viewer can simulate.
    function commitDraw(uint64 prize) external onlyKeeper returns (uint256 id) {
        if (openDraw != 0) revert DrawInFlight(openDraw);
        if (nextSlot == 0) revert EmptyPool();
        // A draw must be judged against a settled tree. Interactions parked behind the previous
        // draw have not been applied yet, so opening over them would seal a state that is known
        // to be wrong.
        uint256 waiting = queueLength();
        if (waiting != 0) revert QueueNotDrained(waiting);

        id = ++drawCount;
        openDraw = id;

        uint32 period = currentPeriod();
        uint32 sealTime = uint32(block.timestamp);

        Draw storage draw = _draws[id];
        draw.period = period;
        draw.sealTime = sealTime;
        draw.prize = prize;
        draw.sponsor = msg.sender;
        draw.node = 0;
        draw.level = 0;
        draw.phase = Phase.Prepared;

        if (prize > 0) {
            euint64 escrow = FHE.asEuint64(prize);
            FHE.allowThis(escrow);
            FHE.allowTransient(escrow, address(token));
            token.confidentialTransferFrom(msg.sender, address(this), escrow);
        }

        euint32 r = FHE.randEuint32();
        euint128 scaled = FHE.asEuint128(FHE.asEuint64(r));
        FHE.allowThis(scaled);
        _point[id] = scaled;

        emit DrawCommitted(id, period, sealTime, prize, msg.sender, treeDepth);

        _prepare(id, draw);
    }

    // ---------------------------------------------------------------- descent

    /// @dev Seal every child of the current node at the frozen time. k independent chains, each
    ///      three operations deep, so this is depth-flat however wide the tree is.
    function _prepare(uint256 id, Draw storage draw) private {
        uint32 start = periodStart(draw.period);

        euint64[] storage slots = _children[id];
        uint32 k = arity;
        while (slots.length < k) slots.push();

        for (uint32 j = 0; j < k; j++) {
            euint64 w = _sealed(childOf(draw.node, j), draw.sealTime, draw.period, start);
            FHE.allowThis(w);
            slots[j] = w;
        }

        emit LevelPrepared(id, draw.level, draw.node);
    }

    /// @notice Scan the sealed children into prefix sums, drop the random point on them, and
    ///         publish which child it landed in.
    ///
    /// @dev The prefix sum is a Hillis-Steele scan rather than a running total. A running total is
    ///      a chain of k-1 sequential adds, and depth that grows with arity is exactly what makes
    ///      k=16 revert. The scan is log2(k) rounds deep at the cost of k*log2(k) additions — it
    ///      trades global compute, which is slack, for depth, which is not.
    ///
    ///      The published index is the count of prefix boundaries the point has passed. A child
    ///      with zero weight has the same prefix as the one before it, so the count skips it and
    ///      it can never be selected — no branch on a ciphertext required to exclude it.
    function selectLevel(uint256 id) external {
        Draw storage draw = _mustBe(id, Phase.Prepared);

        uint32 k = arity;
        euint64[] storage slots = _children[id];

        euint64[] memory scan = new euint64[](k);
        for (uint32 i = 0; i < k; i++) scan[i] = slots[i];

        for (uint32 d = 1; d < k; d <<= 1) {
            euint64[] memory next = new euint64[](k);
            for (uint32 i = 0; i < k; i++) {
                next[i] = i >= d ? FHE.add(scan[i], scan[i - d]) : scan[i];
            }
            scan = next;
        }

        euint128 point = _point[id];

        // The one ciphertext-by-ciphertext multiply in the whole draw, and only at the root.
        // Below the root the point is already a residual on the same 2^32 scale.
        if (draw.level == 0) {
            point = FHE.mul(point, FHE.asEuint128(scan[k - 1]));
            FHE.allowThis(point);
            _point[id] = point;
        }

        euint8 idx = FHE.asEuint8(0);
        for (uint32 i = 0; i + 1 < k; i++) {
            ebool passed = FHE.ge(point, FHE.shl(FHE.asEuint128(scan[i]), uint8(32)));
            idx = FHE.add(idx, FHE.asEuint8(passed));
        }

        FHE.allowThis(idx);
        FHE.makePubliclyDecryptable(idx);
        _index[id] = idx;
        draw.phase = Phase.Selected;

        emit LevelSelected(id, draw.level, euint8.unwrap(idx));
    }

    /// @notice Submit the KMS-signed decryption of the published index, descend into that child,
    ///         and seal its children ready for the next level.
    ///
    /// @dev Two separate bindings have to hold and only one of them comes from the KMS.
    ///      `FHE.checkSignatures` proves the cleartext belongs to *these handles in this order*;
    ///      it says nothing about whether these handles are the ones this draw published. So the
    ///      handle is compared against stored state first. Without that check a valid proof for
    ///      any other publicly decryptable value would drive this draw wherever its holder liked.
    ///
    ///      The residual is computed here rather than at selection because the child index is
    ///      plaintext by now — which is what lets the prefix be summed over a known range in a
    ///      balanced tree, four operations deep instead of fifteen.
    function revealLevel(uint256 id, bytes32[] calldata handles, uint8 child, bytes calldata proof) external {
        Draw storage draw = _mustBe(id, Phase.Selected);
        if (handles.length != 1 || handles[0] != euint8.unwrap(_index[id])) revert UnknownHandle();
        if (child >= arity) revert ChildOutOfRange(child);

        FHE.checkSignatures(handles, abi.encode(child), proof);

        if (child > 0) {
            euint64 consumed = _sumRange(_children[id], 0, child);
            euint128 point = FHE.sub(_point[id], FHE.shl(FHE.asEuint128(consumed), uint8(32)));
            FHE.allowThis(point);
            _point[id] = point;
        }

        uint32 node = childOf(draw.node, child);
        draw.node = node;
        draw.level += 1;
        _index[id] = euint8.wrap(bytes32(0));

        emit LevelRevealed(id, draw.level - 1, child, node);

        if (draw.level == treeDepth) {
            draw.leafReached = true;
            draw.phase = Phase.Prepared;
            uint32 slot = node - leafOffset;
            draw.winnerSlot = slot;
            draw.winner = depositorAt[slot];
        } else {
            draw.phase = Phase.Prepared;
            _prepare(id, draw);
        }
    }

    /// @dev Sum `values[from..to)` as a balanced tree, so depth is log2 of the range rather than
    ///      the length of it. The range is plaintext, so this is ordinary arithmetic on handles.
    function _sumRange(euint64[] storage values, uint32 from, uint32 to) private returns (euint64) {
        uint32 n = to - from;
        euint64[] memory level = new euint64[](n);
        for (uint32 i = 0; i < n; i++) level[i] = values[from + i];

        while (n > 1) {
            uint32 half = (n + 1) / 2;
            euint64[] memory next = new euint64[](half);
            for (uint32 i = 0; i < half; i++) {
                uint32 a = 2 * i;
                next[i] = a + 1 < n ? FHE.add(level[a], level[a + 1]) : level[a];
            }
            level = next;
            n = half;
        }
        return level[0];
    }

    // ----------------------------------------------------------------- settle

    /// @notice Pay the winner, release the tree, and execute everything that arrived mid-draw.
    ///
    /// @dev A draw that lands on an unoccupied leaf means the pool's total weight was zero — every
    ///      depositor had withdrawn before the seal. There is no way to detect that under
    ///      encryption and no reason to pretend otherwise: the prize goes back to the sponsor and
    ///      the event records a winner of `address(0)`.
    function settle(uint256 id) external {
        Draw storage draw = _mustBe(id, Phase.Prepared);
        if (!draw.leafReached) revert DrawNotFinished(id, draw.level, treeDepth);

        draw.phase = Phase.Settled;
        openDraw = 0;

        address winner = draw.winner;
        if (draw.prize > 0) {
            euint64 prize = FHE.asEuint64(draw.prize);
            FHE.allowThis(prize);
            FHE.allowTransient(prize, address(token));
            if (winner == address(0)) {
                token.confidentialTransfer(draw.sponsor, prize);
                emit PrizeReturned(id, draw.sponsor, draw.prize);
            } else {
                token.confidentialTransfer(winner, prize);
            }
        }

        emit DrawSettled(id, winner, draw.winnerSlot, draw.prize, nextSlot);

        _drainQueue();
    }

    /// @notice Release a draw that has stopped making progress, and give the prize back.
    ///
    /// @dev Deliberately callable by anyone and deliberately not a keeper privilege. The failure
    ///      this exists for is the keeper going away, so a rescue only the keeper can perform is
    ///      not a rescue. It cannot be used to cancel a draw that is merely slow: the window is
    ///      six hours and a draw takes minutes.
    ///
    ///      No winner is paid and none is invented. The draw is recorded as abandoned at whatever
    ///      level it reached, which is a fact worth keeping on a page that claims verifiability.
    function abandonDraw(uint256 id) external {
        if (id == 0 || id > drawCount) revert NoDraw(id);
        Draw storage draw = _draws[id];
        if (draw.phase == Phase.None || draw.phase == Phase.Settled) {
            revert WrongPhase(id, Phase.Prepared, draw.phase);
        }

        uint32 expiresAt = draw.sealTime + DRAW_TIMEOUT;
        if (block.timestamp < expiresAt) revert NotTimedOut(id, expiresAt);

        draw.phase = Phase.Settled;
        draw.winner = address(0);
        openDraw = 0;

        if (draw.prize > 0) {
            euint64 prize = FHE.asEuint64(draw.prize);
            FHE.allowThis(prize);
            FHE.allowTransient(prize, address(token));
            token.confidentialTransfer(draw.sponsor, prize);
            emit PrizeReturned(id, draw.sponsor, draw.prize);
        }

        emit DrawAbandoned(id, draw.level, msg.sender);

        _drainQueue();
    }

    // ------------------------------------------------------------- internals

    function _mustBe(uint256 id, Phase expected) private view returns (Draw storage draw) {
        if (id == 0 || id > drawCount) revert NoDraw(id);
        draw = _draws[id];
        if (draw.phase != expected) revert WrongPhase(id, expected, draw.phase);
    }
}
