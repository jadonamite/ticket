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
logarithmic step sitting on a linear step is a linear system. The published benchmark measures
end to end — *N depositors → operation count → wall time → gas*, at three values of N an order
of magnitude apart, **including construction of the weighted structure**.

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
