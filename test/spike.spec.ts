import { expect } from "chai";
import { FhevmType } from "@fhevm/mock-utils";
import { ethers, fhevm } from "hardhat";

import type { RoundTrip } from "../types";

/**
 * T004–T006. The three round trips the whole build stands on, proven before any product
 * code exists:
 *   1. encrypted input in
 *   2. user decryption back out, by the owner and nobody else
 *   3. public decryption, verified on chain by FHE.checkSignatures
 * and the ordered-handle binding that makes (3) safe.
 */
describe("spike: FHE round trips", function () {
  let contract: RoundTrip;
  let address: string;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("RoundTrip");
    contract = (await factory.deploy()) as RoundTrip;
    address = await contract.getAddress();
  });

  it("accepts an encrypted input and returns it to its owner alone", async function () {
    const input = await fhevm.createEncryptedInput(address, alice.address).add64(4242n).encrypt();
    await (await contract.connect(alice).store(input.handles[0], input.inputProof)).wait();

    const handle = await contract.value();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, address, alice);
    expect(clear).to.equal(4242n);

    await expect(fhevm.userDecryptEuint(FhevmType.euint64, handle, address, bob)).to.be.rejected;
  });

  it("closes the public decryption round trip through checkSignatures", async function () {
    const input = await fhevm.createEncryptedInput(address, alice.address).add64(777n).encrypt();
    await (await contract.connect(alice).store(input.handles[0], input.inputProof)).wait();
    await (await contract.publish()).wait();

    const handle = await contract.value();
    const result = await fhevm.publicDecrypt([handle]);
    const clear = Object.values(result.clearValues)[0] as bigint;

    await (await contract.finalize([handle], clear, result.decryptionProof)).wait();

    expect(await contract.finalized()).to.equal(true);
    expect(await contract.revealed()).to.equal(777n);
  });

  it("rejects a cleartext that does not match the signed handle", async function () {
    const input = await fhevm.createEncryptedInput(address, alice.address).add64(777n).encrypt();
    await (await contract.connect(alice).store(input.handles[0], input.inputProof)).wait();
    await (await contract.publish()).wait();

    const handle = await contract.value();
    const result = await fhevm.publicDecrypt([handle]);

    await expect(contract.finalize([handle], 778n, result.decryptionProof)).to.be.reverted;
  });
});
