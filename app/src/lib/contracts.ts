/**
 * Single source of truth for what's deployed on Sepolia. Mirrors
 * `deployments/sepolia.json` at the repo root — update both together when the
 * contracts are redeployed.
 */
import DrawMachineAbi from "./abi/DrawMachine.json";
import ConfidentialUSDTAbi from "./abi/ConfidentialUSDT.json";

export const SEPOLIA_CHAIN_ID = 11155111;

export const DRAW_MACHINE_ADDRESS = "0x04693fF8DbD1d68b71b37CD3Ad4D507502968e79" as const;
export const CONFIDENTIAL_USDT_ADDRESS = "0x829aBacf2D24852F2306c61bB5396C02dc4adf61" as const;

export const drawMachineContract = {
  address: DRAW_MACHINE_ADDRESS,
  abi: DrawMachineAbi,
} as const;

export const confidentialUsdtContract = {
  address: CONFIDENTIAL_USDT_ADDRESS,
  abi: ConfidentialUSDTAbi,
} as const;

/** Pool parameters, fixed at deploy time (`deploy/01_pool.ts`). See docs/DRAW.md §4. */
export const POOL_PARAMS = {
  arity: 16,
  capacity: 4096,
  periodLengthSeconds: 3600,
  treeDepth: 3,
} as const;
