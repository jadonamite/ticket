// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, ebool, euint8, euint32, euint64, euint128} from "@fhevm/solidity/lib/FHE.sol";

import {WeightTree} from "../WeightTree.sol";

/// @notice Test-only access to the tree's internals.
///
/// @dev The integral is the one piece of arithmetic in Ticket that cannot be eyeballed, because
///      it is encrypted at every step. This exists so a test can drive it directly and compare it
///      against a cleartext model, node by node, without the token or the draw in the way.
///
///      Amounts arrive in the clear here on purpose: `TicketPool` already covers the encrypted
///      input path, and what is under test is the accumulation, not the plumbing.
contract WeightTreeHarness is WeightTree {
    uint32 public immutable genesis;
    uint32 public immutable periodLength;

    euint64 public sealedWeight;

    /// @dev Bench-only scratch space for one level of the draw descent.
    uint32 private constant MAX_ARITY = 32;
    euint64[MAX_ARITY] private _children;
    euint8 public pickedIndex;

    constructor(uint32 arity_, uint32 capacity_, uint32 periodLength_) WeightTree(arity_, capacity_) {
        periodLength = periodLength_;
        genesis = uint32(block.timestamp);
    }

    function currentPeriod() public view returns (uint32) {
        return (uint32(block.timestamp) - genesis) / periodLength;
    }

    function periodStart(uint32 period) public view returns (uint32) {
        return genesis + period * periodLength;
    }

    function update(uint32 slot, uint64 amount, bool subtract) external {
        euint64 delta = FHE.asEuint64(amount);
        FHE.allowThis(delta);

        uint32 period = currentPeriod();
        _update(slot, delta, subtract, uint32(block.timestamp), period, periodStart(period));
    }

    /// @notice Seal a node at the current block time and hand the result to the caller.
    function seal(uint32 node) external {
        uint32 period = currentPeriod();
        sealedWeight = _sealed(node, uint32(block.timestamp), period, periodStart(period));
        FHE.allow(sealedWeight, msg.sender);
    }

    // ------------------------------------------------------- one draw level

    /// @notice Transaction one of a level: seal every child of `node` against real tree state.
    ///
    /// @dev Split from the pick because sealing is `k` independent chains while picking is one
    ///      long one, and the per-transaction ceiling that bites is sequential depth, not total
    ///      work. Splitting hands the whole depth budget to the half that needs it.
    function benchSealChildren(uint32 node) external {
        uint32 period = currentPeriod();
        uint32 start = periodStart(period);
        uint32 t = uint32(block.timestamp);

        for (uint32 j = 0; j < arity; j++) {
            _children[j] = _sealed(childOf(node, j), t, period, start);
        }
    }

    /// @notice Transaction two of a level: pick one child in proportion to its sealed weight.
    ///
    /// @dev The prefix sums come from a Hillis-Steele scan rather than a running total. A running
    ///      total is `k - 1` additions deep and blows the sequential-depth ceiling at k=16; the
    ///      scan is log2(k) deep for k*log2(k) additions, trading total work, which is slack, for
    ///      depth, which is not.
    ///
    ///      The comparison is cross-multiplied. `FHE.randEuint32` is uniform over exactly 2^32, so
    ///      testing `r * total < prefix_j * 2^32` picks a child in proportion to its weight without
    ///      dividing by an encrypted total and without rejection sampling — rejection would leak a
    ///      bit about the pool's size every time it retried.
    function benchSelectChild() external {
        uint32 k = arity;

        euint64[] memory scan = new euint64[](k);
        for (uint32 i = 0; i < k; i++) {
            scan[i] = _children[i];
        }
        for (uint32 d = 1; d < k; d <<= 1) {
            euint64[] memory next = new euint64[](k);
            for (uint32 i = 0; i < k; i++) {
                next[i] = i >= d ? FHE.add(scan[i], scan[i - d]) : scan[i];
            }
            scan = next;
        }

        euint128[] memory prefix = new euint128[](k);
        for (uint32 i = 0; i < k; i++) {
            prefix[i] = FHE.asEuint128(scan[i]);
        }

        euint32 r = FHE.randEuint32();
        euint128 point = FHE.mul(FHE.asEuint128(FHE.asEuint64(r)), prefix[k - 1]);

        euint8 idx = FHE.asEuint8(0);
        for (uint32 i = 0; i + 1 < k; i++) {
            ebool passed = FHE.ge(point, FHE.shl(prefix[i], uint8(32)));
            idx = FHE.add(idx, FHE.asEuint8(passed));
        }

        pickedIndex = idx;
        FHE.allowThis(pickedIndex);
        FHE.makePubliclyDecryptable(pickedIndex);
    }
}
