import { expect } from "chai";
import { ethers } from "hardhat";

import { advance, commit, deployDraw, deposit, fund, poolBalance, tokenBalance } from "./helpers/draw";

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

    await commit(f, 300n);
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

    await commit(f, 0n);
  });

  it("cannot abandon a settled draw, or one that never existed", async function () {
    const { f, id } = await stall();
    await advance(6 * 3600 + 1);
    await (await f.pool.abandonDraw(id)).wait();

    await expect(f.pool.abandonDraw(id)).to.be.revertedWithCustomError(f.pool, "WrongPhase");
    await expect(f.pool.abandonDraw(99)).to.be.revertedWithCustomError(f.pool, "NoDraw");
  });
});

/**
 * The only privilege in the contract.
 *
 * A keeper key that is lost or leaked would otherwise end the pool's life — no key, no further
 * draws, forever — so it can be rotated. It is worth being precise about what that power is and
 * is not: the owner names the keeper and does nothing else. No pause, no access to a deposit, no
 * influence over a draw. A withdrawal never depends on anybody's goodwill, which is the only
 * reason a pool that hides its balances is worth trusting with money.
 */
describe("DrawMachine: rotating the keeper", function () {
  it("lets the owner name a new keeper, and nobody else", async function () {
    const f = await deployDraw();
    const [owner, alice, next] = f.signers;

    await expect(f.pool.connect(alice).setKeeper(alice.address)).to.be.revertedWithCustomError(
      f.pool,
      "NotOwner",
    );

    await (await f.pool.connect(owner).setKeeper(next.address)).wait();
    expect(await f.pool.keeper()).to.equal(next.address);

    await fund(f, alice);
    await deposit(f, alice, 100n);
    await expect(commit(f, 0n, owner)).to.be.revertedWithCustomError(f.pool, "NotKeeper");
    await commit(f, 0n, next);
  });

  it("will not rotate mid-draw, and will not name nobody", async function () {
    const f = await deployDraw();
    const [owner, alice, next] = f.signers;

    await expect(f.pool.connect(owner).setKeeper(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      f.pool,
      "ZeroKeeper",
    );

    await fund(f, alice);
    await deposit(f, alice, 100n);
    await commit(f, 0n);

    // A rotation halfway down the tree would orphan the descent.
    await expect(f.pool.connect(owner).setKeeper(next.address)).to.be.revertedWithCustomError(
      f.pool,
      "DrawInFlight",
    );
  });

  it("gives the owner no power over the money", async function () {
    const f = await deployDraw();
    const [owner, alice] = f.signers;
    await fund(f, alice);
    await deposit(f, alice, 500n);

    // There is no function to find. The surface is one setter, and this is the assertion that
    // keeps it that way as the contract grows.
    const privileged = f.pool.interface.fragments
      .filter((fragment: any) => fragment.type === "function")
      .map((fragment: any) => fragment.name)
      .filter((name: string) => /pause|rescue|sweep|withdrawFrom|setOwner|transferOwnership|emergency/i.test(name));
    expect(privileged).to.deep.equal([]);

    // And the owner cannot take Alice's stake by any route the pool exposes.
    await expect(f.pool.connect(owner).withdrawAll()).to.be.revertedWithCustomError(f.pool, "NoSlot");
    expect(await poolBalance(f, alice)).to.equal(500n);
  });
});
