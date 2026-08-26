// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, ebool, euint8, euint32, euint64, euint128} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @notice Spike only. Measures what one level of the draw descent actually costs, so the
///         tree arity is chosen from a measurement instead of from arithmetic on the docs.
/// @dev Mirrors the real `prepareLevel` computation exactly: seal each child, prefix-sum,
///      one euint128 multiply, cross-multiplied comparisons, sum the bools into an index.
contract HcuProbe is ZamaEthereumConfig {
    uint8 public constant MAX_K = 32;

    euint64[MAX_K] private _a;
    euint64[MAX_K] private _b;
    euint64[MAX_K] private _c;

    euint8 public index;

    /// @notice Seed k children with trivially-encrypted aggregates. Setup, measured separately.
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

    /// @notice One level of the descent, at the top of the tree where the multiply happens.
    /// @param k arity under test
    /// @param T seal time, public
    function probeLevel(uint8 k, uint64 T) external {
        euint128[] memory prefix = new euint128[](k);

        // Seal each child: A + T*B - C. One scalar multiply, one add, one sub, per child.
        euint64 running = FHE.asEuint64(0);
        for (uint8 i = 0; i < k; i++) {
            euint64 sealedWeight = FHE.sub(FHE.add(_a[i], FHE.mul(_b[i], T)), _c[i]);
            running = FHE.add(running, sealedWeight);
            prefix[i] = FHE.asEuint128(running);
        }

        // One euint128 multiply in the whole draw: r * total.
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
