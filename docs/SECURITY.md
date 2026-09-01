# Security model

What Ticket protects, from whom, and what it does not protect. Written to be checkable rather
than reassuring: every claim below names the code that makes it true or the test that would fail
if it stopped being true.

---

## 1. Trust boundaries

| Party | Can | Cannot |
|---|---|---|
| **Owner** (deployer) | Name a new keeper | Read any balance or weight · pause the pool · touch a deposit · influence a draw · take a prize |
| **Keeper** | Open a draw and fund its prize | Everything in the right-hand column above, plus: choose a winner, stop a withdrawal, or strand a draw |
| **Depositor** | Deposit, withdraw at any time, read *their own* balance and weight | Read anyone else's · predict a draw · buy odds by depositing late |
| **Chain observer** | See the winner, the prize, the participant count, and every fairness check | Recover any balance, weight or total from state, events or calldata |
| **Coprocessor / KMS** | Decrypt, collectively | — this is the trust assumption, stated in §6 |

The owner's power is one function, `setKeeper`, and it cannot be used while a draw is in flight.
`test/abandon.spec.ts` asserts that no function matching `pause|rescue|sweep|withdrawFrom|
setOwner|transferOwnership|emergency` exists on the ABI, so the surface stays this small as the
contract grows.

## 2. What is published, and what never is

Exactly **one value per draw level** is made publicly decryptable: the index of the child the
descent took, a `uint8`. Three per draw at depth 3.

Public decryption is **permanent** — a value decrypted publicly is public forever — which is why
the rule is stated as a count rather than a policy. Never a balance. Never a total. Never a
losing entry. Never an internal node of the tree.

A depositor's own balance and weight are granted to their address alone, and read by them
client-side under EIP-712. `test/privacy.spec.ts` asserts that neither can be publicly decrypted
and that a second address cannot user-decrypt the first's.

## 3. The attack the reveal step exists to stop

`FHE.checkSignatures(handles, cleartexts, proof)` proves that the KMS signed *these handles, in
this order*. **It says nothing about whether those handles are the ones this draw published.**

A valid proof for some other publicly decryptable value is a real object that a real attacker can
obtain — anyone can request public decryption of anything marked publicly decryptable. Without a
second binding, its holder could call `revealLevel` with their own handle and cleartext and steer
the descent to any leaf they liked.

So `revealLevel` compares the submitted handle against the draw's own stored handle **before** it
checks signatures, requires exactly one handle, and clears the stored handle on descent so a
replay fails on the binding rather than only on the phase.

```solidity
if (handles.length != 1 || handles[0] != euint8.unwrap(_index[id])) revert UnknownHandle();
if (child >= arity) revert ChildOutOfRange(child);
FHE.checkSignatures(handles, abi.encode(child), proof);
```

`test/reveal-binding.spec.ts` covers: the correct handle accepted; a mismatched cleartext
rejected; a foreign handle rejected; a padded handle list rejected; an out-of-range child
rejected; the same level revealed twice rejected; and — from `test/spike.spec.ts`, proven against
the live KMS — a reordered handle list against a genuine proof rejected.

## 4. Liveness

A draw holds the weight tree still. An unfinished draw would hold it still forever, and the
decryption service is a live service that live services stop — as one did on Sep 1, 2026, during
this build (`docs/QUESTIONS.md`).

- `abandonDraw(id)` releases the pool and returns the sponsor's prize once
  `sealTime + DRAW_TIMEOUT` (6 hours) has passed. **Callable by anyone**: the failure it exists
  for is the keeper going away, so a rescue only the keeper can perform is not a rescue.
- It cannot cancel a draw that is merely slow. A draw takes about three minutes.
- Every draw step other than `commitDraw` is permissionless, so a keeper that stops answering
  cannot strand a draw that is otherwise able to finish.
- `drainQueue(max)` is permissionless. A parked withdrawal is somebody's money and must not
  depend on anyone choosing to finish their work.

`test/abandon.spec.ts` covers the timeout boundary in both directions, the refund, the queue
being executed on abandonment, and the next draw opening afterwards.

## 5. Arithmetic safety

FHE arithmetic **wraps silently**. There is no revert-on-overflow and there cannot be one,
because detecting it would mean branching on a ciphertext. Every bound is therefore enforced
before a value can enter an aggregate — the plaintext ones with `require`, the encrypted one by
clamping with `FHE.min`.

```
B  = Σ balances                 ≤ MAX_DEPOSIT · MAX_SLOTS = 2⁴⁴
dt = seconds since last move    ≤ MAX_PERIOD              = 2¹⁹
weight = A + B·dt               ≤ B · MAX_PERIOD          = 2⁶³
```

`2⁶³` sits one bit under the `euint64` ceiling, and that bit is the margin. The three constants
live together in `contracts/Limits.sol` for exactly that reason: they are one calculation, not
three independent choices.

The draw's `euint128` arithmetic has its own headroom: `r · total ≤ 2³² · 2⁶³ = 2⁹⁵`, and
`prefix · 2³²` has the same bound.

**Two clamps that must not revert.** A deposit over `MAX_DEPOSIT` is capped with `FHE.min`, and a
withdrawal over the caller's balance is clamped to it. Reverting on either would be a public
signal about a private balance, so both silently do the safe thing instead. `test/pool.spec.ts`
covers *"clamps an oversized withdrawal instead of reverting"*.

## 6. What Ticket does not claim

**"Publicly verifiable" is four different claims and they are not equivalent.**

| Claim | Ticket |
|---|---|
| Anyone can verify the contract executed correctly | yes |
| Anyone can verify the random source | yes |
| Anyone can verify the winner follows from the committed inputs | yes |
| Anyone can independently reconstruct the whole probability calculation | **no** |

The fourth requires the balances, and is therefore unachievable in a system whose premise is that
balances are private. The Verify Draw screen prints this table on itself. A fairness claim that
quietly means less than the reader assumes is worse than one that is smaller and exact.

**Other limits, stated rather than buried:**

- **Threshold decryption is an assumption about a network, not a mathematical impossibility.**
  "Nobody can see your balance" means "no single party can".
- **`FHE.randEuint32` is trusted.** Its unpredictability is a property of the coprocessor. No
  player and no operator can influence it, but it is not a VRF anyone can audit independently.
- **Small pools leak.** With three depositors, winning discloses a great deal about the other
  two. The interface warns and prints the live participant count.
- **Amounts are hidden; addresses are not.** Ticket is not an anonymity system.
- **Timing is public.** *When* someone deposited and withdrew is on chain, and with a small
  enough pool that is informative even without amounts.
- **The prize is sponsor-funded here, not yield.** A prize-savings product is only genuinely
  no-loss when the prize is real yield. The interface says which one it is.
- **Not audited.** No third party has reviewed this code.

## 7. Denial of service

| Vector | Handling |
|---|---|
| Keeper never opens a draw | Deposits and withdrawals are unaffected; they never route through a draw |
| Keeper opens a draw and abandons it | `abandonDraw` after 6 hours, by anyone |
| Decryption service down mid-draw | Same path; `live/decrypt.live.ts` diagnoses it in ten seconds |
| Queue filled to block others | Capped at `MAX_QUEUE = 32`, one entry per slot, and it drains at settle |
| Pool filled to exhaust slots | Capacity 4,096, one slot per address, assigned on first deposit |
| Re-entrancy through the token during a drain | Each entry is marked done *before* its transfer runs, and `settle` sets `Settled` and clears `openDraw` before paying anything |

## 8. Reporting

This is a hackathon build with no bug-bounty programme. If you find something, open an issue on
the repository rather than exploiting it against the Sepolia deployment — the tokens there are
worthless, but the finding is not.
