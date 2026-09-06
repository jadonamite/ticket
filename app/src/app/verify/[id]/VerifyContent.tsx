"use client";

import { useReadContract } from "wagmi";
import Link from "next/link";

import { DRAW_MACHINE_ADDRESS, POOL_PARAMS, drawMachineContract } from "../../../lib/contracts";
import { WalletProvider } from "../../../lib/providers";
import { PillLink } from "../../../components/xenia/Pill";
import "../../../styles/xenia-app.css";

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

export default function VerifyContent({ id }: { id: string }) {
  return (
    <WalletProvider>
      {FONT_LINKS}
      <Verify id={id} />
    </WalletProvider>
  );
}

function Verify({ id }: { id: string }) {
  const drawId = /^\d+$/.test(id) ? BigInt(id) : undefined;

  const { data, isLoading, isError } = useReadContract({
    ...drawMachineContract,
    functionName: "drawOf",
    args: drawId !== undefined ? [drawId] : undefined,
    query: { enabled: drawId !== undefined },
  });

  const draw = data as DrawStruct | undefined;
  const settled = draw?.phase === 3;
  const returnedToSponsor = settled && draw?.winner === ZERO_ADDRESS;
  const badge = draw ? PHASE_BADGE[draw.phase] ?? PHASE_BADGE[0] : undefined;

  return (
    <div className="xenia-app">
      <main className="xa-page xa-page-wide">
        <div style={{ marginBottom: 32 }}>
          <span className="xa-badge" style={{ background: "var(--xa-card)", color: "var(--xa-ink-2)", marginBottom: 14 }}>
            VERIFY DRAW #{id}
          </span>
          <h1>What this draw proves, and how to check it yourself.</h1>
          <p className="xa-lede" style={{ maxWidth: "62ch" }}>
            &ldquo;It&rsquo;s on-chain&rdquo; and &ldquo;I can verify the fairness&rdquo; are different sentences.
            This page names exactly what is being claimed for draw #{id} and where in the contract each claim is
            enforced — no wallet, no trust in Ticket, and no FHE key required to confirm any of it.
          </p>
        </div>

        {drawId === undefined && <div className="xa-error">That isn&rsquo;t a valid draw id.</div>}
        {isLoading && drawId !== undefined && <p className="xa-note">loading draw #{id}…</p>}
        {isError && <div className="xa-error">No draw found with that id.</div>}

        {draw && (
          <div className="xa-stack">
            <div className="xa-panel-white xa-panel xa-row" style={{ justifyContent: "space-between" }}>
              <span className="xa-badge" style={{ color: badge!.color, background: badge!.bg }}>
                {badge!.label}
              </span>
              <span className="xa-small">
                period {draw.period} · sealed at {new Date(draw.sealTime * 1000).toLocaleString()}
              </span>
            </div>

            {!settled && (
              <div className="xa-warning">
                This draw hasn&rsquo;t settled yet — currently at level {draw.level}. Come back once it reaches
                &ldquo;Settled&rdquo; to check the winner claim; the randomness, weighting and cap claims below are
                checkable at any phase.
              </div>
            )}

            <div>
              <h2 style={{ marginBottom: 14 }}>The four claims</h2>
              <div className="xa-stack">
                <Claim
                  n={1}
                  title="Randomness source"
                  claim="The selection point at every level came from FHE.randEuint32() — generated inside the FHEVM coprocessor, encrypted end to end, and never influenceable by a depositor, the keeper, or Ticket."
                  check={
                    <>
                      Enforced in <Code>DrawMachine.commitDraw</Code> / <Code>selectLevel</Code> (see{" "}
                      <Code>docs/DRAW.md §3</Code>). No participant supplies entropy at any step — there is nothing to
                      front-run or bias.
                    </>
                  }
                />

                <Claim
                  n={2}
                  title="Time-weighting rule"
                  claim={
                    <>
                      Odds are proportional to <Code>W = ∫ balance(t) dt</Code> over the period, not to balance at a
                      point in time. Weight accrues continuously as <Code>weight = A + B·(T − lastUpdate)</Code>.
                    </>
                  }
                  check={
                    <>
                      Enforced in <Code>WeightTree._update</Code>. A deposit placed seconds before period{" "}
                      {draw.period}&rsquo;s seal time ({new Date(draw.sealTime * 1000).toLocaleTimeString()}) contributes
                      a near-zero integral no matter its size — see the live demonstration in{" "}
                      <Code>docs/WHALE.md</Code>.
                    </>
                  }
                />

                <Claim
                  n={3}
                  title="Structural cap"
                  claim={`Per-deposit size is capped at 2^32 base units and the pool at ${POOL_PARAMS.capacity.toLocaleString()} slots, both checked in plaintext before entering the encrypted aggregate — the aggregate itself never overflows the ciphertext width it's stored in.`}
                  check={
                    <>
                      Enforced in <Code>Limits.sol</Code> (<Code>MAX_DEPOSIT</Code>, <Code>MAX_SLOTS</Code>) and
                      checked on every deposit. Arity {POOL_PARAMS.arity}, so a zero-weight branch can never be
                      selected — see <Code>docs/DRAW.md §3, &ldquo;Why zero-weight children can never win.&rdquo;</Code>
                    </>
                  }
                />

                <Claim
                  n={4}
                  title="Winner selection"
                  claim={
                    settled
                      ? returnedToSponsor
                        ? "No weight survived into this period — the draw correctly landed on an unoccupied leaf, and the prize returned to the sponsor rather than paying an empty slot."
                        : `Slot ${draw.winnerSlot} was selected by a ${POOL_PARAMS.treeDepth}-level tournament descent through an arity-${POOL_PARAMS.arity} tree, publishing only the branch taken at each level. No balance, weight, or total for any other depositor was ever decrypted.`
                      : "Not yet determined — this draw hasn't reached a leaf."
                  }
                  check={
                    <>
                      Enforced in <Code>DrawMachine.revealLevel</Code> / <Code>settle</Code>, checked against{" "}
                      <Code>test/reveal-binding.spec.ts</Code> (only this draw&rsquo;s own published handle can
                      advance it) and <Code>test/privacy.spec.ts</Code> (nothing but the winning index is ever made
                      decryptable).
                      {settled && !returnedToSponsor && (
                        <>
                          {" "}
                          Winner address:{" "}
                          <a href={`https://sepolia.etherscan.io/address/${draw.winner}`} target="_blank" rel="noreferrer" className="xa-mono" style={{ textDecoration: "underline" }}>
                            {draw.winner}
                          </a>
                          .
                        </>
                      )}
                    </>
                  }
                  done={settled}
                />
              </div>
            </div>

            <div className="xa-card xa-row" style={{ alignItems: "flex-start" }}>
              <div className="xa-small">
                Every step above happened on the contract at{" "}
                <a href={`https://sepolia.etherscan.io/address/${DRAW_MACHINE_ADDRESS}`} target="_blank" rel="noreferrer" className="xa-mono" style={{ textDecoration: "underline" }}>
                  {DRAW_MACHINE_ADDRESS}
                </a>{" "}
                on Sepolia. Read the events (<Code>DrawCommitted</Code>, <Code>LevelSelected</Code>,{" "}
                <Code>LevelRevealed</Code>, <Code>DrawSettled</Code>) directly off that address to confirm this page
                isn&rsquo;t the thing you&rsquo;re trusting.
              </div>
            </div>

            <PillLink href="/app" variant="ghost" className="pill-plain" mark={<span aria-hidden>←</span>}>
              Back to the pool
            </PillLink>
          </div>
        )}
      </main>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="xa-mono" style={{ background: "var(--xa-card)", padding: "2px 6px", borderRadius: 6, fontSize: 12.5 }}>
      {children}
    </code>
  );
}

function Claim({
  n,
  title,
  claim,
  check,
  done,
}: {
  n: number;
  title: string;
  claim: React.ReactNode;
  check: React.ReactNode;
  done?: boolean;
}) {
  const dotColor = done === undefined ? "var(--xa-ink-3)" : done ? "var(--xa-good)" : "var(--xa-ink-3)";
  return (
    <div className="xa-panel-white xa-panel xa-stack" style={{ gap: 10 }}>
      <div className="xa-row">
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span className="xa-small">claim {n} of 4</span>
        <h2 style={{ margin: 0 }}>{title}</h2>
      </div>
      <p style={{ margin: 0, fontSize: 14.5 }}>{claim}</p>
      <p className="xa-small" style={{ lineHeight: 1.6 }}>
        {check}
      </p>
    </div>
  );
}
