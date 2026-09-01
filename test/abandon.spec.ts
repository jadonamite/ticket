import { expect } from "chai";
import { ethers } from "hardhat";

import { advance, deployDraw, deposit, fund, poolBalance, tokenBalance } from "./helpers/draw";

/**
 * The liveness hole, and the way out of it.
 *
 * A draw holds the weight tree still, because a draw judged against a moving tree is not a draw.
 * An unfinished draw therefore holds it still forever, and the KMS is a live service that live
 * services stop. Without an escape hatch a single unanswered decryption request freezes the pool
 * with everybody's money inside it — the failure mode that matters most and shows up least in a
 * demo, because a demo never runs long enough to hit it.
 */
describe("DrawMachine: abandoning a stalled draw", function () {
  const stall = async () => {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;
    await fund(f, alice);
    await fund(f, bob);
    await fund(f, f.sponsor);
    await deposit(f, alice, 500n);
    await deposit(f, bob, 500n);
    await advance(600);

    await (await f.pool.connect(f.keeper).commitDraw(300n)).wait();
    const id = await f.pool.drawCount();
    await (await f.pool.selectLevel(id)).wait();
    return { f, id, alice, bob };
  };

  it("will not abandon a draw that is merely slow", async function () {
    const { f, id } = await stall();
    await expect(f.pool.abandonDraw(id)).to.be.revertedWithCustomError(f.pool, "NotTimedOut");

    await advance(5 * 3600);
    await expect(f.pool.abandonDraw(id)).to.be.revertedWithCustomError(f.pool, "NotTimedOut");
  });

  it("releases the pool and returns the prize once the window passes", async function () {
    const { f, id } = await stall();
    const sponsorBefore = await tokenBalance(f, f.sponsor);

    await advance(6 * 3600 + 1);

    // Anyone. The failure this exists for is the keeper going away, so a rescue only the keeper
    // can perform is not a rescue.
    const [, , , stranger] = f.signers;
    await (await f.pool.connect(stranger).abandonDraw(id)).wait();

    const draw = await f.pool.drawOf(id);
    expect(draw.winner).to.equal(ethers.ZeroAddress);
    expect(await f.pool.drawInFlight()).to.equal(false);
    expect(await tokenBalance(f, f.sponsor)).to.equal(sponsorBefore + 300n);
  });

  it("executes what was parked behind it and lets the next draw open", async function () {
    const { f, id, alice } = await stall();

    const before = await tokenBalance(f, alice);
    await (await f.pool.connect(alice).withdrawAll()).wait();
    expect(await f.pool.queueLength()).to.equal(1n);

    await advance(6 * 3600 + 1);
    await (await f.pool.abandonDraw(id)).wait();

    // Alice's money comes back without her having to do anything a second time.
    expect(await f.pool.queueLength()).to.equal(0n);
    expect(await poolBalance(f, alice)).to.equal(0n);
    expect(await tokenBalance(f, alice)).to.equal(before + 500n);

    await (await f.pool.connect(f.keeper).commitDraw(0n)).wait();
  });

  it("cannot abandon a settled draw, or one that never existed", async function () {
    const { f, id } = await stall();
    await advance(6 * 3600 + 1);
    await (await f.pool.abandonDraw(id)).wait();

    await expect(f.pool.abandonDraw(id)).to.be.revertedWithCustomError(f.pool, "WrongPhase");
    await expect(f.pool.abandonDraw(99)).to.be.revertedWithCustomError(f.pool, "NoDraw");
  });
});
