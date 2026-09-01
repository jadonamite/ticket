# Operations

Everything needed to deploy, run and rescue a Ticket pool, written so that someone who has never
seen this repository can do all three without asking anyone.

---

## 1. Prerequisites

Node 20 or newer. Nothing else. A clean checkout tests itself with no configuration, because the
suite runs against the FHEVM mock — which enforces the real per-transaction compute ceilings, so
a test that passes there is not passing on a toy.

```bash
npm install
npx hardhat test          # 56 tests, about 40 seconds
```

## 2. Configuration

Three variables, stored by Hardhat's encrypted variable store rather than in a file, so they
never sit in the repository or in shell history.

```bash
npx hardhat vars set MNEMONIC            # account 0 deploys and owns; account 1 keeps
npx hardhat vars set SEPOLIA_RPC_URL     # optional; defaults to a public endpoint
npx hardhat vars set ETHERSCAN_API_KEY   # only for `npm run verify:sepolia`
```

Unset, `MNEMONIC` falls back to the well-known Hardhat test mnemonic, so a clean checkout still
runs. The environment overrides the store — `SEPOLIA_RPC_URL=… npx hardhat …` — which is how the
local proxy in §7 is used without changing anything stored.

## 3. Funding

```bash
npx hardhat run scripts/fund-check.ts --network sepolia
```

Prints both addresses and what they hold. Sepolia ETH is free:
`cloud.google.com/application/web3/faucet/ethereum/sepolia` gives 0.05 per address per day.

| account | needs | why |
|---|---|---|
| deployer (account 0) | ~0.01 ETH | deployment is about 5.5M gas total |
| keeper (account 1) | ~0.05 ETH | a draw is 11.5M gas, eight transactions |

## 4. Deploying

```bash
npm run deploy:sepolia
```

Deploys the demo confidential token if it is not already deployed, then the pool, with the
parameters in `config/params.ts` — arity 16, capacity 4,096, one-hour periods — and the keeper
set to account 1. Addresses are written to `deployments/sepolia/` by `hardhat-deploy` and
summarised in `deployments/sepolia.json`, which every task reads.

Verify the source once an Etherscan key is set:

```bash
npm run verify:sepolia -- <pool address> <token address> 16 4096 3600 <keeper address>
```

> `deploy/` is scanned by `hardhat-deploy`, which runs **every** file in it as a deployment
> script. Parameters therefore live in `config/params.ts`, not next to the deploy script.

## 5. Running a draw

```bash
npm run status                      # pool state, open draw, queue depth
npx hardhat ticket:draw --prize 1000 --network sepolia
```

`ticket:draw` reads the draw's phase off the contract and does whatever that phase needs next, so
it is **resumable rather than transactional**. If it crashes at level two, run it again and it
picks up at level two. It drains any parked queue before opening, and drains what accumulates
after settling.

The prize is pulled from the keeper's own token balance, so the keeper must hold the demo token
and have made the pool an operator. A prize of `0` runs a draw with no payout, which is the right
thing when all you want is to exercise the machinery.

Expect about **three minutes**: eight transactions at 10–25 seconds each and three KMS round trips
at 7–20 seconds each.

## 6. Rescue procedures

### A draw is stuck

```bash
npm run status        # shows phase, level, and the time after which it can be abandoned
```

| phase | meaning | what to do |
|---|---|---|
| `Prepared` | children sealed, waiting to be scanned | `ticket:draw` — it will call `selectLevel` |
| `Selected` | index published, waiting on the KMS | `ticket:draw` — it will retry the decryption |
| `Settled` | finished | nothing |

If the decryption service is down, confirm it before touching anything:

```bash
npx hardhat test live/decrypt.live.ts --network sepolia
```

That decrypts handles already on chain and already granted. If it fails while the ACL contract
reports those same handles allowed, the relayer is the problem and not the pool. See the Sep 1
note in `docs/QUESTIONS.md` for a worked example.

### A draw cannot be finished at all

After six hours from its seal time, **anyone** can release it:

```bash
npx hardhat console --network sepolia
> const pool = await ethers.getContractAt("DrawMachine", "<address>")
> await pool.abandonDraw(<id>)
```

The prize returns to the sponsor, `openDraw` clears, deposits and withdrawals resume, and the
parked queue is executed. No winner is invented.

### Parked interactions are waiting

```bash
> await pool.queueLength()
> await pool.drainQueue(4)       # permissionless; repeat until zero
```

`commitDraw` refuses to open a new draw while the queue is non-empty, so this has to reach zero
before the next draw.

### The keeper key is lost or compromised

```bash
> await pool.connect(owner).setKeeper("<new keeper>")
```

Owner only, and refused while a draw is in flight so a rotation cannot orphan a descent. The
owner is the deploying address and is immutable.

## 7. When the network is unreliable

Several hundred RPC calls go out per draw. Public Sepolia endpoints drop sockets under that load,
and some answer a rate limit with HTTP 200 and an error body — which reaches ethers as
`missing revert data` and loses the real cause entirely.

```bash
npm run proxy                                        # 127.0.0.1:8547, its own terminal
SEPOLIA_RPC_URL=http://127.0.0.1:8547 npm run keeper
```

The proxy retries a failed request across endpoints and distinguishes *a provider refusing* from
*a transaction reverting* — a genuine `execution reverted` is handed back untouched, because the
caller is entitled to the revert data.

It deliberately **does not** drift onto a fallback endpoint after a bad socket. Two independent
nodes are not at the same block height, and a value written a second ago coming back as zero is
indistinguishable from it genuinely being zero. Failover is for the one request that failed, not
for the session.

## 8. Measuring

```bash
npm run bench            # mock: N ∈ {8, 128, 4096} → bench/RESULTS.md
npm run test:live        # Sepolia: one complete draw, timed and priced → bench/LIVE.md
npx hardhat ticket:whale --hold 600 --network sepolia    # → docs/WHALE.md
```

The live run records gas, wall time, global HCU and sequential depth per transaction, taken from
the coprocessor's own events. Those are the numbers to check after any change to the draw: if
selection moves above roughly 80% of either ceiling, drop to arity 8 as `config/params.ts`
describes.

## 9. Deployed

| | Sepolia |
|---|---|
| pool | see `deployments/sepolia.json` |
| demo token | see `deployments/sepolia.json` |

The demo token is faucet-mintable by anybody — `claim()` gives 1,000 units once an hour — so the
pool can be tried without asking anyone for tokens. It exists because there is no official
confidential USDT on Sepolia; the pool takes any `IERC7984` as a constructor argument, so
pointing it at a real one is a parameter change and not a migration.
