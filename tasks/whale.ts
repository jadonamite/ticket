import { FhevmType } from "@fhevm/mock-utils";
import { readFileSync, writeFileSync } from "node:fs";
import { task, types } from "hardhat/config";

/**
 * T046. The late whale, demonstrated rather than asserted.
 *
 * The exploit this product exists to close: deposit an hour before the draw, win, withdraw an
 * hour after. Every prize-savings scheme that has run at scale weights by time to stop it, and
 * every one of those rules reads the balance in the clear.
 *
 * So this puts two identical stakes in at different times and has each depositor read back their
 * own weight — which is the whole claim, made on a live deployment where a stranger can check the
 * transactions and still not learn either number.
 *
 * The script holds both keys because it is standing in for two people. Neither of them could read
 * the other's weight: the handles are granted per address and the chain enforces it.
 *
 *   npx hardhat ticket:whale --hold 600 --network sepolia
 */
task("ticket:whale", "Show that a late deposit buys almost no odds")
  .addOptionalParam("hold", "Seconds the patient depositor holds before the latecomer arrives", "600", types.string)
  .addOptionalParam("amount", "Stake for both, in base units", "1000000", types.string)
  .addOptionalParam("deployment", "Path to the deployment record", "deployments/sepolia.json", types.string)
  .addOptionalParam("out", "Where to write the record", "docs/WHALE.md", types.string)
  .setAction(async (args, hre) => {
    // The mock coprocessor is set up automatically for `hardhat test` and has to be asked for
    // anywhere else. It refuses the in-memory network outright, which is worth saying plainly
    // rather than letting every FHE operation revert inside the library.
    if (hre.network.name === "hardhat") {
      throw new Error(
        "ticket:whale needs a real chain. Run `npx hardhat node` and use --network localhost, " +
          "or --network sepolia against the deployed pool.",
      );
    }
    await hre.fhevm.initializeCLIApi();

    const [patient, latecomer] = await hre.ethers.getSigners();

    // On a local node there is nothing to attach to, so the demo builds its own pool. That is
    // the point of it being a demonstration: it should run for anybody, from a clean checkout,
    // with no deployment and no tokens.
    const local = hre.network.name === "localhost";
    let poolAddress: string;
    let tokenAddress: string;

    if (local) {
      const { ARITY, CAPACITY, PERIOD_LENGTH } = await import("../config/params");
      const t = await (await hre.ethers.getContractFactory("ConfidentialUSDT")).deploy();
      await t.waitForDeployment();
      tokenAddress = await t.getAddress();
      const p = await (
        await hre.ethers.getContractFactory("DrawMachine")
      ).deploy(tokenAddress, ARITY, CAPACITY, PERIOD_LENGTH, patient.address);
      await p.waitForDeployment();
      poolAddress = await p.getAddress();
    } else {
      const record = JSON.parse(readFileSync(args.deployment, "utf8"));
      poolAddress = record.contracts.DrawMachine.address;
      tokenAddress = record.contracts.ConfidentialUSDT.address;
    }

    const pool = await hre.ethers.getContractAt("DrawMachine", poolAddress);
    const token = await hre.ethers.getContractAt("ConfidentialUSDT", tokenAddress);
    const amount = BigInt(args.amount);
    const hold = Number(args.hold);

    const stamp = async (receipt: any) =>
      Number((await hre.ethers.provider.getBlock(receipt.blockNumber))!.timestamp);

    const ready = async (who: any) => {
      const claimableAt = Number(await token.claimableAt(who.address)) * 1000;
      if (claimableAt <= Date.now()) await (await token.connect(who).claim()).wait();
      await (await token.connect(who).setOperator(poolAddress, 2 ** 40)).wait();
    };

    const put = async (who: any) => {
      const input = hre.fhevm.createEncryptedInput(poolAddress, who.address);
      input.add64(amount);
      const enc = await input.encrypt();
      return stamp(await (await pool.connect(who).deposit(enc.handles[0], enc.inputProof)).wait());
    };

    const ZERO_HANDLE = "0x" + "00".repeat(32);

    const seal = async (who: any) => {
      const receipt = await (await pool.connect(who).sealWeight()).wait();

      // The handle has to be read back from a node that has actually seen the block it was
      // written in. A public endpoint that is one block behind answers with a zero handle, which
      // is indistinguishable from a genuine zero until the decryption reverts.
      let handle = ZERO_HANDLE;
      for (let attempt = 0; attempt < 20 && handle === ZERO_HANDLE; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 3_000));
        handle = await pool.sealedWeightOf(who.address);
      }
      if (handle === ZERO_HANDLE) throw new Error(`no sealed weight for ${who.address}`);

      let weight: bigint | undefined;
      for (let attempt = 0; attempt < 8 && weight === undefined; attempt++) {
        try {
          weight = await hre.fhevm.userDecryptEuint(FhevmType.euint64, handle, poolAddress, who);
        } catch (error) {
          if (attempt === 7) throw error;
          console.log(`  decrypt: attempt ${attempt + 1} failed, retrying`);
          await new Promise((r) => setTimeout(r, 5_000));
        }
      }

      return { weight: weight!, at: await stamp(receipt) };
    };

    const wait = async (seconds: number) => {
      if (local) {
        await hre.ethers.provider.send("evm_increaseTime", [seconds]);
        await hre.ethers.provider.send("evm_mine", []);
        return;
      }
      console.log(`waiting ${seconds}s`);
      await new Promise((r) => setTimeout(r, seconds * 1000));
    };

    console.log(`pool ${poolAddress}`);
    await ready(patient);
    await ready(latecomer);

    const patientIn = await put(patient);
    console.log(`patient   deposited ${amount} at ${new Date(patientIn * 1000).toISOString()}`);

    await wait(hold);

    const lateIn = await put(latecomer);
    console.log(`latecomer deposited ${amount} at ${new Date(lateIn * 1000).toISOString()}`);

    await wait(30);

    const patientSeal = await seal(patient);
    const lateSeal = await seal(latecomer);

    const patientHeld = patientSeal.at - patientIn;
    const lateHeld = lateSeal.at - lateIn;
    const ratio = lateSeal.weight === 0n ? Infinity : Number(patientSeal.weight) / Number(lateSeal.weight);
    const share = Number(patientSeal.weight) / Number(patientSeal.weight + lateSeal.weight);

    console.log("");
    console.log(`patient    ${patientHeld}s held · weight ${patientSeal.weight}`);
    console.log(`latecomer  ${lateHeld}s held · weight ${lateSeal.weight}`);
    console.log(`the same money bought ${ratio.toFixed(1)}x the odds`);
    console.log(`patient's share of the draw: ${(share * 100).toFixed(1)}%`);

    const lines = [
      "# The late whale",
      "",
      `Pool \`${poolAddress}\` · ${new Date().toISOString()}`,
      "",
      `Two identical stakes of ${amount} base units. The only difference is when they arrived.`,
      "",
      "| depositor | held | weight | share of the draw |",
      "|---|---:|---:|---:|",
      `| patient | ${patientHeld}s | ${patientSeal.weight} | ${(share * 100).toFixed(1)}% |`,
      `| latecomer | ${lateHeld}s | ${lateSeal.weight} | ${((1 - share) * 100).toFixed(1)}% |`,
      "",
      `The same money bought **${ratio.toFixed(1)}x** the odds.`,
      "",
      "Every number in the weight column was decrypted by the address that owns it, under EIP-712,",
      "and by nobody else. A third party reading this chain sees two deposits, two seal",
      "transactions and no amounts at all — which is the point: the rule that stops the late whale",
      "is enforced on values nobody can read.",
      "",
    ];
    writeFileSync(args.out, lines.join("\n"));
    console.log(`wrote ${args.out}`);
  });
