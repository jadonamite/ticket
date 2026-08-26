# Benchmark — cost against N

Arity 16, capacity 4096, depth 3. A draw is 1 + 2*3 + 1 = 8 transactions.

## Building and maintaining the tree — linear in N, and admitted to be

| N | txs | total gas | gas / depositor | total HCU | wall clock |
|---|---|---|---|---|---|
| 8 | 8 | 3,906,466 | 488,308 | 22,049,312 | 0.8s |
| 128 | 128 | 65,448,927 | 511,319 | 352,785,344 | 8.4s |
| 4096 | 4096 | 2,289,975,153 | 559,075 | 11,287,018,560 | 246.3s |

Each deposit walks one leaf-to-root path, so its cost is set by the depth of the tree and
not by how many depositors already exist. The totals grow with N because there are N of
them, which is the honest shape of the claim: the per-depositor column is what to read.

## One draw level — flat in N, which is the whole point

| N | seal gas | seal HCU | seal depth | pick gas | pick HCU | pick depth |
|---|---|---|---|---|---|---|
| 8 | 1,186,283 | 8,432,960 (42.2%) | 527,032 (10.5%) | 1,604,989 | 14,674,088 (73.4%) | 3,864,064 (77.3%) |
| 128 | 1,186,283 | 8,432,960 (42.2%) | 527,032 (10.5%) | 1,587,889 | 14,674,088 (73.4%) | 3,864,064 (77.3%) |
| 4096 | 1,109,149 | 6,164,000 (30.8%) | 527,000 (10.5%) | 1,615,889 | 14,674,088 (73.4%) | 3,864,064 (77.3%) |

A level costs the same at N=8 as at N=4096. The draw is 3 levels regardless, so
the whole selection is flat while the population is not.

Ceilings: 20,000,000 global HCU and 5,000,000 sequential depth per transaction.

Measured 2026-08-26 on hardhat.
