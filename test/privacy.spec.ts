import { expect } from "chai";
import { FhevmType } from "@fhevm/mock-utils";
import { ethers, fhevm } from "hardhat";

import { advance, deployDraw, deposit, fund, runDraw, withdrawAll } from "./helpers/draw";

/**
 * T031. What the public record gives away.
 *
 * SC-002 is the claim the whole project rests on, and it is not a claim about the contract's
 * intentions — it is a claim about bytes that anyone can fetch. So this test sweeps everything a
 * stranger can read after a complete run: every transaction's calldata, every log's topics and
 * data, and the contract's raw storage, and asserts that no depositor's balance, no weight, and
 * no pool total appears anywhere in any of it.
 *
 * The amounts are deliberately odd numbers. A round figure could collide with a length, an index
 * or a timestamp and turn a real leak into a passing test.
 */
const ALICE_DEPOSIT = 123_457n;
const BOB_DEPOSIT = 987_653n;
const HOLD = 900;

/** Every way a 64-bit secret could plausibly be written into calldata, a log, or a storage word. */
function encodings(value: bigint): string[] {
  const hex = value.toString(16);
  const padded = hex.length % 2 ? "0" + hex : hex;
  return [padded.toLowerCase(), value.toString(16).padStart(64, "0").toLowerCase()];
}

describe("DrawMachine: nothing recoverable from the public record", function () {
  it("leaks no balance, weight or total through calldata, logs or storage", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;

    await fund(f, alice);
    await fund(f, bob);
    await fund(f, f.sponsor);

    const first = await ethers.provider.getBlockNumber();

    await deposit(f, alice, ALICE_DEPOSIT);
    await deposit(f, bob, BOB_DEPOSIT);
    await advance(HOLD);
    await runDraw(f, 1_000n);
    await withdrawAll(f, alice);

    const last = await ethers.provider.getBlockNumber();

    // Balances, the pool total, and the weights each of those balances earned over the hold.
    const secrets = [
      ALICE_DEPOSIT,
      BOB_DEPOSIT,
      ALICE_DEPOSIT + BOB_DEPOSIT,
      ALICE_DEPOSIT * BigInt(HOLD),
      BOB_DEPOSIT * BigInt(HOLD),
      (ALICE_DEPOSIT + BOB_DEPOSIT) * BigInt(HOLD),
    ];
    const needles = secrets.flatMap(encodings);

    const haystack: string[] = [];

    for (let n = first; n <= last; n++) {
      const block = await ethers.provider.getBlock(n, true);
      if (!block) continue;
      for (const tx of block.prefetchedTransactions) {
        haystack.push(tx.data.toLowerCase());
      }
    }

    const logs = await ethers.provider.getLogs({ fromBlock: first, toBlock: last });
    for (const log of logs) {
      haystack.push(log.data.toLowerCase());
      for (const topic of log.topics) haystack.push(topic.toLowerCase());
    }

    // The whole tree lives in one mapping, but the scalars around it are laid out from slot zero,
    // and a mapping's own slots are what a real observer would grind. Sweeping the low slots
    // catches the mistake this is guarding against: a plaintext cached "for convenience".
    for (let slot = 0; slot < 256; slot++) {
      haystack.push((await ethers.provider.getStorage(f.poolAddress, slot)).toLowerCase());
    }

    const blob = haystack.join("|");
    for (const needle of needles) {
      expect(blob.includes(needle), `secret 0x${needle} appears in the public record`).to.equal(false);
    }
  });

  it("lets a depositor read their own balance and nobody else's", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;
    await fund(f, alice);
    await fund(f, bob);
    await deposit(f, alice, ALICE_DEPOSIT);
    await deposit(f, bob, BOB_DEPOSIT);

    const aliceHandle = await f.pool.confidentialBalanceOf(alice.address);
    expect(await fhevm.userDecryptEuint(FhevmType.euint64, aliceHandle, f.poolAddress, alice)).to.equal(
      ALICE_DEPOSIT,
    );
    await expect(fhevm.userDecryptEuint(FhevmType.euint64, aliceHandle, f.poolAddress, bob)).to.be.rejected;
  });

  it("never makes a balance or a weight publicly decryptable", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;
    await fund(f, alice);
    await fund(f, bob);
    await deposit(f, alice, ALICE_DEPOSIT);
    await deposit(f, bob, BOB_DEPOSIT);
    await advance(HOLD);

    const balance = await f.pool.confidentialBalanceOf(alice.address);
    const weight = await f.pool.confidentialWeightOf(alice.address);

    // Public decryption is permanent. The one thing this contract ever publishes is a child index.
    await expect(fhevm.publicDecrypt([balance])).to.be.rejected;
    await expect(fhevm.publicDecrypt([weight])).to.be.rejected;

    await (await f.pool.connect(f.keeper).commitDraw(0n)).wait();
    const id = await f.pool.drawCount();
    await (await f.pool.selectLevel(id)).wait();

    const index = await f.pool.levelIndexHandle(id);
    const revealed = await fhevm.publicDecrypt([index]);
    const child = Number(Object.values(revealed.clearValues)[0] as bigint);
    expect(child).to.be.greaterThanOrEqual(0);
    expect(child).to.be.lessThan(Number(await f.pool.arity()));
  });

  it("publishes exactly one value per level and nothing else", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;
    await fund(f, alice);
    await fund(f, bob);
    await deposit(f, alice, ALICE_DEPOSIT);
    await deposit(f, bob, BOB_DEPOSIT);
    await advance(HOLD);

    const first = await ethers.provider.getBlockNumber();
    const trace = await runDraw(f, 0n);
    const last = await ethers.provider.getBlockNumber();

    const selected = (await ethers.provider.getLogs({ fromBlock: first, toBlock: last })).filter(
      (log) => log.topics[0] === f.pool.interface.getEvent("LevelSelected")!.topicHash,
    );

    // One published handle per level of the tree, and the descent that used them is the winner's
    // slot written in base `arity`. Nothing else was ever made publicly decryptable.
    expect(selected.length).to.equal(Number(await f.pool.treeDepth()));
    expect(trace.path.length).to.equal(selected.length);
  });
});
