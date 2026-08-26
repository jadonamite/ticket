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

## Repository

| Path | Holds |
|---|---|
| `contracts/` | Pool, encrypted time-weighting, draw, verification |
| `app/` | Deposit, withdraw, draw view, Verify Draw |
| `bench/` | Published *N → operations → time → gas* benchmark |
| `docs/` | Architecture, cryptographic construction, threat model |
| `PRD.md` | What the product is and who it is for |

Requirements and success criteria: `../../specs/ticket/spec.md`.

## Licence

MIT. See `LICENSE`.
