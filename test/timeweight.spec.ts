import { expect } from "chai";
import { FhevmType } from "@fhevm/mock-utils";
import { fhevm } from "hardhat";

import { ethers } from "hardhat";

import { advance, deployDraw, deposit, fund } from "./helpers/draw";

/** The block timestamp a transaction landed in. */
async function stampOf(receipt: any) {
  return Number((await ethers.provider.getBlock(receipt.blockNumber))!.timestamp);
}

/**
 * T044, T047. The claim the whole project exists to make.
 *
 * A prize pool whose odds are "balance at draw time" pays the whale who arrives an hour before
 * the draw and leaves an hour after. That exploit is why Premium Bonds weights by time and why
 * Save to Win copied it — and encrypting balances is exactly what silently deletes the mechanism,
 * because the rule needs to read the number it is weighting.
 *
 * So: two identical deposits, different hold times, materially different odds — and each
 * depositor able to check their own weight without anybody being able to check theirs.
 */
describe("TicketPool: odds are time-weighted, under encryption", function () {
  /** Seal a depositor's weight and decrypt it, alongside the instant it was sealed at. */
  const sealed = async (f: any, who: any) => {
    const receipt = await (await f.pool.connect(who).sealWeight()).wait();
    const handle = await f.pool.sealedWeightOf(who.address);
    const weight = await fhevm.userDecryptEuint(FhevmType.euint64, handle, f.poolAddress, who);
    return { weight, at: await stampOf(receipt) };
  };

  it("gives the late whale almost nothing for the same money", async function () {
    const f = await deployDraw();
    const [, patient, latecomer] = f.signers;
    await fund(f, patient);
    await fund(f, latecomer);

    // Identical stakes. The only difference is when they arrived.
    const patientIn = await stampOf(await deposit(f, patient, 1_000_000n));
    await advance(3_000);
    const lateIn = await stampOf(await deposit(f, latecomer, 1_000_000n));
    await advance(60);

    const patientSeal = await sealed(f, patient);
    const lateSeal = await sealed(f, latecomer);

    // The rule is exact, not approximate: weight is the integral of balance over the period, so
    // it is the stake multiplied by the seconds it was held for — to the second, taken from the
    // block timestamps rather than from an assumption about how long the test took.
    expect(patientSeal.weight).to.equal(1_000_000n * BigInt(patientSeal.at - patientIn));
    expect(lateSeal.weight).to.equal(1_000_000n * BigInt(lateSeal.at - lateIn));

    // Same money, and the latecomer's odds are a rounding error beside the patient depositor's.
    expect(patientSeal.weight / lateSeal.weight).to.be.greaterThan(40n);
  });

  it("a depositor can seal their own weight and nobody else can read it", async function () {
    const f = await deployDraw();
    const [, alice, bob] = f.signers;
    await fund(f, alice);
    await fund(f, bob);
    const aliceIn = await stampOf(await deposit(f, alice, 500_000n));
    await deposit(f, bob, 500_000n);
    await advance(600);

    const receipt = await (await f.pool.connect(alice).sealWeight()).wait();
    const handle = await f.pool.sealedWeightOf(alice.address);

    expect(await fhevm.userDecryptEuint(FhevmType.euint64, handle, f.poolAddress, alice)).to.equal(
      500_000n * BigInt((await stampOf(receipt)) - aliceIn),
    );

    // A weight is as private as the balance it is computed from.
    await expect(fhevm.userDecryptEuint(FhevmType.euint64, handle, f.poolAddress, bob)).to.be.rejected;
    await expect(fhevm.publicDecrypt([handle])).to.be.rejected;
  });

  it("cannot seal a weight for an address that never deposited", async function () {
    const f = await deployDraw();
    const [, stranger] = f.signers;
    await expect(f.pool.connect(stranger).sealWeight()).to.be.revertedWithCustomError(f.pool, "NoSlot");
  });

  it("resets the advantage at a period boundary, so nobody accumulates odds forever", async function () {
    const f = await deployDraw();
    const [, patient, newcomer] = f.signers;
    await fund(f, patient);
    await fund(f, newcomer);

    await deposit(f, patient, 1_000_000n);
    await advance(3_600 * 3);

    // A new period. Last period's integral is not stale, it is wrong — odds are per draw period,
    // and a depositor from three periods ago does not own the pool.
    const newcomerIn = await stampOf(await deposit(f, newcomer, 1_000_000n));
    await advance(600);

    const patientSeal = await sealed(f, patient);
    const newcomerSeal = await sealed(f, newcomer);

    // The patient depositor is ahead only by the part of *this* period they held through, not by
    // the three periods they sat out.
    expect(patientSeal.weight).to.be.lessThan(1_000_000n * 3_600n);
    expect(newcomerSeal.weight).to.equal(1_000_000n * BigInt(newcomerSeal.at - newcomerIn));
  });

  it("the draw actually uses the weighting, not the balance", async function () {
    const f = await deployDraw();
    const [, patient, latecomer] = f.signers;
    await fund(f, patient);
    await fund(f, latecomer);

    await deposit(f, patient, 100_000n);
    await advance(3_000);
    // The latecomer stakes thirty times as much, ten seconds before the seal, and still loses:
    // 100,000 x ~3,010 against 3,000,000 x ~11 is roughly 3.0e8 against 3.3e7 — nine to one the
    // patient depositor's way, on money that is thirty to one the other.
    await deposit(f, latecomer, 3_000_000n);
    await advance(10);

    let patientWins = 0;
    for (let round = 0; round < 12; round++) {
      await (await f.pool.connect(f.keeper).commitDraw(0n)).wait();
      const id = await f.pool.drawCount();
      const depth = Number(await f.pool.treeDepth());
      for (let level = 0; level < depth; level++) {
        await (await f.pool.selectLevel(id)).wait();
        const h = await f.pool.levelIndexHandle(id);
        const r = await fhevm.publicDecrypt([h]);
        await (
          await f.pool.revealLevel(id, [h], Number(Object.values(r.clearValues)[0] as bigint), r.decryptionProof)
        ).wait();
      }
      await (await f.pool.settle(id)).wait();
      if ((await f.pool.drawOf(id)).winner === patient.address) patientWins++;
    }

    // A balance-weighted pool would give the patient depositor 3% of the draws; this one gives
    // them about 90%. Twelve rounds tell those two apart with room to spare — losing seven of
    // twelve at these odds happens about four times in a thousand.
    expect(patientWins).to.be.greaterThan(6);
  });
});
