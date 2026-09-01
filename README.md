# Ticket

**A prize pool that cannot see your money and still cannot be gamed.**

Put money in. Take it out whenever you like, in full. You never lose principal. Instead of
interest, you get entries in a draw.

Your balance is encrypted the whole time — from the other players, from the operator, from the
person who wrote the contract.

---

## The oldest safe bet in finance, made private

Prize-linked savings is not exotic. Britain has run it since 1956 as Premium Bonds: over
£78 billion held for more than 22 million people, about a third of the country. American credit
unions copied it in 2009 as *Save to Win*, and Congress passed the American Savings Promotion Act
in 2014 specifically to legalise it nationwide.

It works because nobody loses. The only thing at stake is the interest, which is pooled and drawn
for instead.

## The thing that breaks when you encrypt it

Every on-chain prize pool has had to add three mechanisms after being gamed:

- **odds by time-weighted average balance**, not balance at the moment of the draw
- **an exit penalty**, so nobody parks money for a week and walks
- **a per-address prize cap**, so one wallet can't take the pot repeatedly

**All three read your balance in the clear.**

So encrypting balances — the entire point of confidential finance — silently switches off every
protection at once. And the attack they exist to stop becomes *invisible*: a whale deposits an
hour before the draw, wins, withdraws, and no observer can even show it happened, because the
balances that would prove it are encrypted.

> Encrypting balances doesn't just hide the money. It deletes every mechanism that made the
> game fair.

## Ticket rebuilds the fairness inside the encryption

The core of the build is an **encrypted time-weighted balance** — a running integral of your
balance over time, maintained per depositor, decrypted by nobody, ever. Odds come from that, so
money held for three months beats money parked for an hour, and no one has to see either.

Randomness is generated on chain, unpredictable and uninfluenceable by any player or operator.
Winner selection runs as a tournament over a weighted structure, so a draw costs work
proportional to depth rather than to crowd size.

Exactly one value is ever made public: **the winner.** Never a balance. Never a total. Never a
losing entry.

## Verify Draw

A fairness claim is worth what a stranger can check. One click from any settled draw:

```
DRAW #0842

Participants:              1,284
Randomness source:         ✓ verified
Time-weighted balances:    ✓ verified
Weight cap:                ✓ verified
Winner selection:          ✓ verified

Winner: 0x7A…
```

Anyone can confirm the contract executed correctly, that the randomness was genuine, and that the
winner follows from the committed inputs — while every balance behind it stays encrypted.

**Everything anyone needs to check fairness is public. Nothing anyone could use to snoop is.**

## What you get

| | |
|---|---|
| **No loss** | full principal back, whenever you ask |
| **Private** | your balance and your deposit history are yours |
| **Fair** | odds by time held, not by timing the draw |
| **Checkable** | every draw verifiable by anyone, in one click |
| **Free to leave** | no lock-up, no notice period |

## Running it

Node 20 or newer, and nothing else. A clean checkout tests itself with no configuration: the
suite runs against the FHEVM mock, which enforces the real per-transaction compute ceilings.

```bash
npm install
npx hardhat test
```

For Sepolia, three encrypted variables — they are stored by Hardhat, not in a file:

```bash
npx hardhat vars set MNEMONIC          # account 0 deploys, account 1 keeps
npx hardhat vars set SEPOLIA_RPC_URL   # optional, defaults to a public endpoint
npx hardhat vars set ETHERSCAN_API_KEY # only for `npm run verify:sepolia`
```

Fund both accounts from a Sepolia faucet — `npx hardhat run scripts/fund-check.ts --network
sepolia` prints the addresses and what they hold — then:

```bash
npm run deploy:sepolia          # token and pool, addresses recorded in deployments/
npm run status                  # pool state, open draw, queue depth
npm run keeper                  # open a draw and drive it to settlement
npm run test:live               # a complete draw, timed and priced, into bench/LIVE.md
npx hardhat ticket:whale --hold 600 --network sepolia   # the late whale, into docs/WHALE.md
```

`ticket:draw` reads the draw's phase off the contract and does what that phase needs next, so a
run interrupted halfway down the tree is resumed by running it again rather than restarted.

If the public RPC endpoints drop sockets under load — several hundred calls go out per draw —
put the retrying proxy in front of them:

```bash
npm run proxy                                    # 127.0.0.1:8547, in its own terminal
SEPOLIA_RPC_URL=http://127.0.0.1:8547 npm run keeper
```

### Deployed

| | Sepolia |
|---|---|
| pool | `0xfc320bE0eb6876AE29899e4FbbEEb7C0e36b8105` |
| demo token | `0xb98B5e2aa3A74cf1cDB981b3aA35E3B882487f88` |

Arity 16 over 4,096 leaves, three levels, one-hour draw periods. The demo token is faucet-mintable
by anybody: `claim()` gives 1,000 units, once an hour, so this can be tried without asking anyone
for tokens.

## Repository

| Path | Holds |
|---|---|
| `contracts/` | Pool, encrypted time-weighting, draw machine |
| `app/` | Deposit, withdraw, draw view, Verify Draw |
| `test/` | The mock suite — principal, privacy, reveal binding, soak |
| `live/` | The same claims against Sepolia's real relayer and KMS |
| `bench/` | Published *N → operations → time → gas* benchmark, and the live draw |
| `tasks/` | Keeper and the late-whale demonstration |
| `config/` | Arity, capacity and period, with the measurements that fixed them |
| `docs/` | Architecture, cryptographic construction, threat model |
| `PRD.md` | What the product is and who it is for |

Requirements and success criteria: `../../specs/ticket/spec.md`.

## Licence

MIT. See `LICENSE`.
