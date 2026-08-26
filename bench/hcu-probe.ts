/**
 * T007. What one level of the draw descent actually costs, per arity.
 *
 * The two per-transaction ceilings are 20,000,000 global HCU and 5,000,000 sequential depth.
 * A level that breaches either reverts, and it would revert in the middle of the demo.
 * Arity is chosen from this table, not from arithmetic on the docs.
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

    const row = (label: string, receipt: any) => {
      const hcu = fhevm.computeTransactionHCU(receipt);
      const g = ((hcu.globalHCU / GLOBAL_LIMIT) * 100).toFixed(1);
      const d = ((hcu.maxHCUDepth / DEPTH_LIMIT) * 100).toFixed(1);
      console.log(
        `${label.padEnd(16)} | ${String(hcu.globalHCU).padStart(10)} | ${String(hcu.maxHCUDepth).padStart(10)} | ` +
          `${String(receipt.gasUsed).padStart(8)} | ${g.padStart(6)}% | ${d.padStart(6)}%`,
      );
    };

    const attempt = async (label: string, send: () => Promise<any>) => {
      try {
        row(label, await (await send()).wait());
      } catch (e) {
        const m = (e as Error).message;
        const reason = m.includes("HCUTransactionDepthLimitExceeded")
          ? "REVERTED — sequential depth limit"
          : m.includes("HCUTransactionLimitExceeded")
            ? "REVERTED — global limit"
            : `REVERTED — ${m.slice(0, 40)}`;
        console.log(`${label.padEnd(16)} | ${reason}`);
      }
    };

    console.log("");
    console.log("step             | global HCU |  max depth |      gas | global | depth");
    console.log("-----------------+------------+------------+----------+--------+-------");

    for (const k of [2, 4, 8, 16, 32]) {
      await (await probe.seed(k)).wait();
      await attempt(`k=${k} one tx`, () => probe.probeLevel(k, 100_000n));
      await attempt(`k=${k} split/seal`, () => probe.sealChildren(k, 100_000n));
      await attempt(`k=${k} split/pick`, () => probe.selectChild(k));
      await attempt(`k=${k} split/scan`, () => probe.selectChildScan(k));
      console.log("-----------------+------------+------------+----------+--------+-------");
    }
    console.log("");
  });
});
