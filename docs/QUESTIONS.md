# Questions to Zama, Aug 26 2026

Four facts the Season 4 post and the submission form do not state. Sent to
developer@zama.org before any product code was written.

**To** developer@zama.org
**Subject** Season 4 bounty — eligibility, prior work, and the cUSDT address on Sepolia

---

Hello,

I'm building an entry for the Mainnet Season 4 bounty track — a confidential prize-linked
savings pool — and there are four things I can't find answered on the announcement post or
the submission form. I'd rather ask than assume.

1. **Eligibility.** Is the bounty open to solo builders as well as teams, and is there a
   team size cap? Neither page states it.

2. **Prior work.** Does the submission have to be built during the season, or is existing
   work admissible provided it meets the brief? I found no clause either way. My entry is
   new code, so this doesn't change my plans — I'd just like the rule on record.

3. **cUSDT on Sepolia.** Is there an official cUSDT deployment on Sepolia I should point
   the pool at? Your contract-addresses page lists the core protocol contracts but no
   confidential token. If there isn't one, I'll ship a faucet-mintable ERC-7984 token for
   the demo and take the token address as a constructor argument, so swapping to the real
   one is a redeploy.

4. **Deployment target.** The bounty says deployments target Sepolia. Is a Sepolia
   deployment what you want to see judged, or would you prefer Ethereum mainnet where the
   protocol is live? `ZamaEthereumConfig` covers both, so this is a choice about where to
   point the demo rather than a code change.

Thank you,

Jadon

---

## Operational note — Sep 1, 2026: the relayer's decrypt endpoints returned 500 for hours

Both `POST /v2/user-decrypt` and `POST /v2/public-decrypt` on
`relayer.testnet.zama.org` answered every request with

```
500  Transaction simulation failed: Execution reverted: execution reverted
```

while `GET /v2/keyurl` stayed healthy and the chain was fine. This was confirmed to be
service-side rather than ours by three independent checks:

1. The **spike** contract — four tests that passed on Sepolia earlier the same day, unchanged —
   failed on both decryption paths.
2. The **ACL contract itself** reported `isAllowed(handle, user) == true` and
   `isAllowed(handle, pool) == true` for the exact handles the relayer refused.
3. It failed identically for two different accounts and two different pool deployments.

`live/decrypt.live.ts` is the check that establishes this in about ten seconds.

**Questions for developer@zama.org, alongside the ones above:**

- Is there a status page or a documented health endpoint for the relayer? `GET /v2/keyurl`
  returning 200 while both decrypt endpoints return 500 is not a useful signal.
- What is the intended client behaviour during such an outage — is the request queued, or must
  it be resubmitted?
- Is there a rate limit on user decryption per account, and does exceeding it surface as this
  same 500?

**What it changes in the build.** Nothing structural, and that is worth saying: the design
already assumes this service can stop. A draw that stalls mid-descent can be abandoned by anyone
after six hours, which releases the pool and returns the prize, and withdrawals never wait on it.
What the outage does confirm is that the draw screen must name the thing it is waiting for —
"waiting on the decryption network" — rather than show a spinner. A judge who hits this during
review should be able to tell a stalled service from a broken product.
