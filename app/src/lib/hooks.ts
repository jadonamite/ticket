/**
 * The screens' actual interface to the pool — deposit/withdraw/read-own-value, each one bundling
 * the encrypt-or-decrypt step with the contract call so a screen component never touches the FHE
 * SDK directly. Not used anywhere yet; ready for the product screens.
 */
"use client";

import { useCallback, useState } from "react";
import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import type { EIP1193Provider } from "viem";

import { drawMachineContract, confidentialUsdtContract } from "./contracts";
import { decryptOwn, encryptAmount, getFhevmInstance } from "./fhevm";

function browserProvider(): EIP1193Provider {
  const provider = typeof window !== "undefined" ? (window as unknown as { ethereum?: EIP1193Provider }).ethereum : undefined;
  if (!provider) throw new Error("no injected wallet found — connect one first");
  return provider;
}

/** Encrypt `amount` and call `deposit(handle, proof)`. */
export function useDeposit() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState(false);

  const deposit = useCallback(
    async (amount: bigint) => {
      if (!address) throw new Error("connect a wallet first");
      setPending(true);
      try {
        const instance = await getFhevmInstance(browserProvider());
        const { handle, proof } = await encryptAmount({
          instance,
          contractAddress: drawMachineContract.address,
          userAddress: address,
          amount,
        });
        return await writeContractAsync({
          ...drawMachineContract,
          functionName: "deposit",
          args: [handle, proof],
        });
      } finally {
        setPending(false);
      }
    },
    [address, writeContractAsync],
  );

  return { deposit, pending };
}

/** Encrypt `amount` and call `withdraw(handle, proof)`. Use `withdrawAll()` directly for the full balance. */
export function useWithdraw() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState(false);

  const withdraw = useCallback(
    async (amount: bigint) => {
      if (!address) throw new Error("connect a wallet first");
      setPending(true);
      try {
        const instance = await getFhevmInstance(browserProvider());
        const { handle, proof } = await encryptAmount({
          instance,
          contractAddress: drawMachineContract.address,
          userAddress: address,
          amount,
        });
        return await writeContractAsync({
          ...drawMachineContract,
          functionName: "withdraw",
          args: [handle, proof],
        });
      } finally {
        setPending(false);
      }
    },
    [address, writeContractAsync],
  );

  const withdrawAll = useCallback(async () => {
    return await writeContractAsync({ ...drawMachineContract, functionName: "withdrawAll", args: [] });
  }, [writeContractAsync]);

  return { withdraw, withdrawAll, pending };
}

/**
 * Reads one encrypted handle off a contract (`readFn`), decrypts it for the connected wallet, and
 * returns the plain value — used for a depositor's own balance, weight, or sealed weight. Nobody
 * else can produce a valid signature for this read, so nobody else's value comes back readable.
 */
export function useOwnEncryptedValue(params: {
  contractAddress: `0x${string}`;
  readHandle: () => Promise<`0x${string}`>;
}) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [value, setValue] = useState<bigint | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    if (!address || !walletClient) throw new Error("connect a wallet first");
    setPending(true);
    try {
      const handle = await params.readHandle();
      const instance = await getFhevmInstance(browserProvider());
      const decrypted = await decryptOwn({
        instance,
        handle,
        contractAddress: params.contractAddress,
        userAddress: address,
        walletClient,
      });
      setValue(decrypted);
      return decrypted;
    } finally {
      setPending(false);
    }
  }, [address, walletClient, params]);

  return { value, pending, refresh };
}

export { drawMachineContract, confidentialUsdtContract };
