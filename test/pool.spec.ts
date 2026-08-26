import { expect } from "chai";
import { FhevmType } from "@fhevm/mock-utils";
import { ethers, fhevm } from "hardhat";

import type { ConfidentialUSDT, TicketPool } from "../types";

/**
 * T019. Principal preservation.
 *
 * The one promise a prize-savings product cannot break is that you get your money back. Every
 * test here ends by checking that a depositor's balance returned to exactly what they started
 * with — not approximately, and never short.
 */
const ARITY = 16;
const CAPACITY = 4096;
const PERIOD = 3600;
const FAUCET = 1_000_000_000n;

describe("TicketPool: principal", function () {
  let token: ConfidentialUSDT;
  let pool: TicketPool;
  let tokenAddress: string;
  let poolAddress: string;
  let alice: any;
  let bob: any;

  const encrypt = async (who: any, amount: bigint) => {
    const input = fhevm.createEncryptedInput(poolAddress, who.address);
    input.add64(amount);
    return input.encrypt();
  };

  const tokenBalance = async (who: any) => {
    const handle = await token.confidentialBalanceOf(who.address);
    return fhevm.userDecryptEuint(FhevmType.euint64, handle, tokenAddress, who);
  };

  const poolBalance = async (who: any) => {
    const handle = await pool.confidentialBalanceOf(who.address);
    return fhevm.userDecryptEuint(FhevmType.euint64, handle, poolAddress, who);
  };

  beforeEach(async function () {
    [, alice, bob] = await ethers.getSigners();

    token = await (await ethers.getContractFactory("ConfidentialUSDT")).deploy();
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();

    pool = await (await ethers.getContractFactory("TicketPool")).deploy(tokenAddress, ARITY, CAPACITY, PERIOD);
    await pool.waitForDeployment();
    poolAddress = await pool.getAddress();

    const forever = 2 ** 40;
    for (const who of [alice, bob]) {
      await (await token.connect(who).claim()).wait();
      await (await token.connect(who).setOperator(poolAddress, forever)).wait();
    }
  });

  it("assigns a slot on first deposit and reuses it on the second", async function () {
    expect((await pool.slotOf(alice.address)).assigned).to.equal(false);

    let enc = await encrypt(alice, 100n);
    await (await pool.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();

    const first = await pool.slotOf(alice.address);
    expect(first.assigned).to.equal(true);
    expect(first.slot).to.equal(0n);

    enc = await encrypt(alice, 50n);
    await (await pool.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();

    expect((await pool.slotOf(alice.address)).slot).to.equal(0n);
    expect(await pool.participantCount()).to.equal(1n);
    expect(await poolBalance(alice)).to.equal(150n);
  });

  it("returns every base unit on withdrawAll", async function () {
    const before = await tokenBalance(alice);
    expect(before).to.equal(FAUCET);

    const enc = await encrypt(alice, 250_000n);
    await (await pool.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();
    expect(await tokenBalance(alice)).to.equal(before - 250_000n);
    expect(await poolBalance(alice)).to.equal(250_000n);

    await (await pool.connect(alice).withdrawAll()).wait();

    expect(await poolBalance(alice)).to.equal(0n);
    expect(await tokenBalance(alice)).to.equal(before);
  });

  it("clamps an oversized withdrawal instead of reverting", async function () {
    const before = await tokenBalance(alice);

    let enc = await encrypt(alice, 1_000n);
    await (await pool.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();

    // Ask for far more than the balance. A revert here would be a public signal about a
    // private number, so the request is clamped and the call succeeds.
    enc = await encrypt(alice, 999_999_999n);
    await (await pool.connect(alice).withdraw(enc.handles[0], enc.inputProof)).wait();

    expect(await poolBalance(alice)).to.equal(0n);
    expect(await tokenBalance(alice)).to.equal(before);
  });

  it("keeps two depositors' principal separate across a period boundary", async function () {
    const aliceBefore = await tokenBalance(alice);
    const bobBefore = await tokenBalance(bob);

    let enc = await encrypt(alice, 400_000n);
    await (await pool.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();
    enc = await encrypt(bob, 100_000n);
    await (await pool.connect(bob).deposit(enc.handles[0], enc.inputProof)).wait();

    // Cross into the next period. The integral resets; the principal must not.
    await ethers.provider.send("evm_increaseTime", [PERIOD * 2]);
    await ethers.provider.send("evm_mine", []);

    await (await pool.connect(alice).withdrawAll()).wait();
    await (await pool.connect(bob).withdrawAll()).wait();

    expect(await tokenBalance(alice)).to.equal(aliceBefore);
    expect(await tokenBalance(bob)).to.equal(bobBefore);
  });

  it("refuses a withdrawal from an address that never deposited", async function () {
    await expect(pool.connect(bob).withdrawAll()).to.be.revertedWithCustomError(pool, "NoSlot");
  });
});
