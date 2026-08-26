// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, ebool, euint8, euint32, euint64, euint128} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @notice Spike only. Measures what one level of the draw descent costs, per arity, so the
///         tree arity is chosen from a measurement instead of from arithmetic on the docs.
/// @dev The level is split into two transactions on purpose. The ceiling that binds is the
///      per-transaction *sequential depth* one, and depth accumulates along the dependency
///      chain seal -> prefix -> multiply -> compare. Splitting the level resets it.
contract HcuProbe is ZamaEthereumConfig {
    uint8 public constant MAX_K = 32;

    euint64[MAX_K] private _a;
    euint64[MAX_K] private _b;
    euint64[MAX_K] private _c;
    euint64[MAX_K] private _sealedWeight;

    euint8 public index;

    /// @notice Seed k children with trivially-encrypted aggregates. Setup, not measured.
    function seed(uint8 k) external {
        for (uint8 i = 0; i < k; i++) {
            _a[i] = FHE.asEuint64(uint64(1_000 + i));
            _b[i] = FHE.asEuint64(uint64(100 + i));
            _c[i] = FHE.asEuint64(uint64(10 + i));
            FHE.allowThis(_a[i]);
            FHE.allowThis(_b[i]);
            FHE.allowThis(_c[i]);
        }
    }

    /// @notice One level, in a single transaction. Kept to show where the ceiling bites.
    function probeLevel(uint8 k, uint64 T) external {
        _seal(k, T);
        _select(k);
    }

    /// @notice Transaction one of a split level: seal every child at time T. k independent
    ///         chains, each three operations deep.
    function sealChildren(uint8 k, uint64 T) external {
        _seal(k, T);
    }

    /// @notice Transaction two of a split level: prefix-sum the sealed children, draw the
    ///         point, count how many boundaries it passed. Depth starts fresh here.
    function selectChild(uint8 k) external {
        _select(k);
    }

    /// @notice Same step, but the prefix sums come from a Hillis-Steele scan: log2(k) deep
    ///         instead of k deep, at the cost of k*log2(k) operations instead of k.
    function selectChildScan(uint8 k) external {
        _selectScan(k);
    }

    function _seal(uint8 k, uint64 T) private {
        for (uint8 i = 0; i < k; i++) {
            _sealedWeight[i] = FHE.sub(FHE.add(_a[i], FHE.mul(_b[i], T)), _c[i]);
            FHE.allowThis(_sealedWeight[i]);
        }
    }

    function _selectScan(uint8 k) private {
        euint64[] memory scan = new euint64[](k);
        for (uint8 i = 0; i < k; i++) {
            scan[i] = _sealedWeight[i];
        }

        // Inclusive scan, log2(k) rounds deep.
        for (uint8 d = 1; d < k; d <<= 1) {
            euint64[] memory next = new euint64[](k);
            for (uint8 i = 0; i < k; i++) {
                next[i] = i >= d ? FHE.add(scan[i], scan[i - d]) : scan[i];
            }
            scan = next;
        }

        euint128[] memory prefix = new euint128[](k);
        for (uint8 i = 0; i < k; i++) {
            prefix[i] = FHE.asEuint128(scan[i]);
        }

        _pick(k, prefix);
    }

    function _select(uint8 k) private {
        euint128[] memory prefix = new euint128[](k);

        euint64 running = _sealedWeight[0];
        prefix[0] = FHE.asEuint128(running);
        for (uint8 i = 1; i < k; i++) {
            running = FHE.add(running, _sealedWeight[i]);
            prefix[i] = FHE.asEuint128(running);
        }

        _pick(k, prefix);
    }

    function _pick(uint8 k, euint128[] memory prefix) private {
        // The one euint128 multiply in the whole draw: r * total.
        euint32 r = FHE.randEuint32();
        euint128 product = FHE.mul(FHE.asEuint128(FHE.asEuint64(r)), prefix[k - 1]);

        // Cross-multiplied comparisons: how many prefix boundaries the point has passed.
        euint8 idx = FHE.asEuint8(0);
        for (uint8 i = 0; i + 1 < k; i++) {
            ebool passed = FHE.ge(product, FHE.shl(prefix[i], uint8(32)));
            idx = FHE.add(idx, FHE.asEuint8(passed));
        }

        index = idx;
        FHE.allowThis(index);
        FHE.makePubliclyDecryptable(index);
    }
}
