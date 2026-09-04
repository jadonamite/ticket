import { expect } from "chai";
import { fhevm } from "hardhat";

import { advance, commit, deployDraw, deposit, fund, poolBalance, tokenBalance, withdrawAll } from "./helpers/draw";

/**
 * The engine under repetition.
 *
 * Every other test asks whether one draw does the right thing. This one asks whether many draws
 * do — which is a different question, because the failures that survive a demo are the ones that
 * need state to accumulate: a residual that drifts, a period roll that loses an integral, a queue
 * index that never resets.
 *
 * Two claims, and they are the two a depositor actually cares about:
 *
 *   1. **The odds are the weights.** Not "a winner is chosen" — that a coin does. The winner
 *      distribution has to track the time-weighted balances, and the only honest way to check
 *      that is to skew the pool hard and count.
 *   2. **Nothing leaks out of the pot.** Deposits in, prizes in, withdrawals out, and the token
 *      supply the pool holds is exactly the sum of what it owes.
 */
const ROUNDS = 40;

describe("DrawMachine: many draws in a row", function () {
  it("gives the heavier depositor the odds their weight bought", async function () {
    this.timeout(20 * 60 * 1000);

    const f = await deployDraw();
    const [, whale, minnow] = f.signers;
    await fund(f, whale);
    await fund(f, minnow);

    // Nine to one, held for the same time. The point of picking a lopsided pool is that it makes
    // the assertion decisive: at these odds a correct engine loses forty draws in a row about as
    // often as never.
    await deposit(f, whale, 900_000n);
    await deposit(f, minnow, 100_000n);
    await advance(3_600);

    const wins: Record<string, number> = { [whale.address]: 0, [minnow.address]: 0 };

    for (let round = 0; round < ROUNDS; round++) {
      const id = (await commit(f, 0n), await f.pool.drawCount());
      const depth = Number(await f.pool.treeDepth());
      for (let level = 0; level < depth; level++) {
        await (await f.pool.selectLevel(id)).wait();
        const handle = await f.pool.levelIndexHandle(id);
        const r = await fhevm.publicDecrypt([handle]);
        const child = Number(Object.values(r.clearValues)[0] as bigint);
        await (await f.pool.revealLevel(id, [handle], child, r.decryptionProof)).wait();
      }
      await (await f.pool.settle(id)).wait();

      const draw = await f.pool.drawOf(id);
      expect(wins).to.have.property(draw.winner);
      wins[draw.winner] += 1;
    }

    const whaleShare = wins[whale.address] / ROUNDS;
    console.log(`      whale ${wins[whale.address]}/${ROUNDS} · minnow ${wins[minnow.address]}/${ROUNDS}`);

    // True share is 0.9. The band is wide enough that ordinary luck never trips it and narrow
    // enough that a uniform pick — the failure mode where the weighting silently stops applying —
    // cannot pass.
    expect(whaleShare).to.be.greaterThan(0.6);
    expect(whaleShare).to.be.lessThan(1.0001);

    // And the stakes are exactly where they started.
    expect(await poolBalance(f, whale)).to.equal(900_000n);
    expect(await poolBalance(f, minnow)).to.equal(100_000n);
  });

  it("conserves every base unit across deposits, draws, prizes and withdrawals", async function () {
    this.timeout(20 * 60 * 1000);

    const f = await deployDraw();
    const actors = f.signers.slice(1, 6);
    for (const who of actors) await fund(f, who);
    await fund(f, f.sponsor);

    const opening: Record<string, bigint> = {};
    for (const who of actors) opening[who.address] = await tokenBalance(f, who);
    const sponsorOpening = await tokenBalance(f, f.sponsor);

    // A deterministic but unpatterned schedule. Fixed seed, because a test that fails once a
    // fortnight is a test nobody trusts.
    let seed = 20260901;
    const next = (n: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % n;
    };

    let staked: Record<string, bigint> = {};
    for (const who of actors) staked[who.address] = 0n;
    let prizePaid = 0n;

    for (let round = 0; round < 12; round++) {
      for (const who of actors) {
        const roll = next(3);
        if (roll === 0) {
          const amount = BigInt(1 + next(5_000));
          await deposit(f, who, amount);
          staked[who.address] += amount;
        } else if (roll === 1 && staked[who.address] > 0n) {
          await withdrawAll(f, who);
          staked[who.address] = 0n;
        }
      }
      await advance(120 + next(2_000));

      if (Object.values(staked).some((v) => v > 0n)) {
        const prize = BigInt(next(500));
        await commit(f, prize);
        const id = await f.pool.drawCount();
        const depth = Number(await f.pool.treeDepth());
        for (let level = 0; level < depth; level++) {
          await (await f.pool.selectLevel(id)).wait();
          const handle = await f.pool.levelIndexHandle(id);
          const r = await fhevm.publicDecrypt([handle]);
          const child = Number(Object.values(r.clearValues)[0] as bigint);
          await (await f.pool.revealLevel(id, [handle], child, r.decryptionProof)).wait();
        }
        await (await f.pool.settle(id)).wait();
        await (await f.pool.drainQueue(64)).wait();

        const draw = await f.pool.drawOf(id);
        // A prize is only spent when it is won. An unwon prize goes home.
        if (draw.winner !== "0x0000000000000000000000000000000000000000") prizePaid += prize;
      }
    }

    // Everybody leaves.
    for (const who of actors) {
      if (staked[who.address] > 0n) await withdrawAll(f, who);
    }

    // Every depositor is back to exactly what they came in with, plus whatever they won. The pool
    // holds nothing: no dust, no rounding, no stranded stake.
    let won = 0n;
    for (const who of actors) {
      expect(await poolBalance(f, who)).to.equal(0n);
      const closing = await tokenBalance(f, who);
      const delta = closing - opening[who.address];
      expect(delta).to.be.greaterThanOrEqual(0n);
      won += delta;
    }

    expect(won).to.equal(prizePaid);
    expect(await tokenBalance(f, f.sponsor)).to.equal(sponsorOpening - prizePaid);
  });
});
