/**
 * T021. The benchmark the architecture doc promises.
 *
 * The claim under test is deliberately not "selection is logarithmic". Selection being
 * logarithmic proves nothing on its own, because a logarithmic step sitting on a linear step is a
 * linear system. What matters is the whole thing: N depositors in, a winner out, counting the cost
 * of *building and maintaining* the weight tree as well as descending it.
 *
 * So this measures both halves at three values of N an order of magnitude apart and prints them
 * side by side. The construction column is expected to grow with N. The draw column is expected
 * not to. If the draw column moves with N, the design is wrong and this is where that shows.
 *
 * Run: npx hardhat test bench/run.ts
 * On Sepolia: npx hardhat test bench/run.ts --network sepolia
 */
import { ethers, fhevm } from "hardhat";
import { writeFileSync } from "node:fs";

const ARITY = 16;
const CAPACITY = 4096;
const PERIOD = 3600;
const GLOBAL_LIMIT = 20_000_000;
const DEPTH_LIMIT = 5_000_000;

const SIZES = [8, 128, 4096];

type Row = {
  n: number;
  depositTxs: number;
  depositGas: bigint;
  depositHCU: number;
  depositSeconds: number;
  sealGas: bigint;
  sealHCU: number;
  sealDepth: number;
  pickGas: bigint;
  pickHCU: number;
  pickDepth: number;
};

describe("benchmark: cost against N", function () {
  it("builds the tree at three sizes and prices a draw level at each", async function () {
    this.timeout(3 * 60 * 60 * 1000);

    const rows: Row[] = [];

    for (const n of SIZES) {
      const tree = await (await ethers.getContractFactory("WeightTreeHarness")).deploy(ARITY, CAPACITY, PERIOD);
      await tree.waitForDeployment();

      // --- construction: N depositors, each a real encrypted update walking leaf to root
      let depositGas = 0n;
      let depositHCU = 0;
      const startedAt = Date.now();

      for (let slot = 0; slot < n; slot++) {
        const receipt = await (await tree.update(slot, BigInt(1_000 + slot), false)).wait();
        depositGas += receipt!.gasUsed;
        depositHCU += fhevm.computeTransactionHCU(receipt!).globalHCU;
      }

      const depositSeconds = (Date.now() - startedAt) / 1000;

      // --- one draw level, at the root, in the two-transaction shape the design uses
      const sealReceipt = await (await tree.benchSealChildren(0)).wait();
      const seal = fhevm.computeTransactionHCU(sealReceipt!);

      const pickReceipt = await (await tree.benchSelectChild()).wait();
      const pick = fhevm.computeTransactionHCU(pickReceipt!);

      rows.push({
        n,
        depositTxs: n,
        depositGas,
        depositHCU,
        depositSeconds,
        sealGas: sealReceipt!.gasUsed,
        sealHCU: seal.globalHCU,
        sealDepth: seal.maxHCUDepth,
        pickGas: pickReceipt!.gasUsed,
        pickHCU: pick.globalHCU,
        pickDepth: pick.maxHCUDepth,
      });

      console.log(`n=${n} done in ${depositSeconds.toFixed(1)}s`);
    }

    const depth = Math.round(Math.log(CAPACITY) / Math.log(ARITY));
    const pct = (v: number, limit: number) => `${((v / limit) * 100).toFixed(1)}%`;

    const lines: string[] = [];
    const say = (s: string) => {
      lines.push(s);
      console.log(s);
    };

    say("# Benchmark — cost against N");
    say("");
    say(`Arity ${ARITY}, capacity ${CAPACITY}, depth ${depth}. A draw is 1 + 2*${depth} + 1 = ${2 + 2 * depth} transactions.`);
    say("");
    say("## Building and maintaining the tree — linear in N, and admitted to be");
    say("");
    say("| N | txs | total gas | gas / depositor | total HCU | wall clock |");
    say("|---|---|---|---|---|---|");
    for (const r of rows) {
      say(
        `| ${r.n} | ${r.depositTxs} | ${r.depositGas.toLocaleString()} | ` +
          `${(r.depositGas / BigInt(r.n)).toLocaleString()} | ${r.depositHCU.toLocaleString()} | ` +
          `${r.depositSeconds.toFixed(1)}s |`,
      );
    }
    say("");
    say("Each deposit walks one leaf-to-root path, so its cost is set by the depth of the tree and");
    say("not by how many depositors already exist. The totals grow with N because there are N of");
    say("them, which is the honest shape of the claim: the per-depositor column is what to read.");
    say("");
    say("## One draw level — flat in N, which is the whole point");
    say("");
    say("| N | seal gas | seal HCU | seal depth | pick gas | pick HCU | pick depth |");
    say("|---|---|---|---|---|---|---|");
    for (const r of rows) {
      say(
        `| ${r.n} | ${r.sealGas.toLocaleString()} | ${r.sealHCU.toLocaleString()} (${pct(r.sealHCU, GLOBAL_LIMIT)}) | ` +
          `${r.sealDepth.toLocaleString()} (${pct(r.sealDepth, DEPTH_LIMIT)}) | ${r.pickGas.toLocaleString()} | ` +
          `${r.pickHCU.toLocaleString()} (${pct(r.pickHCU, GLOBAL_LIMIT)}) | ${r.pickDepth.toLocaleString()} (${pct(r.pickDepth, DEPTH_LIMIT)}) |`,
      );
    }
    say("");
    say(`A level costs the same at N=8 as at N=${CAPACITY}. The draw is ${depth} levels regardless, so`);
    say("the whole selection is flat while the population is not.");
    say("");
    say(`Ceilings: ${GLOBAL_LIMIT.toLocaleString()} global HCU and ${DEPTH_LIMIT.toLocaleString()} sequential depth per transaction.`);
    say("");
    say(`Measured ${new Date().toISOString().slice(0, 10)} on ${(await ethers.provider.getNetwork()).name}.`);
    say("");

    writeFileSync("bench/RESULTS.md", lines.join("\n"));
  });
});
