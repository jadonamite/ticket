/**
 * The actual demo content — split out of page.tsx so it can be loaded via `next/dynamic` with
 * `ssr: false`. The FHE SDK's WASM glue references browser-only globals (`self`) at module load
 * time; `force-dynamic` alone doesn't help because Next still `require()`s a page module during
 * the build to collect route metadata, which is enough to crash it before rendering even starts.
 * A real client-only lazy-import boundary is the only thing that keeps this whole chain (and
 * therefore anything in `src/lib/hooks.ts`) out of the server bundle entirely.
 */
"use client";

import { useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { sepolia } from "wagmi/chains";

import { confidentialUsdtContract, drawMachineContract, DRAW_MACHINE_ADDRESS } from "../../lib/contracts";
import { useDeposit, useOwnEncryptedValue, useWithdraw } from "../../lib/hooks";
import { WalletProvider } from "../../lib/providers";
import { wagmiConfig } from "../../lib/wagmi";

// Matches the far-future expiry tasks/whale.ts uses for the same approval.
const FAR_FUTURE_EXPIRY = 2 ** 40;

export default function DemoContent() {
  return (
    <WalletProvider>
      <DemoInner />
    </WalletProvider>
  );
}

function DemoInner() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync, isPending: writePending } = useWriteContract();

  const [depositAmount, setDepositAmount] = useState("1000000");
  const [withdrawAmount, setWithdrawAmount] = useState("1000000");
  const [log, setLog] = useState<string[]>([]);
  const append = (line: string) => setLog((l) => [...l, line]);

  const { deposit, pending: depositPending } = useDeposit();
  const { withdraw, withdrawAll, pending: withdrawPending } = useWithdraw();

  const tokenBalance = useOwnEncryptedValue({
    contractAddress: confidentialUsdtContract.address,
    readHandle: async () => {
      if (!address) throw new Error("connect a wallet first");
      return (await readContract(wagmiConfig, {
        ...confidentialUsdtContract,
        functionName: "confidentialBalanceOf",
        args: [address],
      })) as `0x${string}`;
    },
  });

  const poolBalance = useOwnEncryptedValue({
    contractAddress: drawMachineContract.address,
    readHandle: async () => {
      if (!address) throw new Error("connect a wallet first");
      return (await readContract(wagmiConfig, {
        ...drawMachineContract,
        functionName: "confidentialBalanceOf",
        args: [address],
      })) as `0x${string}`;
    },
  });

  const sealedWeight = useOwnEncryptedValue({
    contractAddress: drawMachineContract.address,
    readHandle: async () => {
      if (!address) throw new Error("connect a wallet first");
      return (await readContract(wagmiConfig, {
        ...drawMachineContract,
        functionName: "sealedWeightOf",
        args: [address],
      })) as `0x${string}`;
    },
  });

  const { data: claimableAt } = useReadContract({
    ...confidentialUsdtContract,
    functionName: "claimableAt",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: isOperator, refetch: refetchIsOperator } = useReadContract({
    ...confidentialUsdtContract,
    functionName: "isOperator",
    args: address ? [address, DRAW_MACHINE_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const { data: participantCount } = useReadContract({ ...drawMachineContract, functionName: "participantCount" });
  const { data: currentPeriod } = useReadContract({ ...drawMachineContract, functionName: "currentPeriod" });
  const { data: queueLength } = useReadContract({ ...drawMachineContract, functionName: "queueLength" });
  const { data: drawInFlight } = useReadContract({ ...drawMachineContract, functionName: "drawInFlight" });

  const run = async (label: string, fn: () => Promise<unknown>) => {
    append(`${label}…`);
    try {
      const result = await fn();
      append(`${label} ok${result ? " " + String(result) : ""}`);
    } catch (err) {
      append(`${label} FAILED: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24, fontFamily: "monospace", fontSize: 14 }}>
      <h1>Ticket — wiring check</h1>
      <p>Not a product screen. Exercises the live stack: connect → claim → approve → deposit → read → withdraw.</p>

      <section>
        <h2>Wallet</h2>
        {isConnected ? (
          <div>
            <div>{address}</div>
            <div>chain {chainId}{chainId !== sepolia.id ? " (not sepolia)" : ""}</div>
            {chainId !== sepolia.id && <button onClick={() => switchChain({ chainId: sepolia.id })}>switch to sepolia</button>}
            <button onClick={() => disconnect()}>disconnect</button>
          </div>
        ) : (
          connectors.map((c) => (
            <button key={c.uid} onClick={() => connect({ connector: c })}>
              connect {c.name}
            </button>
          ))
        )}
      </section>

      <section>
        <h2>Pool status</h2>
        <ul>
          <li>participants: {participantCount?.toString() ?? "…"}</li>
          <li>period: {currentPeriod?.toString() ?? "…"}</li>
          <li>queue: {queueLength?.toString() ?? "…"}</li>
          <li>draw in flight: {String(drawInFlight ?? "…")}</li>
        </ul>
      </section>

      <section>
        <h2>1. Faucet</h2>
        <p>claimable at: {claimableAt ? new Date(Number(claimableAt) * 1000).toISOString() : "…"}</p>
        <button
          disabled={writePending}
          onClick={() => run("claim", () => writeContractAsync({ ...confidentialUsdtContract, functionName: "claim", args: [] }))}
        >
          claim 1,000 units
        </button>
      </section>

      <section>
        <h2>2. Approve the pool</h2>
        <p>is operator: {String(isOperator ?? "…")}</p>
        <button
          disabled={writePending}
          onClick={() =>
            run("setOperator", async () => {
              const r = await writeContractAsync({
                ...confidentialUsdtContract,
                functionName: "setOperator",
                args: [DRAW_MACHINE_ADDRESS, FAR_FUTURE_EXPIRY],
              });
              await refetchIsOperator();
              return r;
            })
          }
        >
          approve pool as operator
        </button>
      </section>

      <section>
        <h2>3. Deposit</h2>
        <input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
        <button disabled={depositPending} onClick={() => run("deposit", () => deposit(BigInt(depositAmount)))}>
          deposit
        </button>
      </section>

      <section>
        <h2>4. Read my encrypted values</h2>
        <div>
          <button disabled={tokenBalance.pending} onClick={() => run("token balance", tokenBalance.refresh)}>
            read wallet token balance
          </button>{" "}
          {tokenBalance.value?.toString() ?? "—"}
        </div>
        <div>
          <button disabled={poolBalance.pending} onClick={() => run("pool balance", poolBalance.refresh)}>
            read pool balance
          </button>{" "}
          {poolBalance.value?.toString() ?? "—"}
        </div>
        <div>
          <button
            disabled={writePending}
            onClick={() => run("sealWeight", () => writeContractAsync({ ...drawMachineContract, functionName: "sealWeight", args: [] }))}
          >
            seal my weight
          </button>
        </div>
        <div>
          <button disabled={sealedWeight.pending} onClick={() => run("sealed weight", sealedWeight.refresh)}>
            read sealed weight
          </button>{" "}
          {sealedWeight.value?.toString() ?? "—"}
        </div>
      </section>

      <section>
        <h2>5. Withdraw</h2>
        <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
        <button disabled={withdrawPending} onClick={() => run("withdraw", () => withdraw(BigInt(withdrawAmount)))}>
          withdraw amount
        </button>
        <button disabled={withdrawPending} onClick={() => run("withdrawAll", withdrawAll)}>
          withdraw all
        </button>
      </section>

      <section>
        <h2>Log</h2>
        <pre style={{ whiteSpace: "pre-wrap", background: "#f2f2f2", padding: 12 }}>{log.join("\n")}</pre>
      </section>
    </main>
  );
}
