// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @notice The three caps that keep the encrypted time-weighted integral inside `euint64`.
///
/// @dev FHE arithmetic wraps silently — there is no revert-on-overflow and there cannot be one,
///      because detecting it would mean branching on a ciphertext. Every bound below is therefore
///      enforced before a value can enter an aggregate: the plaintext ones with `require`, the
///      encrypted one by clamping with `FHE.min`.
///
///      The arithmetic they protect:
///
///        B  = sum of balances                        <= MAX_DEPOSIT * MAX_SLOTS = 2^44
///        dt = seconds since the aggregate last moved <= MAX_PERIOD              = 2^19
///        weight = A + B*dt, and A + B*dt is the integral of balance over one period,
///        so it is bounded by B * MAX_PERIOD                                     = 2^63
///
///      2^63 sits one bit under the `euint64` ceiling. That last bit is the margin, and it is the
///      reason these are constants in a shared file rather than three numbers chosen locally.
library Limits {
    /// @dev 2^32 base units. At 6 decimals that is ~4.29 million tokens in a single deposit.
    uint64 internal constant MAX_DEPOSIT = 4_294_967_296;

    /// @dev 2^12 slots. One slot per depositor, assigned on first deposit and never reused.
    uint32 internal constant MAX_SLOTS = 4096;

    /// @dev 2^19 seconds, ~6.1 days. A draw period may not be longer.
    uint32 internal constant MAX_PERIOD = 524_288;
}
