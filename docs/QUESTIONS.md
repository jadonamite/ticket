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
