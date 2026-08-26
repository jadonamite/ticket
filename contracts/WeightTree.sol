// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {Limits} from "./Limits.sol";

/// @notice The core of Ticket: odds that are time-weighted, encrypted, and still summable.
///
/// @dev Odds cannot be "balance at draw time" — depositing a moment before the draw and leaving a
///      moment after would be free money, and it is the exploit the whole design exists to close.
///      So the quantity that decides a draw is the *integral of balance over the period*, and it
///      has to be maintained under encryption, where you cannot look at a number to decide what to
///      do next.
///
///      Each node keeps two ciphertexts and two plaintext timestamps:
///
///        A  accumulated integral for the current period, up to `lastUpdate`
///        B  current total balance in this subtree
///
///      and the weight at any later time T is
///
///        weight(T) = A + B * (T - lastUpdate)
///
///      The multiplier is a *plaintext* elapsed time, so this is a ciphertext-by-scalar multiply —
///      one of the cheap operations — not the ciphertext-by-ciphertext multiply that would blow the
///      per-transaction compute budget. Nothing about the balance is revealed by knowing how long
///      it sat there.
///
///      `B` is additive across children by construction, and `A` is the integral of `B`, so a
///      parent's pair is exactly the subtree's pair provided every change folds the whole path to
///      the root before touching a balance. `_update` does that, which is why it walks upward.
///      That is what makes the draw a descent over `depth` levels instead of a scan over `N`
///      depositors.
///
///      Periods reset lazily. A node whose `lastPeriod` is stale has, by definition, an integral of
///      zero for the current period; there is no O(N) reset pass, and there does not need to be.
abstract contract WeightTree is ZamaEthereumConfig {
    struct Node {
        euint64 A;
        euint64 B;
        uint32 lastUpdate;
        uint32 lastPeriod;
    }

    /// @notice Children per node.
    uint32 public immutable arity;

    /// @notice Leaves, and therefore the maximum number of depositors.
    uint32 public immutable capacity;

    /// @notice Levels between the root and a leaf. The number of steps a draw takes.
    uint8 public immutable treeDepth;

    /// @notice Index of the leaf holding slot 0.
    uint32 public immutable leafOffset;

    mapping(uint32 index => Node node) internal _nodes;

    error ArityOutOfRange(uint32 arity);
    error CapacityNotAPowerOfArity(uint32 capacity, uint32 arity);
    error CapacityTooLarge(uint32 capacity);

    /// @param arity_ children per node
    /// @param capacity_ leaf count, which must be an exact power of `arity_`
    constructor(uint32 arity_, uint32 capacity_) {
        if (arity_ < 2 || arity_ > 32) revert ArityOutOfRange(arity_);
        if (capacity_ > Limits.MAX_SLOTS) revert CapacityTooLarge(capacity_);

        // Walk the powers of the arity rather than trusting a log. `internalNodes` accumulates
        // (k^d - 1) / (k - 1) on the way, which is the index the leaves start at.
        uint32 size = 1;
        uint32 internalNodes = 0;
        uint8 d = 0;
        while (size < capacity_) {
            internalNodes += size;
            size *= arity_;
            d += 1;
        }
        if (size != capacity_) revert CapacityNotAPowerOfArity(capacity_, arity_);

        arity = arity_;
        capacity = capacity_;
        treeDepth = d;
        leafOffset = internalNodes;
    }

    /// @notice Index of node `n`'s `j`-th child.
    function childOf(uint32 n, uint32 j) public view returns (uint32) {
        return n * arity + 1 + j;
    }

    /// @notice Index of node `n`'s parent. Undefined at the root.
    function parentOf(uint32 n) public view returns (uint32) {
        return (n - 1) / arity;
    }

    /// @notice The weight of a subtree at time `T`, without writing anything.
    ///
    /// @dev The period branch is on plaintext, not on a ciphertext: whether a node is stale is a
    ///      property of block timestamps, which are public anyway. A stale node contributes only
    ///      the balance it carried into the period.
    function _sealed(uint32 n, uint32 T, uint32 period, uint32 periodStart) internal returns (euint64) {
        Node storage node = _nodes[n];

        euint64 weight;
        if (node.lastPeriod != period) {
            weight = FHE.mul(node.B, uint64(T - periodStart));
        } else {
            weight = FHE.add(node.A, FHE.mul(node.B, uint64(T - node.lastUpdate)));
        }

        FHE.allowThis(weight);
        return weight;
    }

    /// @notice Move a node into the current period, discarding the previous period's integral.
    ///
    /// @dev Odds are per-period, so last period's integral is not merely stale, it is wrong. The
    ///      balance carries over; the integral does not.
    function _roll(uint32 n, uint32 period, uint32 periodStart) internal {
        Node storage node = _nodes[n];
        if (node.lastPeriod == period) return;

        node.A = FHE.asEuint64(0);
        node.lastUpdate = periodStart;
        node.lastPeriod = period;
        FHE.allowThis(node.A);
    }

    /// @notice Fold elapsed time into the integral, bringing `A` current as of `t`.
    function _fold(uint32 n, uint32 t) internal {
        Node storage node = _nodes[n];
        uint32 elapsed = t - node.lastUpdate;
        if (elapsed == 0) return;

        node.A = FHE.add(node.A, FHE.mul(node.B, uint64(elapsed)));
        node.lastUpdate = t;
        FHE.allowThis(node.A);
    }

    /// @notice Let `owner` decrypt their own leaf, and nothing above it.
    ///
    /// @dev A leaf is one depositor, so granting it discloses only what that depositor already
    ///      knows. Internal nodes are sums over other people and are never granted to anyone —
    ///      the contract holds them and the KMS decrypts exactly one of them per draw level.
    ///
    ///      Both halves are granted because the weight is `A + B * (T - lastUpdate)` and the
    ///      elapsed term is plaintext: the owner decrypts two numbers and finishes the arithmetic
    ///      in the clear, which costs the chain nothing.
    function _grantLeaf(uint32 slot, address owner) internal {
        Node storage node = _nodes[leafOffset + slot];
        FHE.allow(node.A, owner);
        FHE.allow(node.B, owner);
    }

    /// @notice A leaf's stored halves, for the owner to decrypt.
    function _leaf(uint32 slot) internal view returns (euint64 a, euint64 b, uint32 lastUpdate, uint32 lastPeriod) {
        Node storage node = _nodes[leafOffset + slot];
        return (node.A, node.B, node.lastUpdate, node.lastPeriod);
    }

    /// @notice Apply a balance change at `slot` and carry it to the root.
    ///
    /// @dev Every node on the path is folded *before* its balance moves, which is what keeps `A`
    ///      the true integral of `B` at every level. Off-path nodes are untouched and stay correct
    ///      on their own terms — their balance did not change, so neither did their integral.
    ///
    /// @param slot the depositor's leaf
    /// @param delta the amount, already clamped to `Limits.MAX_DEPOSIT`
    /// @param subtract true for a withdrawal
    function _update(
        uint32 slot,
        euint64 delta,
        bool subtract,
        uint32 t,
        uint32 period,
        uint32 periodStart
    ) internal {
        uint32 n = leafOffset + slot;

        while (true) {
            _roll(n, period, periodStart);
            _fold(n, t);

            Node storage node = _nodes[n];
            node.B = subtract ? FHE.sub(node.B, delta) : FHE.add(node.B, delta);
            FHE.allowThis(node.B);

            if (n == 0) break;
            n = parentOf(n);
        }
    }
}
