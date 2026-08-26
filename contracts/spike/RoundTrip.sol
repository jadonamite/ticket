// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @notice Spike only. Proves the three round trips Ticket depends on:
///         encrypted input in, user decryption out, and public decryption verified on chain.
/// @dev Not part of the product. Deleted once the pool carries these paths itself.
contract RoundTrip is ZamaEthereumConfig {
    euint64 private _value;
    euint64 private _second;

    uint64 public revealed;
    bool public finalized;
    bool public pairFinalized;

    error AlreadyFinalized();

    /// @notice Store an encrypted value and grant the sender the right to decrypt it.
    function store(externalEuint64 input, bytes calldata inputProof) external {
        _value = FHE.fromExternal(input, inputProof);
        FHE.allowThis(_value);
        FHE.allow(_value, msg.sender);
    }

    /// @notice The handle, for a user decryption under EIP-712.
    function value() external view returns (euint64) {
        return _value;
    }

    /// @notice Mark the value publicly decryptable. Irreversible, which is why the product
    ///         only ever does this to a draw step index.
    function publish() external {
        FHE.makePubliclyDecryptable(_value);
    }

    /// @notice Two publicly decryptable values, so the ordering of the handle array is
    ///         observable. The draw descent submits several handles at once and its safety
    ///         rests on the proof being bound to their order.
    function publishPair(externalEuint64 a, externalEuint64 b, bytes calldata inputProof) external {
        _value = FHE.fromExternal(a, inputProof);
        _second = FHE.fromExternal(b, inputProof);
        FHE.allowThis(_value);
        FHE.allowThis(_second);
        FHE.makePubliclyDecryptable(_value);
        FHE.makePubliclyDecryptable(_second);
    }

    /// @notice Both handles, in the order the proof must carry them.
    function pair() external view returns (euint64, euint64) {
        return (_value, _second);
    }

    /// @notice Accepts the pair only if the handles arrive in the order they were signed in.
    function finalizePair(bytes32[] calldata handles, uint64 a, uint64 b, bytes calldata decryptionProof) external {
        FHE.checkSignatures(handles, abi.encode(a, b), decryptionProof);
        pairFinalized = true;
    }

    /// @notice Accept a KMS-signed public decryption. Reverts on a forged or reordered proof.
    function finalize(bytes32[] calldata handles, uint64 cleartext, bytes calldata decryptionProof) external {
        if (finalized) revert AlreadyFinalized();
        FHE.checkSignatures(handles, abi.encode(cleartext), decryptionProof);
        revealed = cleartext;
        finalized = true;
    }
}
