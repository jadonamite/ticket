/**
 * Ticket's product dashboard — the actual "Deposit. Wait. Watch a draw. Withdraw." flow from
 * PRD.md §3, built on the hooks in `src/lib/hooks.ts` (which until now had no caller). Unlike
 * `../demo/DemoContent.tsx`, every state here is a designed screen, not a raw method call: the
 * two-phase draw round trip in particular gets its own panel per PRD principle 3 ("the pending
 * state is a designed screen"), because that is where a confidential app most often feels broken.
 *
 * Visual language is ported from jadonamite/XENIA (see `styles/xenia-app.css`) rather than
 * Ticket's own Tailwind/industrial-blueprint landing page — the landing page keeps its identity,
 * this screen borrows XENIA's fintech-card system, scoped entirely under `.xenia-app`.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useChainId, useConnect, useDisconnect, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { sepolia } from "wagmi/chains";

import { confidentialUsdtContract, drawMachineContract, DRAW_MACHINE_ADDRESS, POOL_PARAMS } from "../../lib/contracts";
import { useDeposit, useOwnEncryptedValue, useWithdraw } from "../../lib/hooks";
import { WalletProvider } from "../../lib/providers";
import { wagmiConfig } from "../../lib/wagmi";
import { PillButton, PillLink } from "../../components/xenia/Pill";
import { SlideToConfirm } from "../../components/xenia/SlideToConfirm";
import { AppFooter } from "../../components/xenia/AppFooter";
import "../../styles/xenia-app.css";

// Matches the far-future expiry tasks/whale.ts uses for the same approval.
const FAR_FUTURE_EXPIRY = 2 ** 40;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const PHASE_BADGE: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "No draw open", color: "var(--xa-ink-3)", bg: "var(--xa-card)" },
  1: { label: "Selecting winner", color: "var(--xa-accent)", bg: "rgba(19, 145, 226, 0.1)" },
  2: { label: "Awaiting reveal", color: "var(--xa-warn)", bg: "rgba(138, 97, 0, 0.1)" },
  3: { label: "Settled", color: "var(--xa-good)", bg: "rgba(16, 121, 74, 0.1)" },
};

type DrawStruct = {
  period: number;
  sealTime: number;
  prize: `0x${string}`;
  sponsor: `0x${string}`;
  node: number;
  level: number;
  phase: number;
  leafReached: boolean;
  winnerSlot: number;
  winner: `0x${string}`;
  rewardPerStep: bigint;
  rewardBudget: bigint;
};

const FONT_LINKS = (
  <>
    <link rel="preconnect" href="https://api.fontshare.com" />
    <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f%5B%5D=switzer@400,500,600,700,401,501&display=swap" />
  </>
);

export default function AppContent() {
  return (
    <WalletProvider>
      {FONT_LINKS}
      <Dashboard />
    </WalletProvider>
  );
}

function Dashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync, isPending: writePending } = useWriteContract();

  const [depositAmount, setDepositAmount] = useState("1000000");
  const [withdrawAmount, setWithdrawAmount] = useState("1000000");
  const [withdrawAllFlag, setWithdrawAllFlag] = useState(false);
  const [activity, setActivity] = useState<{ label: string; ok: boolean; detail?: string }[]>([]);
  const [draws, setDraws] = useState<(DrawStruct & { id: number })[]>([]);
  const [drawsLoading, setDrawsLoading] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);

  const note = (label: string, ok: boolean, detail?: string) => setActivity((a) => [{ label, ok, detail }, ...a].slice(0, 8));

  const { deposit, pending: depositPending } = useDeposit();
  const { withdraw, withdrawAll, pending: withdrawPending } = useWithdraw();

  const walletBalance = useOwnEncryptedValue({
    contractAddress: confidentialUsdtContract.address,
    readHandle: async () => {
      if (!address) throw new Error("connect a wallet first");
      return (await readContract(wagmiConfig, { ...confidentialUsdtContract, functionName: "confidentialBalanceOf", args: [address] })) as `0x${string}`;
    },
  });

  const poolBalance = useOwnEncryptedValue({
    contractAddress: drawMachineContract.address,
    readHandle: async () => {
      if (!address) throw new Error("connect a wallet first");
      return (await readContract(wagmiConfig, { ...drawMachineContract, functionName: "confidentialBalanceOf", args: [address] })) as `0x${string}`;
    },
  });

  const sealedWeight = useOwnEncryptedValue({
    contractAddress: drawMachineContract.address,
    readHandle: async () => {
      if (!address) throw new Error("connect a wallet first");
      return (await readContract(wagmiConfig, { ...drawMachineContract, functionName: "sealedWeightOf", args: [address] })) as `0x${string}`;
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
  const { data: openDrawId } = useReadContract({ ...drawMachineContract, functionName: "openDraw" });
  const { data: drawCount } = useReadContract({ ...drawMachineContract, functionName: "drawCount" });

  const currentDraw = draws.find((d) => d.id === Number(openDrawId ?? BigInt(0)));

  const loadDraws = useCallback(async () => {
    if (drawCount === undefined) return;
    setDrawsLoading(true);
    try {
      const count = Number(drawCount);
      const ids = Array.from({ length: Math.min(count, 8) }, (_, i) => count - i).filter((id) => id > 0);
      const results = await Promise.all(
        ids.map(async (id) => {
          const d = (await readContract(wagmiConfig, { ...drawMachineContract, functionName: "drawOf", args: [BigInt(id)] })) as DrawStruct;
          return { ...d, id };
        }),
      );
      setDraws(results);
    } finally {
      setDrawsLoading(false);
    }
  }, [drawCount]);

  useEffect(() => {
    loadDraws();
  }, [loadDraws]);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      note(label, true);
    } catch (err) {
      note(label, false, err instanceof Error ? err.message : String(err));
    }
  };

  const onWrongChain = isConnected && chainId !== sepolia.id;
  const formatAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <div className="xenia-app">
      {/* Header */}
      <header className="xa-header">
        <div className="xa-header-inner">
          <Link href="/" style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", textDecoration: "none" }}>
            ← Ticket
          </Link>

          <div className="xa-row">
            <div
              className="xa-row"
              style={{ padding: "6px 12px", borderRadius: 9999, background: "var(--xa-card)", border: "1px solid var(--xa-hairline)", fontSize: 12.5, fontWeight: 500, color: "var(--xa-ink-2)", gap: 6 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: onWrongChain ? "var(--xa-bad)" : "var(--xa-good)" }} />
              Sepolia
            </div>

            <div style={{ position: "relative" }}>
              {isConnected ? (
                <button type="button" className="pill pill-plain" onClick={() => setWalletMenuOpen((o) => !o)}>
                  <span className="xa-mono">{formatAddress(address!)}</span>
                  <span style={{ fontSize: 10, color: "var(--xa-ink-3)", marginLeft: 6 }}>▼</span>
                </button>
              ) : (
                <PillButton onClick={() => setWalletMenuOpen((o) => !o)}>Connect wallet</PillButton>
              )}

              {walletMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: 240,
                    padding: 8,
                    borderRadius: 14,
                    background: "var(--xa-card-raised)",
                    border: "1px solid var(--xa-hairline)",
                    boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
                    zIndex: 50,
                  }}
                >
                  {isConnected ? (
                    <>
                      <div style={{ padding: "8px 10px" }}>
                        <div className="xa-small" style={{ fontSize: 11 }}>
                          CONNECTED AS
                        </div>
                        <div className="xa-mono" style={{ fontSize: 12, marginTop: 2 }}>
                          {address}
                        </div>
                      </div>
                      {onWrongChain && (
                        <button
                          onClick={() => {
                            switchChain({ chainId: sepolia.id });
                            setWalletMenuOpen(false);
                          }}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: 0, background: "transparent", color: "var(--xa-ink)", fontSize: 13, fontWeight: 500, textAlign: "left", cursor: "pointer" }}
                        >
                          Switch to Sepolia
                        </button>
                      )}
                      <button
                        onClick={() => {
                          disconnect();
                          setWalletMenuOpen(false);
                        }}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: 0, background: "transparent", color: "var(--xa-bad)", fontSize: 13, fontWeight: 500, textAlign: "left", cursor: "pointer" }}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    connectors.map((c) => (
                      <button
                        key={c.uid}
                        onClick={() => {
                          connect({ connector: c });
                          setWalletMenuOpen(false);
                        }}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: 0, background: "transparent", color: "var(--xa-ink)", fontSize: 13, fontWeight: 500, textAlign: "left", cursor: "pointer" }}
                      >
                        {c.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="xa-page xa-page-wide">
        <div style={{ marginBottom: 32 }}>
          <h1>Deposit, wait, watch a draw, withdraw.</h1>
          <p className="xa-lede" style={{ maxWidth: "60ch" }}>
            Every balance below is encrypted under FHEVM — nobody, including Ticket, can read it except you. Full
            principal is available for withdrawal at any time; the only thing at risk is the interest, which is
            pooled and drawn for instead.
          </p>
        </div>

        <div className="xa-stack">
          {/* Prize source */}
          <div className="xa-card xa-row" style={{ alignItems: "flex-start" }}>
            <div>
              <strong style={{ color: "var(--xa-ink)" }}>Prize source: sponsor-funded, not yield.</strong>{" "}
              <span className="xa-small">
                This demo pool&rsquo;s prize is declared by whoever commits the draw — it is not interest generated
                by the pool. With a small number of depositors, per-draw odds are coarse; treat figures here as a
                mechanism demonstration. See <code className="xa-mono">docs/WHALE.md</code>.
              </span>
            </div>
          </div>

          {/* Pool stats */}
          <div className="xa-panel-white xa-panel">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
              <Stat label="participants" value={participantCount?.toString() ?? "…"} />
              <Stat label="period" value={currentPeriod?.toString() ?? "…"} />
              <Stat label="withdraw queue" value={queueLength?.toString() ?? "…"} />
              <Stat label="draw in flight" value={openDrawId && openDrawId !== BigInt(0) ? `#${openDrawId}` : "none"} />
            </div>
          </div>

          {/* Setup */}
          {isConnected && (
            <div className="xa-panel-white xa-panel xa-stack">
              <h2>Setup — once per wallet</h2>
              <p className="xa-note" style={{ margin: 0 }}>
                Claim test tokens, then approve the pool to move them on your behalf when you deposit. Approval is a
                standard on-chain permission — it does not expose your balance.
              </p>
              <div className="xa-row">
                <PillButton variant="plain" disabled={writePending} onClick={() => run("claimed 1,000 units", () => writeContractAsync({ ...confidentialUsdtContract, functionName: "claim", args: [] }))}>
                  Claim test tokens
                </PillButton>
                <PillButton
                  variant="plain"
                  disabled={writePending}
                  onClick={() =>
                    run("approved pool as operator", async () => {
                      await writeContractAsync({ ...confidentialUsdtContract, functionName: "setOperator", args: [DRAW_MACHINE_ADDRESS, FAR_FUTURE_EXPIRY] });
                      await refetchIsOperator();
                    })
                  }
                >
                  {isOperator ? "Re-approve pool" : "Approve pool"}
                </PillButton>
                <span className="xa-badge" style={{ color: isOperator ? "var(--xa-good)" : "var(--xa-warn)", background: isOperator ? "rgba(16,121,74,0.1)" : "rgba(138,97,0,0.1)" }}>
                  {isOperator ? "Approved" : "Not approved"}
                </span>
              </div>
              {claimableAt !== undefined && <p className="xa-small">Next faucet claim available: {new Date(Number(claimableAt) * 1000).toLocaleString()}</p>}
            </div>
          )}

          {/* Deposit */}
          <div className="xa-panel-white xa-panel xa-stack">
            <h2>Deposit</h2>
            <p className="xa-note" style={{ margin: 0 }}>
              Deposits are encrypted before they ever leave your browser. Ticket sees only a ciphertext.
            </p>
            <div className="xa-amount-field">
              <div className="xa-row" style={{ justifyContent: "space-between" }}>
                <input
                  className="xa-amount-input"
                  style={{ border: 0, outline: "none", padding: 0 }}
                  inputMode="numeric"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9]/g, ""))}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--xa-ink-2)" }}>units</span>
              </div>
            </div>
            <SlideToConfirm
              label="Slide to deposit →"
              loadingLabel="Encrypting & depositing…"
              disabledLabel={!isConnected ? "Connect wallet to deposit" : "Enter an amount"}
              disabled={!isConnected || !depositAmount || Number(depositAmount) <= 0}
              loading={depositPending}
              onSuccess={() => run(`deposited ${depositAmount}`, async () => { await deposit(BigInt(depositAmount)); await loadDraws(); })}
            />
          </div>

          {/* Position */}
          <div className="xa-panel-white xa-panel xa-stack">
            <h2>Your position</h2>
            <PositionRow label="Wallet balance" state={walletBalance} />
            <PositionRow label="Pool principal" state={poolBalance} />
            <PositionRow label="Sealed time-weight" state={sealedWeight} />
            <p className="xa-note" style={{ margin: 0 }}>
              Odds are proportional to the integral of your balance over time — holding longer beats depositing more
              right before a draw. A depositor who arrives seconds before a draw wins odds near zero, by
              construction.
            </p>
            <PillButton variant="ghost" className="pill-plain" disabled={writePending} onClick={() => run("sealed current weight", () => writeContractAsync({ ...drawMachineContract, functionName: "sealWeight", args: [] }))} style={{ alignSelf: "flex-start" }}>
              Seal my weight now
            </PillButton>
          </div>

          {/* Current draw */}
          <div className="xa-panel-white xa-panel xa-stack">
            <h2>Current draw</h2>
            {!openDrawId || openDrawId === BigInt(0) ? (
              <p className="xa-note" style={{ margin: 0 }}>
                No draw is running. Deposits are quietly accruing time-weight for period {currentPeriod?.toString() ?? "…"}.
                A draw is several on-chain steps once someone commits one — this panel will show exactly where it is.
              </p>
            ) : (
              <DrawProgress draw={currentDraw} id={Number(openDrawId)} />
            )}
          </div>

          {/* Withdraw */}
          <div className="xa-panel-white xa-panel xa-stack">
            <h2>Withdraw</h2>
            <p className="xa-note" style={{ margin: 0 }}>
              Full principal, any time, no penalty — even mid-draw. A withdrawal made while a draw is running is
              queued and settles automatically the moment that draw finishes.
            </p>
            <div className="xa-amount-field">
              <div className="xa-row" style={{ justifyContent: "space-between" }}>
                <input
                  className="xa-amount-input"
                  style={{ border: 0, outline: "none", padding: 0 }}
                  inputMode="numeric"
                  disabled={withdrawAllFlag}
                  value={withdrawAllFlag ? "everything" : withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9]/g, ""))}
                />
                <button
                  type="button"
                  className={`xa-preset ${withdrawAllFlag ? "xa-preset-active" : ""}`}
                  style={{ width: "auto", flexShrink: 0 }}
                  onClick={() => setWithdrawAllFlag((v) => !v)}
                >
                  Max
                </button>
              </div>
            </div>
            <SlideToConfirm
              label={withdrawAllFlag ? "Slide to withdraw all →" : "Slide to withdraw →"}
              loadingLabel="Encrypting & withdrawing…"
              disabledLabel={!isConnected ? "Connect wallet to withdraw" : "Enter an amount"}
              disabled={!isConnected || (!withdrawAllFlag && (!withdrawAmount || Number(withdrawAmount) <= 0))}
              loading={withdrawPending}
              onSuccess={() => (withdrawAllFlag ? run("withdrew everything", withdrawAll) : run(`withdrew ${withdrawAmount}`, () => withdraw(BigInt(withdrawAmount))))}
            />
          </div>

          {/* Draw history */}
          <div className="xa-panel-white xa-panel">
            <h2 style={{ marginBottom: 14 }}>Draw history</h2>
            {drawsLoading && draws.length === 0 ? (
              <p className="xa-note">loading…</p>
            ) : draws.length === 0 ? (
              <p className="xa-note">No draw has been committed yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Draw</th>
                    <th>Status</th>
                    <th>Winner</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {draws.map((d) => {
                    const badge = PHASE_BADGE[d.phase] ?? PHASE_BADGE[0];
                    return (
                      <tr key={d.id}>
                        <td className="xa-mono">#{d.id}</td>
                        <td>
                          <span className="xa-badge" style={{ color: badge.color, background: badge.bg }}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="xa-mono" style={{ fontSize: 12 }}>
                          {d.phase === 3 ? (d.winner === ZERO_ADDRESS ? "returned to sponsor" : formatAddress(d.winner)) : "—"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {d.phase === 3 && (
                            <PillLink href={`/verify/${d.id}`} variant="plain">
                              Verify →
                            </PillLink>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Activity feed */}
          {activity.length > 0 && (
            <div>
              <h2 style={{ marginBottom: 10 }}>Recent activity</h2>
              <div className="xa-stack" style={{ gap: 6 }}>
                {activity.map((a, i) => (
                  <div key={i} className={a.ok ? "xa-ok" : "xa-error"} style={{ fontSize: 12.5, fontFamily: "ui-monospace, SF Mono, Menlo, monospace" }}>
                    {a.ok ? "✓" : "✕"} {a.label}
                    {a.detail ? ` — ${a.detail}` : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="xa-small" style={{ fontSize: 11.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function PositionRow({ label, state }: { label: string; state: { value: bigint | null; pending: boolean; refresh: () => Promise<bigint> } }) {
  return (
    <div className="xa-row" style={{ justifyContent: "space-between" }}>
      <span style={{ fontSize: 14.5 }}>{label}</span>
      <div className="xa-row" style={{ gap: 10 }}>
        <button type="button" className="pill pill-ghost pill-plain" disabled={state.pending} onClick={state.refresh} style={{ fontSize: 12.5, padding: "6px 14px" }}>
          {state.pending ? "…" : "Reveal"}
        </button>
        <span className="xa-mono">{state.value?.toString() ?? "—"}</span>
      </div>
    </div>
  );
}

/**
 * The multi-step draw as one comprehensible action (PRD principle 3): what has happened, what is
 * waiting, and what happens next, named explicitly rather than left as a spinner.
 */
function DrawProgress({ draw, id }: { draw: (DrawStruct & { id: number }) | undefined; id: number }) {
  const steps = ["Committed", "Level selected", "Level revealed", "Settled"];
  const phase = draw?.phase ?? 1;
  const activeIndex = phase === 1 ? 0 : phase === 2 ? 1 : phase === 3 ? 3 : 0;

  return (
    <div className="xa-stack" style={{ gap: 14 }}>
      <div className="xa-row" style={{ justifyContent: "space-between" }}>
        <span className="xa-mono" style={{ color: "var(--xa-ink-2)" }}>
          draw #{id}
        </span>
        <span className="xa-small">
          level {draw?.level ?? "…"} of {POOL_PARAMS.treeDepth}
        </span>
      </div>
      <div className="xa-row" style={{ gap: 8 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 5, borderRadius: 9999, background: i <= activeIndex ? "var(--xa-accent)" : "var(--xa-hairline)" }} />
            <span style={{ fontSize: 11, color: i === activeIndex ? "var(--xa-ink)" : "var(--xa-ink-3)" }}>{s}</span>
          </div>
        ))}
      </div>
      <p className="xa-note" style={{ margin: 0 }}>
        {phase === 1 && "Waiting for the next level's branch to be selected under encryption — no wallet action needed, this happens on-chain."}
        {phase === 2 && "A branch has been chosen. Waiting on the decryption oracle to publish it — usually under a minute, then the next level opens automatically."}
        {phase === 3 && "This draw is settled. Its winner and every claim behind it are independently checkable below."}
      </p>
    </div>
  );
}
