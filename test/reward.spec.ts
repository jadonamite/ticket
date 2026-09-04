import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

import { advance, commit, deployDraw, deposit, fund } from "./helpers/draw";

/**
 * Every step after `commitDraw` is already permissionless — anyone *may* call `selectLevel`,
 * `revealLevel` or `settle`. Nothing made it worth a stranger's while to be the one who does,
 * which is a real gap against a keeper that goes quiet for reasons short of the six-hour
 * abandon window. This is the plain-ETH answer: the keeper can fund a bounty at `commitDraw`,
 * split evenly over the steps a draw takes, and paid to whoever actually calls each one —
 * including someone with no stake in the pool at all.
 */
describe("DrawMachine: rewarding whoever advances a draw", function () {
  const spend = async (who: any, fn: () => Promise<any>): Promise<bigint> => {
    const before: bigint = await ethers.provider.getBalance(who.address);
    const tx = await fn();
    const receipt = await tx.wait();
    const gasCost: bigint = BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice);
    const after: bigint = await ethers.provider.getBalance(who.address);
    // Net ETH actually received for the call, with its own gas cost backed out.
    return after - before + gasCost;
  };

  it("pays a stranger for each step, out of the bounty the keeper funded — zero if unfunded", async function () {
    const f = await deployDraw(); // arity 4, capacity 16, depth 2
    const [, alice, bob, carol] = f.signers;

    await fund(f, alice);
    await fund(f, bob);
    await deposit(f, alice, 100n);
    await deposit(f, bob, 100n);
    await advance(600);

    const depth = Number(await f.pool.treeDepth());
    const steps = 2 * depth + 1;
    const perStep = ethers.parseEther("0.01");
    const totalReward = perStep * BigInt(steps);

    await commit(f, 0n, f.keeper, totalReward);
    const id = await f.pool.drawCount();

    expect((await f.pool.drawOf(id)).rewardPerStep).to.equal(perStep);

    // Carol has no slot, no deposit, and is not the keeper. Everything she gains below comes
    // from the bounty, not from anywhere near the encrypted balances.
    for (let level = 0; level < depth; level++) {
      const selectGain = await spend(carol, () => f.pool.connect(carol).selectLevel(id));
      expect(selectGain).to.equal(perStep);

      const handle = await f.pool.levelIndexHandle(id);
      const result = await fhevm.publicDecrypt([handle]);
      const child = Number(Object.values(result.clearValues)[0] as bigint);

      const revealGain = await spend(carol, () =>
        f.pool.connect(carol).revealLevel(id, [handle], child, result.decryptionProof),
      );
      expect(revealGain).to.equal(perStep);
    }

    const settleGain = await spend(carol, () => f.pool.connect(carol).settle(id));
    expect(settleGain).to.equal(perStep);

    // The budget was sized to cover exactly these steps: nothing left over, nothing stuck.
    expect((await f.pool.drawOf(id)).rewardBudget).to.equal(0n);
  });

  it("changes nothing when the keeper funds no bounty at all", async function () {
    const f = await deployDraw();
    const [, alice, carol] = f.signers;

    await fund(f, alice);
    await deposit(f, alice, 100n);
    await advance(600);

    await commit(f, 0n); // reward defaults to 0
    const id = await f.pool.drawCount();

    const depth = Number(await f.pool.treeDepth());
    for (let level = 0; level < depth; level++) {
      const gain = await spend(carol, () => f.pool.connect(carol).selectLevel(id));
      expect(gain).to.equal(0n);

      const handle = await f.pool.levelIndexHandle(id);
      const result = await fhevm.publicDecrypt([handle]);
      const child = Number(Object.values(result.clearValues)[0] as bigint);
      await (await f.pool.connect(carol).revealLevel(id, [handle], child, result.decryptionProof)).wait();
    }
    await (await f.pool.settle(id)).wait();

    expect((await f.pool.drawOf(id)).rewardBudget).to.equal(0n);
  });

  it("refunds the unpaid remainder of the bounty when a draw is abandoned instead of finished", async function () {
    const f = await deployDraw();
    const [, alice, carol] = f.signers;

    await fund(f, alice);
    await deposit(f, alice, 100n);
    await advance(600);

    const depth = Number(await f.pool.treeDepth());
    const steps = 2 * depth + 1;
    const perStep = ethers.parseEther("0.01");
    const totalReward = perStep * BigInt(steps);

    await commit(f, 0n, f.keeper, totalReward);
    const id = await f.pool.drawCount();

    // One step happens, paying out one slice of the bounty, then the draw stalls.
    await spend(carol, () => f.pool.connect(carol).selectLevel(id));

    const timeout = Number(await f.pool.DRAW_TIMEOUT());
    await advance(timeout + 1);

    // Carol calls abandonDraw and pays her own gas for it; the refund goes to the sponsor
    // (== keeper in this fixture), a different account, so no gas adjustment is needed to read
    // it off a plain balance difference.
    const sponsorBefore = await ethers.provider.getBalance(f.sponsor.address);
    await (await f.pool.connect(carol).abandonDraw(id)).wait();
    const sponsorAfter = await ethers.provider.getBalance(f.sponsor.address);

    expect(sponsorAfter - sponsorBefore).to.equal(perStep * BigInt(steps - 1));
    expect((await f.pool.drawOf(id)).rewardBudget).to.equal(0n);
  });
});
