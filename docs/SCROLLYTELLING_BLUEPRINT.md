# Ticket — Industrial Blueprint & Scrollytelling Specification

**Document Version**: 1.0.0  
**Status**: Approved for Build  
**Target Application**: `app/` (Next.js 16 / React 19 / Motion 13 / Tailwind 4)  
**Spec of Record Reference**: [`specs/ticket/spec.md`](file:///Users/mac/Projects/jadonamite/ticket/PRD.md) · [`docs/ARCHITECTURE.md`](file:///Users/mac/Projects/jadonamite/ticket/docs/ARCHITECTURE.md)

---

## 1. Creative Direction & Philosophy

### The Problem with Web3 & Lottery Visuals
Conventional crypto applications and lottery games default to one of two visual tropes:
1. **Disposable Gambling Clipart**: Perforated paper stubs, casino wheels, flashing neon tokens, and slot machine aesthetics.
2. **Cheesy 3D Sci-Fi Tropes**: Glossy plastic shapes, over-rendered cyan floating locks, and generic "quantum" holographic globes.

Both are fatally misaligned with **Ticket**. Ticket is not a casino game, and it is not a disposable slip:
- **Nobody loses principal**: Deposits are permanent capital savings, directly inspired by the 1956 British Premium Bonds and US credit union prize-linked savings.
- **Fairness survives encryption**: All balances are encrypted with Fully Homomorphic Encryption (FHEVM). Balances are never visible in the clear.
- **The code is the auditor**: Fairness is proven through rigorous mathematics ($\int b(t) dt$), tournament trees, and single-winner decryption.

### The Industrial Technical Blueprint
To convey precision engineering, mathematical integrity, and institutional trust, the core visual centerpiece is an **Industrial Engineering Blueprint** of the Ticket chassis, rendered with the restraint of **Dieter Rams, Teenage Engineering, and NASA technical schematics**.

---

## 2. Visual Assets & Media Architecture

All assets are maintained in the repository under [`app/public/images/`](file:///Users/mac/Projects/jadonamite/ticket/app/public/images/) and [`docs/images/`](file:///Users/mac/Projects/jadonamite/ticket/docs/images/):

| Asset Name | Target Path | Visual Description |
|---|---|---|
| **Ticket Blueprint Hero** | `app/public/images/ticket-blueprint-hero.jpg` | 16:9 dark matte slate engineering card. Contains the official wordmark `TICKET`, subtitle `CONFIDENTIAL PRIZE-LINKED SAVINGS // FHEVM SPEC`, shielded vault glyph, integral formula $W = \int b(t) dt$, encrypted hex hash `0x7A4C...3B9F`, circular `VERIFY DRAW` seal, and outer technical dimension calipers. |
| **Cloud Atmosphere 1** | `app/public/images/cloud-bg-1.jpg` | Moody charcoal and midnight slate cloudscape with ambient backlit mist. Serves as the primary hero background backdrop. |
| **Cloud Atmosphere 2** | `app/public/images/cloud-bg-2.jpg` | High-altitude twilight cloud horizon with soft rim lighting along cloud crests. Crossfades smoothly during the scroll progression. |

---

## 3. Content Mapping to FHEVM Architecture

The blueprint surface is mapped into four distinct functional zones, reflecting the four core architectural guarantees in `contracts/DrawMachine.sol` and `contracts/TicketPool.sol`:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│  TICKET                                                       FHEVM SPEC: ZAMA-S4 / SEPOLIA   │
│  CONFIDENTIAL PRIZE-LINKED SAVINGS                            DIM: 102.00 × 58.00 mm           │
├──────────────────────────────────────┬─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│                                      │                                                         │
│  [ZONE 1: SHIELDED VAULT CORE]       │  [ZONE 3: PUBLIC DRAW ENTRY]                            │
│  • Encrypted Balance:                │  • Entrant Public Commitment:                           │
│    euint64 balance [CIPHERTEXT]      │    0x7A4C...3B9F                                        │
│  • Glyph: Shielded Vault             │  • Tournament Leaf Index:                               │
│  • Principle: Zero Principal Loss    │    Leaf #0842 · Depth 8                                 │
│    "Balances encrypted under FHEVM.  │  • Principle: Decrypt Exactly One Thing                 │
│     Never readable by players,       │    "Public decryption is permanent. Spend it once,      │
│     operator, or contract."          │     deliberately: only the winner is revealed."         │
│                                      │                                                         │
├──────────────────────────────────────┤  [ZONE 4: VERIFY DRAW SEAL]                             │
│                                      │  • Verification Seal Glyph                              │
│  [ZONE 2: TIME-WEIGHTED ODDS]        │  • 4-Point Independent Audit:                           │
│  • Formula:                          │    [✓] Randomness Source                                │
│    W_i = ∫₀ᵀ b_i(t) dt               │    [✓] Time-Weighted Balances                           │
│  • Principle: Anti-Whale Invariant   │    [✓] Per-Address Weight Cap                           │
│    "Holding 90 days beats parking    │    [✓] Winner Selection                                 │
│     for 1 hour. Late whales win      │                                                         │
│     odds near zero."                 │                                                         │
└──────────────────────────────────────┴─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
                                       ▲
                         LASER PERFORATION SEAM
                     (Private Wallet ── Public Pool)
```

### Zone 1 — Shielded Vault Core (Zero Principal Loss)
* **Code Anchor**: `contracts/TicketPool.sol`
* **Invariant**: Balances are held as FHEVM `euint64` ciphertexts. Depositors can withdraw 100% of their principal at any time without penalty or lockup.
* **UI Callout**: Pointer arrow targeting the upper-left vault glyph. Explains that confidential finance must never gamble depositors' principal.

### Zone 2 — The Fairness Invariant (Time-Weighted Odds)
* **Code Anchor**: `contracts/DrawMachine.sol` · `test/timeweight.spec.ts`
* **Invariant**: $W_i = \int_{0}^{T} b_i(t) \, dt$. Weight accumulates continuously over time.
* **UI Callout**: Pointer arrow targeting the lower-left integral formula. Explains how late whales placing large deposits seconds before a draw win odds near zero.

### Zone 3 — Laser Perforation Seam & Public Draw Stub
* **Code Anchor**: `contracts/DrawMachine.sol`
* **Invariant**: Clean separation between private wallet credentials and the public tournament tree. Exactly one public decryption occurs per draw (revealing the winner).
* **UI Callout**: Pointer arrow targeting the center dashed perforation and the `0x7A4C...3B9F` leaf commitment.

### Zone 4 — The Verify Draw Seal (4-Claim Stranger Audit)
* **Code Anchor**: [`PRD.md`](file:///Users/mac/Projects/jadonamite/ticket/PRD.md)
* **Invariant**: A fairness claim is only worth what a stranger can verify. Four claims are audited:
  1. Execution & Randomness Source
  2. Time-Weighting Rule
  3. Per-Address Weight Cap
  4. Winner Selection Tournament
* **UI Callout**: Pointer arrow targeting the lower-right `VERIFY DRAW` circular stamp.

---

## 4. Scroll Choreography & State Machine

The interaction uses a pinned viewport container (`h-[420vh]` with `sticky top-0 h-screen`) driven by Framer Motion (`useScroll`, `useTransform`).

```
Scroll Timeline:
0% ─────── 18% ────────── 35% ────────── 55% ────────── 75% ────────── 90% ────── 100%
 │          │              │              │              │              │           │
 └─ Stage 1 ┴── Stage 2 ───┴── Stage 3 ───┴── Stage 4 ───┴── Stage 5 ───┴─ Stage 6 ─┘
    Center      Dock Left     Callout 1      Callout 2      Callout 3     Callout 4    Release
    Hero        Transition    Vault Core     Integral Math  Public Stub   Verify Seal  Next Sec
```

### State Table

| Scroll % | Ticket Geometry (`x`, `scale`, `opacity`) | Background State | Active Focus | Explanatory Content |
|---|---|---|---|---|
| **0% – 18%** | `x: 0%` (center), `scale: 1.0` | Cloud 1 (`opacity: 1`), Cloud 2 (`opacity: 0`) | Full Blueprint in Hero Viewport | **Hero Headline & Badges**: "A prize pool that cannot see your money and still cannot be gamed." |
| **18% – 32%** | `x: 0% → -26%` (docks to left), `scale: 1.0 → 0.82` | Cloud 1 crossfading into Cloud 2 | Spatial transition | Hero text fades up; two-column scrollytelling view locks in. |
| **32% – 48%** | Pinned Left (`x: -26%`, `scale: 0.82`) | Cloud 2 active with subtle ambient drift | **Zone 1: Shielded Vault Core** | **Card 1**: "Zero Principal Loss" — FHEVM encrypted balance, full withdrawal anytime. |
| **48% – 66%** | Pinned Left (`x: -26%`, `scale: 0.82`) | Cloud 2 active | **Zone 2: Integral Formula** | **Card 2**: "Fairness Survives Encryption" — Time-weighted integral stops late whales live. |
| **66% – 82%** | Pinned Left (`x: -26%`, `scale: 0.82`) | Cloud 2 active | **Zone 3: Perforated Stub** | **Card 3**: "One Decryption: The Winner" — Strict boundary between private wallet & public pool. |
| **82% – 94%** | Pinned Left (`x: -26%`, `scale: 0.82`) | Cloud 2 active | **Zone 4: Verify Draw Seal** | **Card 4**: "Verify Draw" — Stranger-auditable 4-claim checklist. |
| **94% – 100%** | `x: -26%`, `opacity: 1 → 0` | Smooth transition to content section | Release container | Content flows naturally into deposit & verify dashboard. |

---

## 5. Technical Implementation Details

### Overlay Indicator System
To make the pointing arrows and callout lines dynamic:
- An absolute SVG overlay layer sits precisely over the blueprint image coordinates `(viewBox="0 0 1600 900")`.
- When an active step triggers, the corresponding SVG caliper line traces from the target zone to the card anchor, and a glowing node (`r="6"`) pulses at the target coordinate.
- Coordinate Map on 1600 × 900 canvas:
  - **Zone 1 (Vault)**: `cx: 280, cy: 380`
  - **Zone 2 (Integral)**: `cx: 390, cy: 720`
  - **Zone 3 (Perforation & Hash)**: `cx: 1210, cy: 370`
  - **Zone 4 (Verify Seal)**: `cx: 1300, cy: 710`

### Performance & Accessibility
- **CSS `will-change: transform`** applied to the docked ticket container to ensure hardware-accelerated GPU composting.
- **Smooth Interpolation**: Transforms are driven by Framer Motion springs (`damping: 30, stiffness: 200`) for fluid physics during momentum scrolling.
- **Mobile Graceful Degradation**: On mobile screens (`< 1024px`), the pinned two-column layout falls back to an interactive swipeable card carousel with thumbnail view.
