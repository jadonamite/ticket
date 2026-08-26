/**
 * T007. What one level of the draw descent actually costs, per arity.
 *
 * The two ceilings that matter are the per-transaction HCU limits: 20,000,000 global and
 * 5,000,000 sequential depth. A level that breaches either reverts, and it would revert in
 * the middle of the demo. Arity is chosen from this table, not from arithmetic on the docs.
 *
 * Run: npx hardhat test bench/hcu-probe.ts
 * On Sepolia: npx hardhat test bench/hcu-probe.ts --network sepolia
 */
import { ethers, fhevm } from "hardhat";

const GLOBAL_LIMIT = 20_000_000;
const DEPTH_LIMIT = 5_000_000;

describe("HCU probe: one draw level, by arity", function () {
  it("measures global HCU, sequential depth and gas", async function () {
    this.timeout(600_000);

    const factory = await ethers.getContractFactory("HcuProbe");
    const probe = await factory.deploy();
    await probe.waitForDeployment();

    console.log("");
    console.log("arity |    global HCU |     max depth |     gas | global % | depth %");
    console.log("------+---------------+---------------+---------+----------+--------");

    for (const k of [2, 4, 8, 16, 32]) {
      await (await probe.seed(k)).wait();

      const receipt = await (await probe.probeLevel(k, 100_000n)).wait();
      const hcu = fhevm.computeTransactionHCU(receipt!);

      const globalPct = ((hcu.globalHCU / GLOBAL_LIMIT) * 100).toFixed(1);
      const depthPct = ((hcu.maxHCUDepth / DEPTH_LIMIT) * 100).toFixed(1);

      console.log(
        `${String(k).padStart(5)} | ${String(hcu.globalHCU).padStart(13)} | ` +
          `${String(hcu.maxHCUDepth).padStart(13)} | ${String(receipt!.gasUsed).padStart(7)} | ` +
          `${globalPct.padStart(7)}% | ${depthPct.padStart(6)}%`,
      );
    }
    console.log("");
  });
});
