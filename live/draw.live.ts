/**
 * The engine, against real infrastructure.
 *
 * Everything in `test/` runs on the Hardhat mock, which enforces the compute ceilings but fakes
 * the two things that can only fail in production: the relayer that decrypts a published handle,
 * and the KMS signature the contract checks it against. A draw that passes on the mock and hangs
 * on Sepolia is a draw that does not exist.
 *
 * So this drives the *deployed* contracts — not a fresh deployment — through a complete draw, and
 * prints what each step actually cost in gas and in wall time. The wall time is the number that
 * matters for the interface: it is how long a depositor watches the screen.
 *
 * Run: npx hardhat test live/draw.live.ts --network sepolia
 */
import { expect } from "chai";
import { FhevmType } from "@fhevm/mock-utils";
import { readFileSync, writeFileSync } from "node:fs";
import { ethers, fhevm } from "hardhat";

import type { ConfidentialUSDT, DrawMachine } from "../types";

const DEPLOYMENT = "deployments/sepolia.json";

/** Seconds of real elapsed time to let the weights accrue before sealing. */
const HOLD = 90;

/** The relayer materialises a newly published handle a beat after the block lands. */
async function withRetry<T>(what: string, fn: () => Promise<T>, attempts = 12, gapMs = 5_000): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      process.stdout.write(`  ${what}: attempt ${i + 1} failed, retrying\n`);
      await new Promise((r) => setTimeout(r, gapMs));
    }
  }
  throw last;
}

interface Step {
  name: string;
  gas: bigint;
  seconds: number;
  hcu?: number;
  depth?: number;
}

/**
 * The compute figures come from the coprocessor's own events, which are emitted on Sepolia as
 * well as on the mock — so the sizing that chose arity 16 can be checked against the real thing
 * rather than only against a simulation. Guarded, because it is the plugin's mock utility and it
 * is entitled to refuse.
 */
function hcuOf(fhevmApi: any, receipt: any): { hcu?: number; depth?: number } {
  try {
    const info = fhevmApi.computeTransactionHCU(receipt);
    return { hcu: info.globalHCU, depth: info.maxHCUDepth };
  } catch {
    return {};
  }
}

describe("live: a draw on Sepolia", function () {
  it("runs the deployed pool through a complete draw", async function () {
    this.timeout(60 * 60 * 1000);

    const deployment = JSON.parse(readFileSync(DEPLOYMENT, "utf8"));
    const poolAddress: string = deployment.contracts.DrawMachine.address;
    const tokenAddress: string = deployment.contracts.ConfidentialUSDT.address;

    const [deployer, keeper] = await ethers.getSigners();
    const alice = deployer;
    const bob = keeper;

    const pool = (await ethers.getContractAt("DrawMachine", poolAddress)) as unknown as DrawMachine;
    const token = (await ethers.getContractAt("ConfidentialUSDT", tokenAddress)) as unknown as ConfidentialUSDT;

    console.log(`pool   ${poolAddress}`);
    console.log(`token  ${tokenAddress}`);
    console.log(`arity ${await pool.arity()} · depth ${await pool.treeDepth()}`);

    const steps: Step[] = [];
    const timed = async (name: string, send: () => Promise<any>) => {
      const at = Date.now();
      const receipt = await (await send()).wait();
      const seconds = (Date.now() - at) / 1000;
      const compute = hcuOf(fhevm, receipt);
      steps.push({ name, gas: receipt.gasUsed, seconds, ...compute });
      const hcuText = compute.hcu === undefined ? "" : `   ${compute.hcu.toLocaleString()} HCU`;
      console.log(
        `  ${name.padEnd(18)} ${receipt.gasUsed.toString().padStart(9)} gas   ${seconds.toFixed(1)}s${hcuText}`,
      );
      return receipt;
    };

    // --- funding -----------------------------------------------------------
    for (const who of [alice, bob]) {
      const claimableAt = await token.claimableAt(who.address);
      if (Number(claimableAt) * 1000 <= Date.now()) {
        await timed(`claim ${who.address.slice(0, 8)}`, () => token.connect(who).claim());
      }
      await timed(`operator ${who.address.slice(0, 8)}`, () => token.connect(who).setOperator(poolAddress, 2 ** 40));
    }

    // --- deposits ----------------------------------------------------------
    const amounts: Record<string, bigint> = { [alice.address]: 400_000n, [bob.address]: 600_000n };
    for (const who of [alice, bob]) {
      const input = fhevm.createEncryptedInput(poolAddress, who.address);
      input.add64(amounts[who.address]);
      const enc = await withRetry("encrypt input", () => input.encrypt());
      await timed(`deposit ${who.address.slice(0, 8)}`, () =>
        pool.connect(who).deposit(enc.handles[0], enc.inputProof),
      );
    }

    // A depositor can read their own balance and nobody else's — the same claim as the mock
    // test, made against the real KMS this time.
    const aliceHandle = await pool.confidentialBalanceOf(alice.address);
    const aliceBalance = await withRetry("user decrypt", () =>
      fhevm.userDecryptEuint(FhevmType.euint64, aliceHandle, poolAddress, alice),
    );
    console.log(`alice reads her own balance: ${aliceBalance}`);

    // --- hold --------------------------------------------------------------
    // Odds are the integral of balance over time. With no elapsed time there is nothing to
    // weigh, so the seal has to come after a real wait — this is the product working, not a
    // test artefact.
    console.log(`holding ${HOLD}s so the weights accrue`);
    await new Promise((r) => setTimeout(r, HOLD * 1000));

    // --- the draw ----------------------------------------------------------
    const drawStarted = Date.now();
    await timed("commitDraw", () => pool.connect(keeper).commitDraw(false, ethers.ZeroHash, "0x"));
    const id = await pool.drawCount();
    console.log(`draw ${id}`);

    const depth = Number(await pool.treeDepth());
    const path: number[] = [];

    for (let level = 0; level < depth; level++) {
      await timed(`selectLevel ${level}`, () => pool.connect(keeper).selectLevel(id));

      const handle = await pool.levelIndexHandle(id);
      const at = Date.now();
      const result = await withRetry("public decrypt", () => fhevm.publicDecrypt([handle]));
      const kmsSeconds = (Date.now() - at) / 1000;
      steps.push({ name: `kms ${level}`, gas: 0n, seconds: kmsSeconds });
      const child = Number(Object.values(result.clearValues)[0] as bigint);
      console.log(`  ${`kms ${level}`.padEnd(18)} ${"—".padStart(9)}       ${kmsSeconds.toFixed(1)}s   child ${child}`);

      await timed(`revealLevel ${level}`, () =>
        pool.connect(keeper).revealLevel(id, [handle], child, result.decryptionProof),
      );
      path.push(child);
    }

    await timed("settle", () => pool.connect(keeper).settle(id));
    const drawSeconds = (Date.now() - drawStarted) / 1000;

    const draw = await pool.drawOf(id);
    console.log(`winner  ${draw.winner}  slot ${draw.winnerSlot}  path [${path.join(", ")}]`);
    console.log(`draw took ${drawSeconds.toFixed(1)}s end to end`);

    expect([alice.address, bob.address]).to.include(draw.winner);

    const arity = Number(await pool.arity());
    expect(path.reduce((acc, d) => acc * arity + d, 0)).to.equal(Number(draw.winnerSlot));

    // --- the record --------------------------------------------------------
    const drawGas = steps
      .filter((s) => /commitDraw|selectLevel|revealLevel|settle/.test(s.name))
      .reduce((a, s) => a + s.gas, 0n);

    const lines = [
      "# Live draw on Sepolia",
      "",
      `Pool \`${poolAddress}\` · token \`${tokenAddress}\` · draw ${id} · ${new Date().toISOString()}`,
      "",
      `Winner \`${draw.winner}\`, slot ${draw.winnerSlot}, descent path [${path.join(", ")}].`,
      `The whole draw took **${drawSeconds.toFixed(1)}s** and **${drawGas.toString()} gas** across`,
      `${1 + 2 * depth + 1} transactions and ${depth} KMS round trips.`,
      "",
      "| step | gas | seconds | global HCU | depth |",
      "|---|---:|---:|---:|---:|",
      ...steps.map(
        (s) =>
          `| ${s.name} | ${s.gas === 0n ? "—" : s.gas.toString()} | ${s.seconds.toFixed(1)} | ` +
          `${s.hcu?.toLocaleString() ?? "—"} | ${s.depth?.toLocaleString() ?? "—"} |`,
      ),
      "",
    ];
    writeFileSync("bench/LIVE.md", lines.join("\n"));
    console.log("wrote bench/LIVE.md");
  });
});
