import { FhevmType } from "@fhevm/mock-utils";
import { readFileSync } from "node:fs";
import { ethers, fhevm } from "hardhat";

/**
 * A health check for the decryption service, which is the one dependency that can take the whole
 * product down without a line of this repository changing.
 *
 * It reads handles that are already on chain and already granted, so a failure here is never
 * ambiguous: the ACL can be confirmed independently against the ACL contract, and if that says
 * allowed while this says reverted, the relayer is the problem.
 *
 *   npx hardhat test live/decrypt.live.ts --network sepolia
 */
describe("live: user decryption against the deployed pool", function () {
  it("reads back the handles the pool has granted", async function () {
    this.timeout(20 * 60 * 1000);
    const record = JSON.parse(readFileSync("deployments/sepolia.json", "utf8"));
    const poolAddress = record.contracts.DrawMachine.address;
    const pool = await ethers.getContractAt("DrawMachine", poolAddress);
    const signers = await ethers.getSigners();

    for (const [name, who] of [["deployer", signers[0]], ["keeper", signers[1]]] as const) {
      for (const [what, handle] of [
        ["balance", await pool.confidentialBalanceOf(who.address)],
        ["weight", await pool.sealedWeightOf(who.address)],
      ] as const) {
        if (handle === "0x" + "00".repeat(32)) {
          console.log(`${name} ${what}: no handle`);
          continue;
        }
        try {
          const value = await fhevm.userDecryptEuint(FhevmType.euint64, handle, poolAddress, who);
          console.log(`${name} ${what}: ${value}`);
        } catch (error: any) {
          console.log(`${name} ${what}: FAILED — ${error.shortMessage ?? error.message?.slice(0, 90)}`);
        }
      }
    }
  });
});
