# The late whale

Pool `0xfc320bE0eb6876AE29899e4FbbEEb7C0e36b8105` · 2026-09-03T17:53:31.705Z

> **Provenance.** Run against the Sep 1 deployment, before the Sep 4 redeploy that fixed the
> prize-escrow bug (`contracts/DrawMachine.sol`). That fix does not touch deposits, weight, or
> sealing — the mechanism this file demonstrates — so the result stands. The pool currently live is
> the one in `deployments/sepolia.json`, not the address above.

Two identical stakes of 1000000 base units. The only difference is when they arrived.

| depositor | held | weight | share of the draw |
|---|---:|---:|---:|
| patient | 3360s | 24168000000 | 58.1% |
| latecomer | 48s | 17448000000 | 41.9% |

The same money bought **1.4x** the odds.

Every number in the weight column was decrypted by the address that owns it, under EIP-712,
and by nobody else. A third party reading this chain sees two deposits, two seal
transactions and no amounts at all — which is the point: the rule that stops the late whale
is enforced on values nobody can read.
