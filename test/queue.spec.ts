import { expect } from "chai";
import { fhevm } from "hardhat";

import { advance, commit, deployDraw, deposit, fund, poolBalance, tokenBalance } from "./helpers/draw";

/**
 * T028. Interactions that arrive mid-draw.
 *
 * A draw is judged against the tree as it stood at its seal time, so the tree cannot move while
 * one is in flight. Blocking withdrawals for that window would breach the one promise that makes
 * prize-linked saving not gambling — your money is available at any time — so an interaction that
 * arrives mid-draw is parked and executed automatically when the draw settles. The depositor acts
 * once; the transaction lands without them.
 */
describe("TicketPool: interactions during a draw", function () {
  const openDraw = async (f: any) => {
    await commit(f, 0n);
    return f.pool.drawCount();
  };

  const finish = async (f: any, id: bigint) => {
    const depth = Number(await f.pool.treeDepth());
    for (let level = 0; level < depth; level++) {
      await (await f.pool.selectLevel(id)).wait();
      const h = await f.pool.levelIndexHandle(id);
      const r = await fhevm.publicDecrypt([h]);
      const child = Number(Object.values(r.clearValues)[0] as bigint);
      await (await f.pool.revealLevel(id, [h], child, r.decryptionProof)).wait();
    }
    await (await f.pool.settle(id)).wait();
  };

  it("parks a withdrawal and pays it out on settle", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;
    await fund(f, alice);
    await fund(f, bob);
    await deposit(f, alice, 500n);
    await deposit(f, bob, 500n);
    await advance(600);

    const before = await tokenBalance(f, alice);
    const id = await openDraw(f);

    await (await f.pool.connect(alice).withdrawAll()).wait();
    expect(await f.pool.queueLength()).to.equal(1n);

    // Nothing has moved yet: the tree is still the tree the draw was committed against.
    expect(await tokenBalance(f, alice)).to.equal(before);
    expect(await poolBalance(f, alice)).to.equal(500n);

    await finish(f, id);

    expect(await f.pool.queueLength()).to.equal(0n);
    expect(await poolBalance(f, alice)).to.equal(0n);
    expect(await tokenBalance(f, alice)).to.equal(before + 500n);
  });

  it("parks a deposit, having already taken the tokens", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;
    await fund(f, alice);
    await fund(f, bob);
    await deposit(f, alice, 100n);
    await deposit(f, bob, 100n);
    await advance(600);

    const id = await openDraw(f);
    const before = await tokenBalance(f, alice);

    await deposit(f, alice, 300n);

    // The money is in the contract immediately — a deposit is not a promise to pay later — but
    // the odds it buys start at settle, not at the seal time of a draw already under way.
    expect(await tokenBalance(f, alice)).to.equal(before - 300n);
    expect(await poolBalance(f, alice)).to.equal(100n);

    await finish(f, id);
    expect(await poolBalance(f, alice)).to.equal(400n);
  });

  it("allows one parked interaction per depositor", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;
    await fund(f, alice);
    await fund(f, bob);
    await deposit(f, alice, 500n);
    await deposit(f, bob, 500n);
    await advance(600);

    const id = await openDraw(f);
    await (await f.pool.connect(alice).withdrawAll()).wait();

    // A second withdrawal would clamp against a balance the first has not spent yet, and the two
    // together could ask for more than the leaf holds. The refusal is on the slot, which is
    // public, so it discloses nothing.
    await expect(f.pool.connect(alice).withdrawAll()).to.be.revertedWithCustomError(f.pool, "AlreadyQueued");

    // Someone else is unaffected.
    await (await f.pool.connect(bob).withdrawAll()).wait();
    expect(await f.pool.queueLength()).to.equal(2n);

    await finish(f, id);

    // And the slot is free again once the queue drains.
    await (await f.pool.connect(alice).withdrawAll()).wait();
  });

  it("drains in pages, so settling never depends on how many people acted", async function () {
    const f = await deployDraw();
    const actors = f.signers.slice(1, 8);

    for (const who of actors) {
      await fund(f, who);
      await deposit(f, who, 100n);
    }
    await advance(600);

    const id = await openDraw(f);
    for (const who of actors) {
      await (await f.pool.connect(who).withdrawAll()).wait();
    }
    expect(await f.pool.queueLength()).to.equal(BigInt(actors.length));

    await finish(f, id);

    // Settle did one page. Each parked interaction is a full leaf-to-root walk — 1.37M gas and
    // 3.56M HCU on Sepolia — so a settle that had to do all of them would need more than a block
    // will take.
    expect(await f.pool.queueLength()).to.equal(BigInt(actors.length - 3));

    // And anyone can push the rest through — a parked withdrawal is somebody's money.
    const [, , , stranger] = f.signers;
    await (await f.pool.connect(stranger).drainQueue(64)).wait();
    expect(await f.pool.queueLength()).to.equal(0n);

    for (const who of actors) {
      expect(await poolBalance(f, who)).to.equal(0n);
    }
  });

  it("will not open a draw over a queue that has not drained", async function () {
    const f = await deployDraw();
    const actors = f.signers.slice(1, 8);
    for (const who of actors) {
      await fund(f, who);
      await deposit(f, who, 100n);
    }
    await advance(600);

    const id = await openDraw(f);
    for (const who of actors) await (await f.pool.connect(who).withdrawAll()).wait();
    await finish(f, id);

    // Three interactions are still parked. Sealing the tree now would seal a state already known
    // to be wrong.
    await expect(commit(f, 0n)).to.be.revertedWithCustomError(
      f.pool,
      "QueueNotDrained",
    );

    await (await f.pool.drainQueue(64)).wait();
    await commit(f, 0n);
  });

  it("does not queue when no draw is in flight", async function () {
    const f = await deployDraw();
    const [, alice] = f.signers;
    await fund(f, alice);
    await deposit(f, alice, 100n);
    expect(await f.pool.queueLength()).to.equal(0n);
    expect(await f.pool.drawInFlight()).to.equal(false);
  });
});
