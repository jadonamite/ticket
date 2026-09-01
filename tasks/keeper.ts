import { readFileSync } from "node:fs";
import { task, types } from "hardhat/config";

/**
 * The keeper, as a command.
 *
 * A draw is eight transactions and three KMS round trips, and any one of them can fail on the
 * network rather than on the chain. So the keeper is written to be resumable rather than
 * transactional: it reads the draw's phase off the contract and does whatever that phase needs
 * next. Run it again after a crash and it picks up where it stopped — which is the same property
 * the hosted keeper needs, proven here first where it is cheap to test.
 *
 *   npx hardhat ticket:status --network sepolia
 *   npx hardhat ticket:draw --prize 1000 --network sepolia
 */

const PHASES = ["None", "Prepared", "Selected", "Settled"] as const;

function deployment(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

async function withRetry<T>(what: string, fn: () => Promise<T>, attempts = 12, gapMs = 5_000): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      console.log(`  ${what}: attempt ${i + 1} failed, retrying in ${gapMs / 1000}s`);
      await new Promise((r) => setTimeout(r, gapMs));
    }
  }
  throw last;
}

task("ticket:status", "Print the deployed pool's state")
  .addOptionalParam("deployment", "Path to the deployment record", "deployments/sepolia.json", types.string)
  .setAction(async (args, hre) => {
    const record = deployment(args.deployment);
    const pool = await hre.ethers.getContractAt("DrawMachine", record.contracts.DrawMachine.address);

    const open = await pool.openDraw();
    console.log(`pool          ${record.contracts.DrawMachine.address}`);
    console.log(`token         ${await pool.token()}`);
    console.log(`arity/depth   ${await pool.arity()} / ${await pool.treeDepth()}`);
    console.log(`participants  ${await pool.participantCount()}`);
    console.log(`period        ${await pool.currentPeriod()} (${await pool.periodLength()}s)`);
    console.log(`queue         ${await pool.queueLength()} waiting`);
    console.log(`draws         ${await pool.drawCount()} total, open: ${open === 0n ? "none" : open}`);

    if (open !== 0n) {
      const draw = await pool.drawOf(open);
      console.log(
        `  draw ${open}: phase ${PHASES[Number(draw.phase)]}, level ${draw.level}/${await pool.treeDepth()}, ` +
          `sealed at ${new Date(Number(draw.sealTime) * 1000).toISOString()}`,
      );
      const expires = Number(draw.sealTime) + Number(await pool.DRAW_TIMEOUT());
      console.log(`  abandonable after ${new Date(expires * 1000).toISOString()}`);
    }
  });

task("ticket:draw", "Open a draw and drive it to settlement, or resume one already open")
  .addOptionalParam("prize", "Prize in base units, pulled from the keeper", "0", types.string)
  .addOptionalParam("deployment", "Path to the deployment record", "deployments/sepolia.json", types.string)
  .setAction(async (args, hre) => {
    const record = deployment(args.deployment);
    const address = record.contracts.DrawMachine.address;
    const pool = await hre.ethers.getContractAt("DrawMachine", address);

    const signers = await hre.ethers.getSigners();
    const keeperAddress = await pool.keeper();
    const keeper = signers.find((s) => s.address.toLowerCase() === keeperAddress.toLowerCase());
    if (!keeper) throw new Error(`no signer for keeper ${keeperAddress}`);

    const depth = Number(await pool.treeDepth());
    const started = Date.now();

    let id = await pool.openDraw();
    if (id === 0n) {
      const waiting = await pool.queueLength();
      if (waiting > 0n) {
        console.log(`draining ${waiting} parked interactions before sealing`);
        await (await pool.connect(keeper).drainQueue(64)).wait();
      }
      await (await pool.connect(keeper).commitDraw(BigInt(args.prize))).wait();
      id = await pool.drawCount();
      console.log(`opened draw ${id}${args.prize === "0" ? "" : ` with a prize of ${args.prize}`}`);
    } else {
      console.log(`resuming draw ${id}`);
    }

    // Whatever phase it is in, do what that phase needs. Nothing here assumes it ran the step
    // before it — that is the whole point.
    for (;;) {
      const draw = await pool.drawOf(id);
      const phase = PHASES[Number(draw.phase)];

      if (phase === "Settled") break;

      if (phase === "Selected") {
        const handle = await pool.levelIndexHandle(id);
        const result = await withRetry("public decrypt", () => hre.fhevm.publicDecrypt([handle]));
        const child = Number(Object.values(result.clearValues)[0] as bigint);
        console.log(`  level ${draw.level}: child ${child}`);
        await (await pool.connect(keeper).revealLevel(id, [handle], child, result.decryptionProof)).wait();
        continue;
      }

      if (Number(draw.level) === depth) {
        await (await pool.connect(keeper).settle(id)).wait();
        continue;
      }

      await (await pool.connect(keeper).selectLevel(id)).wait();
    }

    const draw = await pool.drawOf(id);
    console.log(`winner  ${draw.winner}  slot ${draw.winnerSlot}`);
    console.log(`took    ${((Date.now() - started) / 1000).toFixed(1)}s`);

    const waiting = await pool.queueLength();
    if (waiting > 0n) {
      console.log(`draining ${waiting} parked interactions`);
      while ((await pool.queueLength()) > 0n) {
        await (await pool.connect(keeper).drainQueue(4)).wait();
      }
    }
  });
