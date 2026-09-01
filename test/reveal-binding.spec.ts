import { expect } from "chai";
import { fhevm } from "hardhat";

import { advance, deployDraw, deposit, fund } from "./helpers/draw";

/**
 * T029, T032. What `revealLevel` will and will not accept.
 *
 * The reveal is the only place an outside value enters the draw, so it is the only place worth
 * attacking. Two separate bindings have to hold and only one of them comes from the KMS:
 * `FHE.checkSignatures` proves the cleartext belongs to *these handles in this order*, and says
 * nothing about whether these handles are the ones this draw published. A valid proof for some
 * other publicly decryptable value is a real object that a real attacker can obtain.
 *
 * Alongside that, the replay rule: every step is safe to retry, none is safe to repeat.
 */
describe("DrawMachine: reveal binding and replay", function () {
  const start = async () => {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;
    await fund(f, alice);
    await fund(f, bob);
    await deposit(f, alice, 400n);
    await deposit(f, bob, 600n);
    await advance(600);

    await (await f.pool.connect(f.keeper).commitDraw(0n)).wait();
    const id = await f.pool.drawCount();
    await (await f.pool.selectLevel(id)).wait();

    const handle = await f.pool.levelIndexHandle(id);
    const result = await fhevm.publicDecrypt([handle]);
    const child = Number(Object.values(result.clearValues)[0] as bigint);

    return { f, id, handle, child, proof: result.decryptionProof };
  };

  it("accepts the handle this draw published, with its own proof", async function () {
    const { f, id, handle, child, proof } = await start();
    await (await f.pool.revealLevel(id, [handle], child, proof)).wait();
    expect((await f.pool.drawOf(id)).level).to.equal(1);
  });

  it("rejects a cleartext that does not match the signed handle", async function () {
    const { f, id, handle, child, proof } = await start();
    await expect(f.pool.revealLevel(id, [handle], (child + 1) % 4, proof)).to.be.reverted;
  });

  it("rejects a handle this draw never published", async function () {
    const { f, id, child, proof } = await start();

    // A well-formed handle belonging to something else. The KMS proof is irrelevant: the contract
    // never gets as far as checking it.
    const foreign = "0x" + "11".repeat(32);
    await expect(f.pool.revealLevel(id, [foreign], child, proof)).to.be.revertedWithCustomError(
      f.pool,
      "UnknownHandle",
    );
  });

  it("rejects a padded handle list, even with the published handle in it", async function () {
    const { f, id, handle, child, proof } = await start();
    const filler = "0x" + "22".repeat(32);
    await expect(f.pool.revealLevel(id, [handle, filler], child, proof)).to.be.revertedWithCustomError(
      f.pool,
      "UnknownHandle",
    );
  });

  it("rejects a child index outside the arity", async function () {
    const { f, id, handle, proof } = await start();
    await expect(f.pool.revealLevel(id, [handle], 9, proof)).to.be.revertedWithCustomError(
      f.pool,
      "ChildOutOfRange",
    );
  });

  it("cannot reveal the same level twice", async function () {
    const { f, id, handle, child, proof } = await start();
    await (await f.pool.revealLevel(id, [handle], child, proof)).wait();

    // The handle is cleared on descent, so the replay fails on the binding rather than only on
    // the phase — the check does not depend on the state machine being right.
    await expect(f.pool.revealLevel(id, [handle], child, proof)).to.be.reverted;
  });

  it("cannot select twice, or select before the level is prepared", async function () {
    const { f, id } = await start();
    await expect(f.pool.selectLevel(id)).to.be.revertedWithCustomError(f.pool, "WrongPhase");
  });

  it("cannot settle a draw that has not reached a leaf", async function () {
    const f = await deployDraw();
    const [, alice] = f.signers;
    await fund(f, alice);
    await deposit(f, alice, 100n);

    await (await f.pool.connect(f.keeper).commitDraw(0n)).wait();
    const id = await f.pool.drawCount();
    await expect(f.pool.settle(id)).to.be.revertedWithCustomError(f.pool, "WrongPhase");
  });

  it("cannot settle twice", async function () {
    const { f, id, handle, child, proof } = await start();
    await (await f.pool.revealLevel(id, [handle], child, proof)).wait();

    const depth = Number(await f.pool.treeDepth());
    for (let level = 1; level < depth; level++) {
      await (await f.pool.selectLevel(id)).wait();
      const h = await f.pool.levelIndexHandle(id);
      const r = await fhevm.publicDecrypt([h]);
      await (await f.pool.revealLevel(id, [h], Number(Object.values(r.clearValues)[0] as bigint), r.decryptionProof)).wait();
    }

    await (await f.pool.settle(id)).wait();
    await expect(f.pool.settle(id)).to.be.revertedWithCustomError(f.pool, "WrongPhase");
  });

  it("rejects a step against a draw id that does not exist", async function () {
    const f = await deployDraw();
    await expect(f.pool.selectLevel(0)).to.be.revertedWithCustomError(f.pool, "NoDraw");
    await expect(f.pool.selectLevel(99)).to.be.revertedWithCustomError(f.pool, "NoDraw");
  });
});
