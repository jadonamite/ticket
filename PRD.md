# Ticket — Product Requirements

**Owner** jadonamite · **Status** approved for build · **Written** Aug 26, 2026
**Ships against** Zama Developer Program Season 4, Sep 5 2026 23:59 AOE (= Sep 6, 11:59 UTC)
**Spec of record**: this document. No separate requirements spec exists — the engineering docs in
`docs/` are the implementation-level detail, and this is the product-level source of truth.

---

## 1. The problem

Prize-linked savings is one of the most successful consumer financial products ever built, and
one of the least glamorous. You cannot lose your money. The only thing at risk is the interest,
which is pooled and drawn for instead. Britain has run it since 1956. American credit unions
copied it in 2009 and Congress legalised it nationwide in 2014.

Its on-chain versions had to add three anti-abuse mechanisms after being gamed: odds by
time-weighted average balance, an exit penalty, and a per-address prize cap.

**All three read balances in the clear.** Encrypt balances — which is the whole point of
confidential finance — and every one of them stops working simultaneously, without an error,
without a warning. And the attack they exist to stop becomes unobservable: a large deposit
placed just before a draw, a win, an immediate withdrawal, and nobody can even demonstrate that
it happened.

This is the thing worth building: **not a lottery with encryption sprinkled on, but the
fairness invariants rebuilt to survive encryption.**

## 2. Who this is for

**Primary — the saver who does not want to gamble.** Someone who would like the upside of a
lottery ticket without the possibility of loss, and who does not want their savings balance,
their deposit timing, or the size of their win legible to everyone forever.

**Secondary — the judge, the auditor, and the sceptic.** A fairness claim is only worth what a
stranger can check. The **Verify Draw** view is a first-class part of the product, not a
reporting feature, because "it's on-chain" and "I can verify the fairness" are different
sentences and only the second one is a promise.

**Not for:** anyone seeking anonymity. Ticket hides amounts, not addresses.

## 3. What the user does

Deposit. Wait. Watch a draw. Withdraw in full whenever they like.

The one genuinely awkward moment is that revealing a winner requires an oracle round trip, so a
draw is inherently two transactions. **Most entries on this stack will show a spinner and hope.**
Ticket treats the pending state as a designed screen — what has happened, what is waiting, what
happens next — because that round trip is the single most common place a confidential app feels
broken.

## 4. Product principles

1. **Nobody loses principal. Ever. No exceptions, no rounding against the depositor.**
2. **Everything anyone needs to check fairness is public. Nothing anyone could use to snoop is.**
3. **Decrypt exactly one thing per draw — the winner.** Public decryption is permanent. Spend it
   once, deliberately.
4. **Verifiability is a promise, so make it exact.** Name precisely what the Verify Draw screen
   establishes — execution, randomness, selection — so a stranger knows exactly what they have
   confirmed.
5. **The prize source is on the screen.** People deciding where to put savings are entitled to
   know where the upside comes from, and telling them is a trust feature.

## 5. Scope

### In — v1 (the programme)

- Confidential deposits and full-principal withdrawal at any time.
- **Encrypted time-weighted balance** — the running integral of balance over time, per
  depositor, never decrypted. The core of the build.
- On-chain encrypted randomness for the draw, unpredictable and uninfluenceable by any
  participant or operator.
- Winner selection as a tournament over a weighted structure, so a draw does not cost work
  linear in the number of depositors.
- Two-phase draw presented as one comprehensible action, with the pending state designed.
- **Verify Draw**: randomness source, weighting rule, cap, winner — each independently checked,
  with the four-claims table on the screen.
- A published benchmark: *N depositors → operation count → wall time → gas*, at three values of
  N an order of magnitude apart, **including the cost of building the weighted structure**, not
  only of selecting from it.
- Prize source stated in the interface. Small-pool leak warning.

### Out — v1

- Generating the yield that funds prizes. The demo's prize source is declared, not invented.
- Secondary markets, transferable positions, leverage.
- Governance, a token, an emissions schedule.
- Regulatory positioning beyond naming the UK and US statutes that already exist.
- Participant anonymity.

## 6. Release plan

| | What ships | Alone, is it a product? |
|---|---|---|
| **P1** | Deposit · encrypted time-weighting · draw · winner paid · full withdrawal · **Verify Draw** | **Yes.** Ninety seconds, two wallets, and the whole claim is visible. This is the video |
| **P2** | The adversarial demonstration: a large late deposit wins odds near zero, shown live on the fairness panel | Converts the pitch from an assertion into something a judge watches fail |
| **P3** | Multiple prize tiers, per-address cap, automated draw schedule | Turns a demo into a product |

## 7. How we know it worked

| Measure | Target |
|---|---|
| First-time user: deposit → draw → withdraw, no documentation | **< 3 minutes** |
| Depositor balance or time-weight recoverable without that depositor's key | **Never**, from state, events or public inputs |
| Deposit placed immediately before a draw | Wins odds near zero, demonstrably, live |
| Draw settles within block limits at 10× the demo's participant count | Shown by benchmark, including structure construction |
| Principal returned on withdrawal | Exact, every run, no exceptions |
| Verify Draw reachable from any settled draw | One click, legible to someone who has never heard of a prefix-sum tree |
| Second developer deploys from the README alone | Without contacting the author |
| Video | Real person on camera. No synthesised voice or generated footage anywhere |

## 8. Risks

| Risk | Response |
|---|---|
| **Complexity.** Encrypted deposits, time weighting, encrypted arithmetic, caps, randomness, selection, decryption, verification, scale — that is a lot for ten days | P1 is ruthlessly small and is the entire submission. P2 and P3 are upside, dropped without hesitation |
| The tournament is only logarithmic in the *selection* step, while weighting stays linear | Benchmark end to end, publish it, and let the number speak. A logarithmic step on a linear step is a linear system |
| Bounded on-chain randomness requires a power-of-two upper bound and a state-changing call | Designed into the draw from the start, not discovered on day eight |
| The asynchronous decryption round trip makes the app feel broken | Treated as a designed screen. This is where most entries will lose UX marks |
| Reads as "PoolTogether but private" | Never pitched that way. The hook is the question: *what happens to a fair lottery when nobody can see the balances that make it fair?* |
| Sponsor-funded prize misread as yield | Said on the screen |
