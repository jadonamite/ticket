import { setDefaultResultOrder } from "node:dns";

// Some networks resolve RPC hosts to IPv6 addresses they cannot actually reach, and the
// failure surfaces as ENETUNREACH on a perfectly good endpoint. Prefer IPv4.
setDefaultResultOrder("ipv4first");

import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";

import "./tasks/accounts";
import "./tasks/keeper";
import "./tasks/whale";

// `npx hardhat vars set MNEMONIC` / `SEPOLIA_RPC_URL` / `ETHERSCAN_API_KEY`
const MNEMONIC: string = vars.get("MNEMONIC", "test test test test test test test test test test test junk");
// The environment wins over the stored variable, so a run can be pointed at the retrying local
// proxy (`node scripts/rpc-proxy.mjs`) without changing anything stored.
const SEPOLIA_RPC_URL: string =
  process.env.SEPOLIA_RPC_URL ?? vars.get("SEPOLIA_RPC_URL", "https://ethereum-sepolia-rpc.publicnode.com");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
    keeper: 1,
  },
  etherscan: {
    apiKey: { sepolia: vars.get("ETHERSCAN_API_KEY", "") },
  },
  // Sepolia tests wait on the relayer and the KMS, which are network round trips measured in
  // tens of seconds, not the milliseconds Mocha assumes by default.
  mocha: {
    timeout: 600000,
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
  },
  networks: {
    hardhat: {
      accounts: { mnemonic: MNEMONIC },
      chainId: 31337,
    },
    sepolia: {
      accounts: { mnemonic: MNEMONIC, path: "m/44'/60'/0'/0/", count: 10 },
      chainId: 11155111,
      url: SEPOLIA_RPC_URL,
      timeout: 120_000,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: { bytecodeHash: "none" },
      optimizer: { enabled: true, runs: 800 },
      evmVersion: "cancun",
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
