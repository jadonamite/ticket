// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

/// @notice A faucet-mintable confidential token, so the demo has something to deposit.
///
/// @dev The pool takes any `IERC7984`; this is a constructor argument, not a dependency. If an
///      official cUSDT lands on Sepolia, point the pool at it and this contract goes away. The
///      mint is deliberately permissionless and rate-limited per address rather than owner-gated:
///      a judge should be able to try the product without asking anyone for tokens.
///
///      Not for any network where the balances mean something.
contract ConfidentialUSDT is ERC7984, ZamaEthereumConfig {
    /// @dev 1,000 tokens at 6 decimals. Enough to demonstrate, too little to distort a pool.
    uint64 public constant FAUCET_AMOUNT = 1_000_000_000;

    /// @dev One claim per address per period. Long enough to deter scripted draining, short
    ///      enough that a judge retrying an hour later is not blocked.
    uint32 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address account => uint256 timestamp) public lastClaimed;

    error FaucetCooldown(uint256 availableAt);

    event FaucetClaimed(address indexed account);

    /// @inheritdoc ERC7984
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    constructor() ERC7984("Confidential USDT (demo)", "cUSDT", "") {}

    /// @notice Mint the caller a fixed amount of demo tokens.
    function claim() external {
        uint256 availableAt = lastClaimed[msg.sender] + FAUCET_COOLDOWN;
        if (lastClaimed[msg.sender] != 0 && block.timestamp < availableAt) {
            revert FaucetCooldown(availableAt);
        }
        lastClaimed[msg.sender] = block.timestamp;

        euint64 amount = FHE.asEuint64(FAUCET_AMOUNT);
        FHE.allowThis(amount);
        _mint(msg.sender, amount);

        emit FaucetClaimed(msg.sender);
    }

    /// @notice When the caller may claim again. Zero means now.
    function claimableAt(address account) external view returns (uint256) {
        if (lastClaimed[account] == 0) return 0;
        return lastClaimed[account] + FAUCET_COOLDOWN;
    }
}
