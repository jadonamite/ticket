import { FhevmType } from "@fhevm/mock-utils";
import { ethers, fhevm } from "hardhat";

import type { ConfidentialUSDT, DrawMachine } from "../../types";

/**
 * Shared fixture and keeper driver for the draw tests.
 *
 * The production arity is 16 over 4,096 leaves. Most tests here run a 4-ary tree over 16 leaves
 * instead: the descent logic is identical and the assertions are about behaviour, not about
 * compute ceilings, which `bench/` measures on its own. One test deploys at the real parameters so
 * the production shape is exercised too.
 */
export const PROD_ARITY = 16;
export const PROD_CAPACITY = 4096;
export const PERIOD = 3600;

export interface Fixture {
  token: ConfidentialUSDT;
  pool: DrawMachine;
  tokenAddress: string;
  poolAddress: string;
  keeper: any;
  sponsor: any;
  signers: any[];
}

export async function deployDraw(arity = 4, capacity = 16, period = PERIOD): Promise<Fixture> {
  const signers = await ethers.getSigners();
  const keeper = signers[0];
  const sponsor = signers[0];

  const token = (await (await ethers.getContractFactory("ConfidentialUSDT")).deploy()) as ConfidentialUSDT;
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  const pool = (await (
    await ethers.getContractFactory("DrawMachine")
  ).deploy(tokenAddress, arity, capacity, period, keeper.address)) as DrawMachine;
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();

  return { token, pool, tokenAddress, poolAddress, keeper, sponsor, signers };
}

/** Claim from the faucet and let the pool move the caller's tokens. */
export async function fund(f: Fixture, who: any) {
  await (await f.token.connect(who).claim()).wait();
  await (await f.token.connect(who).setOperator(f.poolAddress, 2 ** 40)).wait();
}

export async function deposit(f: Fixture, who: any, amount: bigint) {
  const input = fhevm.createEncryptedInput(f.poolAddress, who.address);
  input.add64(amount);
  const enc = await input.encrypt();
  return (await f.pool.connect(who).deposit(enc.handles[0], enc.inputProof)).wait();
}

export async function withdrawAll(f: Fixture, who: any) {
  return (await f.pool.connect(who).withdrawAll()).wait();
}

export async function poolBalance(f: Fixture, who: any) {
  const handle = await f.pool.confidentialBalanceOf(who.address);
  return fhevm.userDecryptEuint(FhevmType.euint64, handle, f.poolAddress, who);
}

export async function tokenBalance(f: Fixture, who: any) {
  const handle = await f.token.confidentialBalanceOf(who.address);
  return fhevm.userDecryptEuint(FhevmType.euint64, handle, f.tokenAddress, who);
}

/** Move the chain forward, so time-weighting has something to weigh. */
export async function advance(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

export interface DrawTrace {
  id: bigint;
  path: number[];
  winner: string;
  winnerSlot: number;
}

/**
 * Drive one draw to completion exactly as the keeper does: commit, then per level select,
 * publicly decrypt the published index, and reveal; then settle.
 *
 * Every step is a separate transaction on purpose — randomness cannot be produced by a read-only
 * call, and the per-transaction depth ceiling is what splits sealing from selection.
 */
export async function runDraw(f: Fixture, prize: bigint): Promise<DrawTrace> {
  const commit = await (await f.pool.connect(f.keeper).commitDraw(prize)).wait();
  const id = await f.pool.drawCount();

  const depth = Number(await f.pool.treeDepth());
  const path: number[] = [];

  for (let level = 0; level < depth; level++) {
    await (await f.pool.selectLevel(id)).wait();

    const handle = await f.pool.levelIndexHandle(id);
    const result = await fhevm.publicDecrypt([handle]);
    const child = Number(Object.values(result.clearValues)[0] as bigint);

    await (await f.pool.revealLevel(id, [handle], child, result.decryptionProof)).wait();
    path.push(child);
  }

  await (await f.pool.settle(id)).wait();

  const draw = await f.pool.drawOf(id);
  void commit;
  return { id, path, winner: draw.winner, winnerSlot: Number(draw.winnerSlot) };
}
