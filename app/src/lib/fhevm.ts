/**
 * Browser-side FHE encryption, mirroring what `tasks/whale.ts` and the test suite do from Node
 * via Hardhat's `fhevm` plugin — that plugin only exists server-side, so a real UI talks to the
 * relayer SDK directly instead.
 */
"use client";

import { createInstance, initSDK, SepoliaConfig, type FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { toHex, type Address, type EIP1193Provider, type WalletClient } from "viem";

let sdkReady: Promise<unknown> | null = null;
let instance: FhevmInstance | null = null;
let instanceForProvider: EIP1193Provider | null = null;

async function ensureSdkReady() {
  // initSDK() loads the WASM/threshold-crypto bundle once per tab; safe to call repeatedly.
  if (!sdkReady) sdkReady = initSDK();
  await sdkReady;
}

/** One instance per injected provider (e.g. the connected wallet), reused for the tab's life. */
export async function getFhevmInstance(provider: EIP1193Provider): Promise<FhevmInstance> {
  await ensureSdkReady();
  if (instance && instanceForProvider === provider) return instance;
  instance = await createInstance({ ...SepoliaConfig, network: provider });
  instanceForProvider = provider;
  return instance;
}

/** Encrypts one amount for one contract call — deposit(), withdraw(), or a sponsor's prize. */
export async function encryptAmount(params: {
  instance: FhevmInstance;
  contractAddress: Address;
  userAddress: Address;
  amount: bigint;
}): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> {
  const input = params.instance.createEncryptedInput(params.contractAddress, params.userAddress);
  input.add64(params.amount);
  const { handles, inputProof } = await input.encrypt();
  return { handle: toHex(handles[0]), proof: toHex(inputProof) };
}

/**
 * Reads back one encrypted value the caller owns — their own balance or time-weight — decrypted
 * only for them via an EIP-712 signature. Same flow the Node-side tooling uses, driven here by a
 * connected wallet instead of a raw private key.
 */
export async function decryptOwn(params: {
  instance: FhevmInstance;
  handle: `0x${string}`;
  contractAddress: Address;
  userAddress: Address;
  walletClient: WalletClient;
}): Promise<bigint> {
  const { publicKey, privateKey } = params.instance.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 1;
  const eip712 = params.instance.createEIP712(publicKey, [params.contractAddress], startTimestamp, durationDays);

  // viem derives the EIP712Domain type itself from `domain` — passing it again inside `types`
  // throws ("types must not contain EIP712Domain type").
  const { EIP712Domain: _domain, ...types } = eip712.types;

  const signature = await params.walletClient.signTypedData({
    account: params.userAddress,
    domain: eip712.domain,
    types,
    primaryType: eip712.primaryType,
    // The SDK stringifies its own uint256 fields; viem's typed-data signer wants them as bigint.
    message: {
      ...eip712.message,
      startTimestamp: BigInt(eip712.message.startTimestamp),
      durationDays: BigInt(eip712.message.durationDays),
    },
  });

  const result = await params.instance.userDecrypt(
    [{ handle: params.handle, contractAddress: params.contractAddress }],
    privateKey,
    publicKey,
    signature,
    [params.contractAddress],
    params.userAddress,
    startTimestamp,
    durationDays,
  );

  const value = result[params.handle];
  if (typeof value !== "bigint") throw new Error(`unexpected decrypt result for ${params.handle}: ${String(value)}`);
  return value;
}
