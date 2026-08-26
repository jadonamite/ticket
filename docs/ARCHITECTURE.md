# Ticket — Architecture

Written Aug 26, 2026. The constraints below were verified against the protocol's own
documentation and they shape every decision that follows.

---

## The four constraints

### 1. Time-weighted balance must survive encryption

Odds cannot be "balance at draw time" — that is precisely the exploit. The pool maintains, per
depositor, an **encrypted running integral of balance over time**, updated on every deposit and
withdrawal, decrypted by nobody at any point.

This is the core contribution. Everything else in the repository is plumbing around it. If this
works and nothing else does, the entry still says something true and new.

### 2. Randomness is native but sharp-edged

Encrypted random values are generated on chain. Two hard edges:

- **Bounded variants require a power-of-two upper bound.** Any draw design that wants a bound of
  1,000 must be built around 1,024 and handle the remainder, or avoid bounded generation.
- **Generation requires a state-changing transaction.** It cannot come from a read-only call.

Both are designed in from day one rather than discovered in week two.

### 3. Comparison is expensive and decryption is asynchronous

Walking every depositor to select a winner is linear and will not fit a block at any interesting
size. Selection is therefore a **tournament over a weighted structure**, costing work
proportional to depth rather than to population.

**The honest caveat, benchmarked rather than asserted:** the selection step being logarithmic
does not make the system logarithmic. The weights still have to be established and maintained. A
logarithmic step sitting on a linear step is a linear system. So the benchmark measures end to end
— *N depositors → operation count → wall time → gas* — **including construction of the weighted
structure**, at three values of N two orders of magnitude apart.

Measured Aug 26 (`bench/run.ts`, full table in `bench/RESULTS.md`), at arity 16, capacity 4,096:

| N | total gas to build | gas per depositor | wall clock |
|---|---|---|---|
| 8 | 3,906,466 | 488,308 | 0.8s |
| 128 | 65,448,927 | 511,319 | 8.4s |
| 4,096 | 2,289,975,153 | 559,075 | 246.3s |

| N | one draw level, seal | one draw level, pick |
|---|---|---|
| 8 | 8,432,960 HCU · 527,032 depth | 14,674,088 HCU · 3,864,064 depth |
| 128 | 8,432,960 HCU · 527,032 depth | 14,674,088 HCU · 3,864,064 depth |
| 4,096 | 6,164,000 HCU · 527,000 depth | 14,674,088 HCU · 3,864,064 depth |

Read the two tables together and the shape is exactly what was claimed and no more: **building the
tree is linear in N** — 512 times the depositors costs 586 times the gas — while **a draw level is
flat**, identical to the digit at N=8 and at N=4,096. The draw is three levels at every size. The
per-depositor column is the number that does not move, and it does not move because a deposit
walks one leaf-to-root path whose length is set by the depth of the tree.

The two per-transaction ceilings are 20,000,000 global HCU and 5,000,000 sequential depth, and
**sequential depth is the one that binds.** Two consequences fall out of the measurement:

- **Each level is split into two transactions.** Sealing children is k independent chains, so its
  depth stays near 527,000 whatever the arity; splitting hands the whole depth budget to the
  selection step, which is one long chain and needs it.
- **The prefix sum is a Hillis-Steele scan, not a running total.** A running total is k−1
  additions deep and reverts outright at k=16. The scan is log₂(k) deep for k·log₂(k) additions —
  it trades total work, which is slack at 73.4%, for depth, which is not at 77.3%.

Arity 16 with capacity 4,096 is therefore a measurement, not a guess, and `deploy/params.ts`
records the fallback if that 22.7% depth headroom ever closes.

Revealing a winner requires a decryption round trip **per level** of that structure, and the
per-transaction compute ceiling splits each level in two. A draw is therefore a **bounded
multi-step machine** whose step count is set by the depth of the structure and never by the number
of depositors. It advances on its own — the user takes one action, not one per step.

The interface is built for that, not against it: the pending state is a designed screen showing
what has happened, what is waiting, and what happens next. This is where most entries on this
stack will feel broken.

### 4. Public decryption is permanent

A value decrypted publicly is public forever. Ticket therefore spends exactly one public
decryption per draw — **the winner** — and never a balance, never a total, never a losing entry.

---

## What "publicly verifiable" means

Four claims usually travel under that phrase and they are not equivalent:

| Claim | Ticket |
|---|---|
| Anyone can verify the contract executed correctly | ✅ |
| Anyone can verify the random source | ✅ |
| Anyone can verify the winner corresponds to the committed inputs | ✅ |
| Anyone can independently reconstruct the whole probability calculation | ❌ |

The fourth requires the balances and is therefore unachievable in a system whose premise is that
balances are private. **The Verify Draw screen prints this table on itself.** A fairness claim
that quietly means less than the reader assumes is worse than one that is smaller and exact.

---

## Trust and threat model

| Party | Can | Cannot |
|---|---|---|
| **Contract author / operator** | Trigger draws, fund prizes | Read any depositor balance or time-weight; influence the random source; select the winner |
| **Depositor** | Read their own balance; deposit and withdraw freely | Read anyone else's; predict the draw; gain odds by depositing late |
| **Chain observer** | See the winner, the prize, the number of participants, and every fairness check | Recover any balance or time-weight from state, events or public inputs |
| **Threshold key network** | Decrypt, collectively | — and this is the trust assumption, stated: "nobody can see your balance" means "no single party can" |

## Where it is thin, said plainly

- **The trust model is not zero.** Threshold decryption is an assumption about a network, not a
  mathematical impossibility.
- **Small pools leak.** With three depositors, winning discloses a great deal about the other
  two. Ticket warns and states the participant count rather than pretending otherwise.
- **The prize is sponsor-funded in the demo, not yield.** A prize-savings product is only
  genuinely no-loss when the prize comes from real yield. The interface says which one it is.
- **Amounts are hidden; addresses are not.** Ticket is not an anonymity system and does not
  market itself as one.
