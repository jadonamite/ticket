import { expect } from "chai";
import { FhevmType } from "@fhevm/mock-utils";
import { ethers, fhevm } from "hardhat";

import type { WeightTreeHarness } from "../types";

/**
 * T020. Differential test: the encrypted integral against a cleartext model.
 *
 * The integral is the only quantity in Ticket that decides who wins, and it is encrypted from the
 * moment it is created to the moment a winner is announced. Nobody can read it and check. So the
 * check is a second, deliberately dumb implementation in TypeScript, driven over the same random
 * schedule of deposits, withdrawals and period rolls, and compared at every level of the tree.
 *
 * A model that agreed with the contract because it shared its reasoning would prove nothing, so
 * the model below is written the obvious way — a flat list of balance intervals, integrated by
 * brute force — and not the way the contract does it.
 */
const ARITY = 4;
const CAPACITY = 64; // 4^3, so three levels above the leaves
const PERIOD = 1000;

/** Brute-force model: every balance change a slot has ever seen, in order. */
type Change = { at: number; period: number; balance: bigint };

class Model {
  readonly history = new Map<number, Change[]>();

  constructor(readonly genesis: number, readonly periodLength: number) {}

  periodAt(t: number) {
    return Math.floor((t - this.genesis) / this.periodLength);
  }

  periodStart(p: number) {
    return this.genesis + p * this.periodLength;
  }

  balanceOf(slot: number) {
    const h = this.history.get(slot);
    return h && h.length ? h[h.length - 1].balance : 0n;
  }

  apply(slot: number, at: number, delta: bigint, subtract: boolean) {
    const current = this.balanceOf(slot);
    const next = subtract ? current - delta : current + delta;
    const h = this.history.get(slot) ?? [];
    h.push({ at, period: this.periodAt(at), balance: next });
    this.history.set(slot, h);
  }

  /** Integral of balance over [start of T's period, T], summed over the given slots. */
  weight(slots: number[], T: number) {
    const period = this.periodAt(T);
    const from = this.periodStart(period);
    let total = 0n;

    for (const slot of slots) {
      const h = this.history.get(slot) ?? [];

      // Balance carried into the period: the last change at or before its start.
      let balance = 0n;
      for (const c of h) if (c.at <= from) balance = c.balance;

      let cursor = from;
      for (const c of h) {
        if (c.at <= from || c.at > T) continue;
        total += balance * BigInt(c.at - cursor);
        cursor = c.at;
        balance = c.balance;
      }
      total += balance * BigInt(T - cursor);
    }
    return total;
  }
}

describe("WeightTree: encrypted integral vs. a cleartext model", function () {
  let tree: WeightTreeHarness;
  let address: string;
  let owner: any;
  let model: Model;

  /** Slots underneath a node, given the implicit k-ary indexing. */
  const slotsUnder = (node: number, leafOffset: number) => {
    let first = node;
    let count = 1;
    while (first < leafOffset) {
      first = first * ARITY + 1;
      count *= ARITY;
    }
    return Array.from({ length: count }, (_, i) => first - leafOffset + i);
  };

  /** Seal a node and report both the weight and the exact second the contract used. */
  const sealed = async (node: number) => {
    const receipt = await (await tree.seal(node)).wait();
    const at = (await ethers.provider.getBlock(receipt!.blockNumber))!.timestamp;
    const handle = await tree.sealedWeight();
    const weight = await fhevm.userDecryptEuint(FhevmType.euint64, handle, address, owner);
    return { weight, at };
  };

  /** Apply a change on chain and mirror it in the model at the timestamp the chain used. */
  const update = async (slot: number, delta: bigint, subtract: boolean) => {
    const receipt = await (await tree.update(slot, delta, subtract)).wait();
    const at = (await ethers.provider.getBlock(receipt!.blockNumber))!.timestamp;
    model.apply(slot, at, delta, subtract);
  };

  const advance = async (seconds: number) => {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  };

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    tree = await (await ethers.getContractFactory("WeightTreeHarness")).deploy(ARITY, CAPACITY, PERIOD);
    await tree.waitForDeployment();
    address = await tree.getAddress();

    model = new Model(Number(await tree.genesis()), PERIOD);
  });

  it("matches on a single deposit left to accrue", async function () {
    await update(0, 500n, false);
    await advance(120);

    const leafOffset = Number(await tree.leafOffset());
    const { weight, at } = await sealed(leafOffset);
    expect(weight).to.equal(model.weight([0], at));
  });

  it("gives a later depositor of the same size a smaller weight", async function () {
    const leafOffset = Number(await tree.leafOffset());

    await update(0, 1_000n, false);
    await advance(300);
    await update(1, 1_000n, false);
    await advance(300);

    const early = (await sealed(leafOffset + 0)).weight;
    const late = (await sealed(leafOffset + 1)).weight;

    // This is the exploit the whole design exists to close: equal money, unequal time.
    expect(early).to.be.greaterThan(late);
  });

  it("resets the integral at a period boundary but not the balance", async function () {
    const leafOffset = Number(await tree.leafOffset());

    await update(0, 800n, false);
    await advance(PERIOD + 60);

    const { weight, at } = await sealed(leafOffset);
    expect(weight).to.equal(model.weight([0], at));

    // Only the seconds since this period began may count.
    const period = model.periodAt(at);
    expect(weight).to.equal(800n * BigInt(at - model.periodStart(period)));
  });

  it("agrees at every level over a random schedule", async function () {
    this.timeout(300_000);

    const leafOffset = Number(await tree.leafOffset());
    const slots = [0, 1, 5, 17, 63]; // spread across different subtrees

    // Deterministic pseudo-random schedule — a failure has to be reproducible.
    let seed = 0x5eed;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % n;
    };

    for (let step = 0; step < 24; step++) {
      const slot = slots[rand(slots.length)];
      const amount = BigInt(1 + rand(5_000));
      const held = model.balanceOf(slot);
      const subtract = held > 0n && rand(3) === 0;
      const delta = subtract ? (amount > held ? held : amount) : amount;

      await update(slot, delta, subtract);

      // Roughly a third of the steps cross a period boundary.
      await advance(rand(3) === 0 ? PERIOD + rand(200) : 1 + rand(200));
    }

    // Compare the root, one node per intermediate level, and each touched leaf.
    const nodes = [0, 1, 6, ...slots.map((s) => leafOffset + s)];
    for (const node of nodes) {
      const { weight, at } = await sealed(node);
      expect(weight, `node ${node}`).to.equal(model.weight(slotsUnder(node, leafOffset), at));
    }
  });
});
