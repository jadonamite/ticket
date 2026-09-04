# Testing

What is proven, where, and what would have to be true for it to be wrong.

```bash
npx hardhat test                     # 60 tests on the FHEVM mock, ~10s
npx hardhat test --network sepolia   # the same suite against real infrastructure
npx hardhat test live/draw.live.ts --network sepolia    # a complete draw, on the deployed pool
```

The mock is not a toy: it enforces both real per-transaction ceilings (20,000,000 global HCU and
5,000,000 sequential depth), so a level that would revert on chain reverts there too. What it
does *not* do is exercise the relayer and the KMS signatures, which is what `live/` is for.

---

## The suites

### `test/weighttree.spec.ts` — the encrypted integral
Runs the tree against a cleartext model over a randomised interaction schedule and compares **at
every level**, including across period boundaries. This is the core contribution, so it is checked
differentially rather than by example: if the encrypted integral ever disagrees with ordinary
arithmetic, this fails.

### `test/pool.spec.ts` — principal
The one promise a prize-savings product cannot break. Every test ends by checking a depositor is
back to exactly what they started with. Also covers slot assignment, and that an oversized
withdrawal is silently clamped rather than reverted — reverting would be a public signal about a
private balance.

### `test/timeweight.spec.ts` — the thesis
Equal deposits, different hold times, materially different odds. Expectations are derived from
block timestamps rather than from an assumption about how long the test took.

The decisive one: **a latecomer staking thirty times as much, ten seconds before the seal, still
loses most of twelve draws.** A balance-weighted pool would hand them 97% of the odds. That single
assertion is the difference between this product and the thing it replaces.

### `test/draw.spec.ts` — a draw end to end
Two depositors, a full descent, one winner paid, both principals intact — at the demo arity and
again at the production 16-wide, 4,096-leaf shape. Also: the descent path reconstructs the
winner's slot in base `arity`; an empty leaf is never selected; a second draw cannot open while
one is in flight; only the keeper may open one but anyone may push it forward; a pool with no
surviving weight returns the prize rather than inventing a winner; and — the regression for the
Sep 4 fix — a sponsor who asks for more prize than their real balance covers moves *zero*, not a
partial amount, so an underfunded prize can never come out of depositor principal.

### `test/reward.spec.ts` — paying strangers to advance a draw
Every step after `commitDraw` is already permissionless; this covers whether it's worth doing.
A stranger with no deposit and no keeper role gets paid exactly `rewardPerStep` for each
`selectLevel`/`revealLevel`/`settle` call, out of a bounty the keeper funded at `commitDraw`;
funding nothing changes nothing (old behavior, exactly); and an abandoned draw refunds whatever
slice of the bounty was never paid out back to the sponsor rather than stranding it.

### `test/reveal-binding.spec.ts` — the attack surface
The reveal is the only place an outside value enters the draw. Covers a foreign handle, a padded
handle list, a mismatched cleartext, an out-of-range child, a replayed level, a double settle, a
double select, and a step against a draw that does not exist.

### `test/privacy.spec.ts` — what the public record gives away
Sweeps a completed run: every transaction's calldata, every log's topics and data, and 256
storage slots, looking for any depositor balance, any weight, any pool total, and the products of
each with the hold time. The amounts are deliberately odd numbers — a round figure could collide
with a length, an index or a timestamp and turn a real leak into a passing test.

Also asserts that a balance and a weight cannot be publicly decrypted, that a second address
cannot user-decrypt the first's, and that exactly one value per level is published.

### `test/queue.spec.ts` — interactions during a draw
A parked withdrawal pays out at settle. A parked deposit takes the tokens immediately and buys
odds later. One per slot. The drain is paged, and anyone can push it. A draw will not open over an
undrained queue.

### `test/abandon.spec.ts` — liveness and privilege
The timeout boundary in both directions, the refund, the queue executing on abandonment, the next
draw opening afterwards. Then keeper rotation: owner only, refused mid-draw, never to the zero
address — and an assertion that **no privileged function exists on the ABI** matching
`pause|rescue|sweep|withdrawFrom|setOwner|transferOwnership|emergency`, so the owner's surface
stays one function as the contract grows.

### `test/soak.spec.ts` — many draws in a row
The question one draw cannot answer. Failures that survive a demo are the ones needing state to
accumulate: a residual that drifts, a period roll that loses an integral, a queue index that never
resets.

- **Forty draws over a 9:1 pool.** The heavy side is expected to win 36; the run measures 38. A
  uniform pick — the failure where the weighting silently stops applying — cannot pass the band.
- **A randomised twelve-round schedule** of deposits, withdrawals, prizes and draws, from a fixed
  seed, ending with everybody leaving. Every base unit is accounted for: each depositor back to
  their opening balance plus what they won, the pool holding nothing, and the sponsor down by
  exactly the prizes that were actually won.

### `test/spike.spec.ts` — the protocol round trips
Encrypted input in; user decryption out, by the owner and nobody else; public decryption verified
on chain by `FHE.checkSignatures`; and the ordered-handle binding that makes the third one safe.
These run on the mock in CI and were proven against **live Sepolia** on Sep 1.

Their revert assertions go through `test/helpers/revert.ts` rather than the chai matcher, because
`to.be.reverted` reads the revert out of a gas estimation — which only exists on a network that
simulates before it sends. On Sepolia the transaction is mined with status 0 and ethers raises a
plain `CALL_EXCEPTION` with no data, and a security property that holds would be reported as a
failing test.

---

## `live/` — against real infrastructure

### `live/draw.live.ts`
Drives the **deployed** contracts — not a fresh deployment — through a complete draw, recording
gas, wall time, global HCU and sequential depth per transaction into `bench/LIVE.md`. This is
where the arity choice was confirmed: selection predicted at 3,864,064 sequential depth on the
mock came in at 3,864,064 on Sepolia.

### `live/decrypt.live.ts`
A ten-second health check for the decryption service, which is the one dependency that can take
the product down without a line of this repository changing. It reads handles already on chain and
already granted, so a failure is never ambiguous: cross-check against the ACL contract, and if
that says allowed while this says reverted, the relayer is the problem.

---

## What is not tested

- **Mainnet economics.** Deposits and draws are priced on Sepolia; mainnet gas would change the
  design's cost profile, not its behaviour.
- **Construction at N = 4,096 on a public testnet.** It is 2.29 billion gas. The per-depositor
  figure it would confirm is already confirmed by the live deposit measurement.
- **Adversarial FHE behaviour.** Ticket assumes the coprocessor and KMS behave as specified;
  `docs/SECURITY.md` §6 states that assumption rather than testing it.
- **The front end.** No UI tests exist yet.
