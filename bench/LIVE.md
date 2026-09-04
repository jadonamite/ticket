# Live draw on Sepolia

Pool `0xfed4a998664395b41894f44b87F5390E198154e2` · token `0xb98B5e2aa3A74cf1cDB981b3aA35E3B882487f88` · draw 1 · 2026-09-01T07:04:13.700Z

> **Provenance.** This run was driven against the pool deployed at that commit. The current
> deployment adds `sealWeight` / `sealedWeightOf`, which a depositor uses to read their own
> time-weight; nothing on the draw path changed, so every figure below still applies. The
> addresses in use are always the ones in `deployments/sepolia.json`.
>
> **Update, Sep 4.** The pool was redeployed again to fix a real bug: `commitDraw` used to take a
> plaintext prize that could disagree with what the token actually escrowed, risking depositor
> principal on an underfunded sponsor. It now takes an encrypted prize the same way `deposit` takes
> an encrypted balance, and is `payable` to fund an optional per-step reward for whoever advances
> the draw. That changes `commitDraw`'s own gas line below (it now carries an encryption + proof
> check) and drops the prize amount from `DrawSettled`/`PrizeReturned` entirely — every other row
> (deposit, select, reveal, settle) is unaffected, since nothing about the draw's descent changed.

Winner `0xF64915f951Ef8a8307783B7feF702F856aDc01eB`, slot 0, descent path [0, 0, 0].
The whole draw took **180.4s** and **11351809 gas** across
8 transactions and 3 KMS round trips.

| step | gas | seconds | global HCU | depth |
|---|---:|---:|---:|---:|
| operator 0xF64915 | 46159 | 8.2 | 0 | 0 |
| operator 0x0627af | 46159 | 22.0 | 0 | 0 |
| deposit 0xF64915 | 1372633 | 20.1 | 3,561,480 | 588,032 |
| deposit 0x0627af | 1154065 | 16.1 | 3,561,160 | 588,032 |
| commitDraw | 1701499 | 12.8 | 8,457,024 | 527,032 |
| selectLevel 0 | 2071064 | 23.1 | 14,650,024 | 3,864,064 |
| kms 0 | — | 11.8 | — | — |
| revealLevel 0 | 1552979 | 12.8 | 8,432,960 | 527,032 |
| selectLevel 1 | 2017885 | 24.2 | 12,963,992 | 1,715,064 |
| kms 1 | — | 10.3 | — | — |
| revealLevel 1 | 1558823 | 12.9 | 8,432,896 | 527,032 |
| selectLevel 2 | 2019885 | 22.7 | 12,963,992 | 1,715,064 |
| kms 2 | — | 8.8 | — | — |
| revealLevel 2 | 385753 | 28.3 | 0 | 0 |
| settle | 43921 | 11.1 | 0 | 0 |
