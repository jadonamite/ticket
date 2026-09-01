import { expect } from "chai";
import { ethers } from "hardhat";

import {
  PERIOD,
  PROD_ARITY,
  PROD_CAPACITY,
  advance,
  deployDraw,
  deposit,
  fund,
  poolBalance,
  runDraw,
  tokenBalance,
  withdrawAll,
} from "./helpers/draw";

/**
 * T030. A draw, end to end.
 *
 * The claim under test is the whole product in one line: two people deposit, one of them wins a
 * sponsor-funded prize, and neither the contract nor anyone watching it ever read a balance to
 * decide which. Principal is untouched on both sides.
 */
describe("DrawMachine: a draw end to end", function () {
  it("commits, descends every level, and pays exactly one winner", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;

    await fund(f, alice);
    await fund(f, bob);
    await fund(f, f.sponsor);

    await deposit(f, alice, 400n);
    await deposit(f, bob, 600n);
    await advance(600);

    const prize = 1_000n;
    const sponsorBefore = await tokenBalance(f, f.sponsor);
    const aliceBefore = await tokenBalance(f, alice);
    const bobBefore = await tokenBalance(f, bob);

    const trace = await runDraw(f, prize);

    // The descent is one child index per level, and the digits reconstruct the winner's slot.
    const arity = Number(await f.pool.arity());
    const reconstructed = trace.path.reduce((acc, digit) => acc * arity + digit, 0);
    expect(reconstructed).to.equal(trace.winnerSlot);

    expect([alice.address, bob.address]).to.include(trace.winner);

    // Exactly one of them is richer, by exactly the prize, and nobody else moved.
    const aliceAfter = await tokenBalance(f, alice);
    const bobAfter = await tokenBalance(f, bob);
    const winnerIsAlice = trace.winner === alice.address;

    expect(aliceAfter - aliceBefore).to.equal(winnerIsAlice ? prize : 0n);
    expect(bobAfter - bobBefore).to.equal(winnerIsAlice ? 0n : prize);
    expect(await tokenBalance(f, f.sponsor)).to.equal(sponsorBefore - prize);

    // Principal is not a prize pool. Neither stake moved.
    expect(await poolBalance(f, alice)).to.equal(400n);
    expect(await poolBalance(f, bob)).to.equal(600n);
  });

  it("returns both principals in full after the draw", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;

    await fund(f, alice);
    await fund(f, bob);

    const aliceStart = await tokenBalance(f, alice);
    const bobStart = await tokenBalance(f, bob);

    await deposit(f, alice, 250n);
    await deposit(f, bob, 750n);
    await advance(600);
    await runDraw(f, 0n);

    await withdrawAll(f, alice);
    await withdrawAll(f, bob);

    expect(await tokenBalance(f, alice)).to.equal(aliceStart);
    expect(await tokenBalance(f, bob)).to.equal(bobStart);
  });

  it("lands on a depositor rather than an empty leaf", async function () {
    const f = await deployDraw();
    const [, alice, bob, carol] = f.signers;

    for (const who of [alice, bob, carol]) {
      await fund(f, who);
      await deposit(f, who, 100n);
    }
    await advance(600);

    // Three of sixteen leaves are occupied. An empty leaf has zero weight, and a zero-weight
    // child shares its prefix with the child before it, so the count that picks the index steps
    // straight over it. No branch on a ciphertext is needed to exclude it.
    for (let i = 0; i < 4; i++) {
      const trace = await runDraw(f, 0n);
      expect(trace.winnerSlot).to.be.lessThan(3);
      expect([alice.address, bob.address, carol.address]).to.include(trace.winner);
    }
  });

  it("refuses a second draw while one is in flight, and reopens after settle", async function () {
    const f = await deployDraw();
    const [, alice] = f.signers;
    await fund(f, alice);
    await deposit(f, alice, 100n);

    await (await f.pool.connect(f.keeper).commitDraw(0n)).wait();
    await expect(f.pool.connect(f.keeper).commitDraw(0n)).to.be.revertedWithCustomError(f.pool, "DrawInFlight");

    const id = await f.pool.drawCount();
    const depth = Number(await f.pool.treeDepth());
    for (let level = 0; level < depth; level++) {
      await (await f.pool.selectLevel(id)).wait();
      const handle = await f.pool.levelIndexHandle(id);
      const { fhevm } = await import("hardhat");
      const result = await fhevm.publicDecrypt([handle]);
      const child = Number(Object.values(result.clearValues)[0] as bigint);
      await (await f.pool.revealLevel(id, [handle], child, result.decryptionProof)).wait();
    }
    await (await f.pool.settle(id)).wait();

    expect(await f.pool.drawInFlight()).to.equal(false);
    await (await f.pool.connect(f.keeper).commitDraw(0n)).wait();
  });

  it("refuses to open a draw over an empty pool", async function () {
    const f = await deployDraw();
    await expect(f.pool.connect(f.keeper).commitDraw(0n)).to.be.revertedWithCustomError(f.pool, "EmptyPool");
  });

  it("only the keeper may open a draw, but anyone may push it forward", async function () {
    const f = await deployDraw();
    const [, alice] = f.signers;
    await fund(f, alice);
    await deposit(f, alice, 100n);

    await expect(f.pool.connect(alice).commitDraw(0n)).to.be.revertedWithCustomError(f.pool, "NotKeeper");

    await (await f.pool.connect(f.keeper).commitDraw(0n)).wait();
    // A half-finished draw holds the pool still, so stranding one must not be possible.
    await (await f.pool.connect(alice).selectLevel(await f.pool.drawCount())).wait();
  });

  it("runs at the production arity of 16 over 4,096 leaves", async function () {
    const f = await deployDraw(PROD_ARITY, PROD_CAPACITY);
    const [, alice, bob] = f.signers;

    await fund(f, alice);
    await fund(f, bob);
    await fund(f, f.sponsor);
    await deposit(f, alice, 1_000n);
    await deposit(f, bob, 1_000n);
    await advance(600);

    const trace = await runDraw(f, 500n);
    expect(trace.path.length).to.equal(3);
    expect([alice.address, bob.address]).to.include(trace.winner);
  });

  it("keeps the odds a withdrawal already earned, within the same period", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;
    await fund(f, alice);
    await fund(f, bob);

    await deposit(f, alice, 1_000n);
    await advance(600);
    await withdrawAll(f, alice);

    // Odds are the integral of balance over the period, not the balance at the end of it. Alice
    // held a thousand units for ten minutes and that is hers; taking her money out does not
    // retroactively delete it. Bob deposits nothing, so Alice is the only weight in the tree.
    await deposit(f, bob, 1n);
    const trace = await runDraw(f, 0n);
    expect(trace.winner).to.equal(alice.address);
  });

  it("returns the prize to the sponsor when no weight survived into the period", async function () {
    const f = await deployDraw();
    const [, alice] = f.signers;
    await fund(f, alice);
    await fund(f, f.sponsor);

    await deposit(f, alice, 100n);
    await advance(600);
    await withdrawAll(f, alice);

    // A period boundary discards the previous period's integral, and Alice's balance is zero, so
    // there is nothing left to weigh. Nothing in the contract can detect that under encryption —
    // so it does not pretend to have found a winner.
    await advance(PERIOD);

    const sponsorBefore = await tokenBalance(f, f.sponsor);
    const trace = await runDraw(f, 300n);

    expect(trace.winner).to.equal(ethers.ZeroAddress);
    expect(await tokenBalance(f, f.sponsor)).to.equal(sponsorBefore);
  });
});
