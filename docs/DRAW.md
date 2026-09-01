# The draw

How Ticket picks one winner out of an encrypted pool, and why it is built the way it is.

This is the part of the system with no prior art to copy, so it is written out in full: the
constraint, the construction, the arithmetic, the transaction sequence, and the invariants that
have to hold. Everything here is implemented in `contracts/DrawMachine.sol` and exercised by
`test/draw.spec.ts`, `test/reveal-binding.spec.ts` and `test/soak.spec.ts`.

---

## 1. The constraint

Two facts about FHE decide the whole design:

- **You cannot branch on a ciphertext.** There is no `if (encryptedCondition)`. Every path has to
  be executed and the result selected arithmetically.
- **You cannot index an array by a ciphertext.** There is no `array[encryptedIndex]`.

Together they mean the obvious algorithm — "pick a random point, walk the depositors, stop when
the running total passes it" — cannot be written. The only oblivious version is to compare the
point against *every* depositor's prefix sum and sum the results, which is `O(N)` and does not fit
in a block at any interesting size. That is why every confidential lottery published so far is
linear.

The way out is not a cleverer comparison. It is an observation about what the leak actually is.

> A tournament descent that publicly reveals which child it took at each level reveals the
> winner's slot index one digit at a time — **and the winner's identity is published anyway.**
> The path *is* the answer. Revealing it early costs nothing.

So the draw walks down a k-ary tree from the root, publishing one small integer per level. Work is
`O(k · log_k N)`. Nothing but the winner's index is ever decrypted.

## 2. The structure it walks

`contracts/WeightTree.sol` maintains a k-ary tree over `capacity` leaves, one leaf per depositor.
Each node holds:

| field | meaning |
|---|---|
| `A` | encrypted integral of balance over the current period, up to `lastUpdate` |
| `B` | encrypted total balance in this subtree |
| `lastUpdate` | plaintext timestamp `A` is current as of |
| `lastPeriod` | plaintext period `A` belongs to |

The weight of a subtree at a later time `T` is

```
weight(T) = A + B · (T − lastUpdate)
```

The multiplier is a **plaintext** elapsed time, so this is a ciphertext-by-scalar multiply — one
of the cheap operations — not the ciphertext-by-ciphertext multiply that would blow the compute
budget. Knowing how long money sat somewhere reveals nothing about how much of it there was.

`B` is additive across children by construction. `A` is the integral of `B`. So a parent's pair is
exactly its subtree's pair, *provided* every balance change folds the whole path to the root
before it lands — which is what `_update` does, walking leaf to root, folding elapsed time into
each node's `A` before touching its `B`. Off-path nodes stay correct on their own terms: their
balance did not change, so neither did their integral.

Periods reset lazily. A node whose `lastPeriod` is stale has, by definition, an integral of zero
for the current period. There is no `O(N)` reset pass and there does not need to be.

`test/weighttree.spec.ts` checks this against a cleartext model at every level over a randomised
interaction schedule, including period boundaries.

## 3. Choosing a point without dividing by a ciphertext

The draw needs `P(child j) = w_j / total`, where `w_j` is the child's weight and `total` is the
sum of them. Division by a ciphertext does not exist. Rejection sampling would leak a bit about
the pool total on every retry, which FR-005 forbids.

So the test is cross-multiplied. With `r = FHE.randEuint32()` uniform on `[0, 2³²)`, the event

```
r / 2³²  <  prefix_j / total
```

is evaluated as

```
r · total  <  prefix_j · 2³²          (in euint128)
```

No division, no rejection, and no total revealed. The bias is bounded by one part in `2³²`,
because `r` takes `2³²` values and each boundary lands between two of them.

**Descending needs no fresh randomness.** After child `j` is chosen, the residual

```
R' = r·total − prefix_{j−1}·2³²
```

is uniform on `[0, w_j · 2³²)`, which is exactly the range the next level's own prefix sums live
in. So the same comparison recurses, and there is **one ciphertext-by-ciphertext multiply in the
entire draw** — the most expensive operation available, spent once, at the root.

### Why zero-weight children can never win

The published index is the count of prefix boundaries the point has passed:

```
index = #{ i ∈ [0, k−2] : point ≥ prefix_i · 2³² }
```

A child with zero weight shares its prefix with the child before it, so if the point has passed
one it has passed both and the count steps straight over it. No branch on a ciphertext is needed
to exclude an empty slot. The last child is selectable only if the point passed every boundary,
which requires `point ≥ total · 2³²` — impossible, since `point = r · total < 2³² · total`.

The single exception is `total = 0`: every comparison is `0 ≥ 0`, the index saturates at `k−1`,
and the descent lands on an unoccupied leaf. Nothing can detect that under encryption, so the
contract does not pretend to: the prize returns to the sponsor and `DrawSettled` records a winner
of `address(0)`. Covered by *"returns the prize to the sponsor when no weight survived into the
period"* in `test/draw.spec.ts`.

## 4. Why a level is two transactions

Two per-transaction ceilings apply: **20,000,000 global HCU** and **5,000,000 sequential depth**.
The binding one is depth, which is the opposite of what the sizing arithmetic suggested, and it
was established by measurement (`contracts/spike/HcuProbe.sol`, `bench/RESULTS.md`) before any
product code was written.

| level shape | global HCU | depth |
|---|---:|---:|
| k=8, one transaction | 10,701,576 (53.5%) | 4,335,064 (**86.7%**) |
| k=16, one transaction | — | **reverts** |
| k=16, split — seal children | 11,024,000 (55.1%) | 689,000 (13.8%) |
| k=16, split — running-total prefix + pick | — | **reverts** |
| k=16, split — **scan** prefix + pick | 14,674,088 (73.4%) | 3,864,064 (77.3%) |
| k=32, either shape | — | reverts on global |

Two consequences, both measured rather than argued:

1. **Sealing is separated from selecting.** Sealing k children is k independent chains, so its
   depth is flat at every arity. Splitting hands the entire depth budget to the selection step,
   which is one long chain and needs all of it.
2. **The prefix sum is a Hillis-Steele scan, not a running total.** A running total is `k−1`
   sequential adds and its depth grows with arity — that is what kills k=16. The scan is
   `log₂(k)` rounds deep at the cost of `k·log₂(k)` additions: it trades global compute, which is
   slack, for depth, which is not. It is the single change that makes k=16 fit.

**Arity 16, capacity 4,096, depth 3.** k=8 with the same scan is the documented fallback if real
storage reads ever close the margin; it costs one level of depth and two more transactions.

Confirmed on Sepolia Sep 1: selection came in at **14,650,024 HCU and 3,864,064 depth** — the
depth figure identical to the prediction. See `bench/LIVE.md`.

## 5. The transaction sequence

A draw is `1 + 2·depth + 1` transactions. At depth 3 that is eight, plus three KMS round trips.
The seal of the next level is folded into the reveal of the current one, which is what keeps a
level to two transactions rather than three.

```
commitDraw(prize)      randEuint32, freeze sealTime, escrow the prize,
                       seal the root's k children               → Prepared

  selectLevel(id)      scan → prefix sums
                       level 0 only: point = r · total
                       index = Σ (point ≥ prefix_i · 2³²)
                       makePubliclyDecryptable(index)           → Selected

  ── off chain ──      relayer publicDecrypt(indexHandle)

  revealLevel(id, …)   handle checked against this draw's own
                       published handle, then FHE.checkSignatures
                       residual R' = R − prefix_{j−1}·2³²
                       descend, seal the next level              → Prepared
                                                                   (×3 levels)

settle(id)             slot → address, pay the prize,
                       drain one page of the queue               → Settled
```

`commitDraw` is keeper-only because it escrows the sponsor's prize. **Every other step is
permissionless**: a half-finished draw holds the pool still, so nobody should be able to strand
one.

## 6. Interactions that arrive mid-draw

A draw is judged against the tree as it stood at `sealTime`, so the tree cannot move while one is
running. Blocking withdrawals for that window would break the one promise that makes prize-linked
saving not gambling — your money is available at any time.

So an interaction arriving mid-draw is **parked and executed automatically at settle**. The
depositor acts once; the transaction lands without them.

- A **deposit** moves its tokens immediately — a deposit is not a promise to pay later — and buys
  odds from the settle, not from the seal of a draw already under way.
- A **withdrawal** defers both the tree update and the payout, because paying out without
  updating the tree would break the invariant that the pool's holdings equal what it owes.
- **One parked interaction per slot.** A second withdrawal would clamp against a balance the
  first has not spent yet, and the two together could ask for more than the leaf holds. The
  refusal is on the slot, which is public, so it discloses nothing.

The drain is **paged**: `settle` executes three, and `drainQueue(max)` finishes, permissionlessly.
A parked interaction is a full leaf-to-root walk costing 1,372,633 gas and 3,561,480 HCU on
Sepolia, so a settle that had to do all of them would need more than a block will take. Settling
is not allowed to depend on how many people happened to act while the draw was running.

`commitDraw` refuses to open over an undrained queue: sealing then would seal a state already
known to be wrong.

## 7. Invariants

These are the properties the tests exist to defend. Each names where it is checked.

| # | Invariant | Checked by |
|---|---|---|
| I1 | A withdrawal returns exactly what was deposited, never less | `pool.spec.ts`, `draw.spec.ts`, `soak.spec.ts` |
| I2 | No draw ever moves a depositor's principal | `draw.spec.ts` |
| I3 | The sum of every leaf equals the root, at every level, always | `weighttree.spec.ts` |
| I4 | Odds are proportional to time-weighted balance | `timeweight.spec.ts`, `soak.spec.ts` |
| I5 | Exactly one value per level is made publicly decryptable, and it is a child index | `privacy.spec.ts` |
| I6 | No balance, weight or total appears in calldata, events or storage | `privacy.spec.ts` |
| I7 | Only the handle this draw published can advance it | `reveal-binding.spec.ts` |
| I8 | Every step is safe to retry; none is safe to repeat | `reveal-binding.spec.ts` |
| I9 | A stalled draw cannot hold the pool for more than `DRAW_TIMEOUT` | `abandon.spec.ts` |
| I10 | Tokens in equal tokens owed, across any schedule of interactions | `soak.spec.ts` |

## 8. Deliberate limits

- **Bias of one part in 2³².** Exact proportionality would need division by a ciphertext.
- **Weight earned is not forfeited by withdrawing.** Odds are the integral of balance over the
  period; taking your money out does not retroactively delete the time it was there. A period
  boundary discards it, which is what stops anyone accumulating odds forever.
- **Capacity is fixed at deployment.** 4,096 depositors; slots are assigned on first deposit and
  never reused.
- **`FHE.randEuint32` is trusted to be unpredictable.** That is a property of the coprocessor,
  stated in `docs/SECURITY.md` rather than assumed silently.
