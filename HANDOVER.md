# Handover — Ticket (Zama Season 4 submission)

Written 2026-09-03 to carry context into a new chat. Read this first, then spot-check anything
load-bearing against the actual repo/code before acting on it — this is a snapshot, not a source
of truth.

## Where things are

- **Project**: `/Users/mac/Projects/jadonamite/ticket` (git repo, branch `master`)
- **What it is**: a confidential prize-linked savings pool (deposit → no-loss → periodic encrypted
  draw → one winner) built on Zama's fhEVM, for the **Zama Developer Program Mainnet Season 4**
  bounty — "build a confidential version of PoolTogether."
- **Deadline**: 2026-09-05 23:59 AOE = 2026-09-06 11:59 UTC. As of this writing that's ~2.5 days out.
- **Prize**: 5,000 cUSDT total, up to 3 teams, "an exceptional project may receive the full pool."
  Strongest entry may get a follow-on OpenZeppelin audit + production path.
- Docs worth reading in the repo: `README.md`, `PRD.md`, `docs/ARCHITECTURE.md`, `docs/DRAW.md`,
  `docs/SECURITY.md`, `docs/OPERATIONS.md`, `docs/TESTING.md`.

## The bounty's literal ask (verbatim, matters for judging)

> "Winner selection should execute over encrypted balances, allowing only winners to decrypt their
> prizes while keeping the draw publicly verifiable."

Submission bar: "beyond a proof of concept... polished UX, robust engineering, and
production-ready architecture."

## Verdict on the core idea (already discussed at length, settled)

The core technical claim is sound and well-matched to the brief — not a "wrong bet." The insight
driving the build (encrypting balances silently disables every anti-gaming mechanism a prize pool
needs — time-weighting, exit penalty, prize cap — because all three read a balance in the clear)
is correct and non-obvious, and the fix (an encrypted time-weighted integral + an O(k·log_k N)
tournament-descent draw that never branches on or indexes by a ciphertext) is real, tested,
benchmarked against actual fhEVM compute ceilings, and proven on a live Sepolia draw. Compared to
PoolTogether V5: the TWAB-equivalent (encrypted running integral) is a faithful parity match;
randomness is *simpler* than PT's (native FHE randomness vs. PT's Chainlink-VRF + Dutch-auction
incentive layer) and that's a correct scope choice, not a shortcut; multi-tier prizes and a real
incentive/auction economy are legitimately deferred (P3), not missing by accident.

**The gap is entirely on the product-surface side, not the crypto**: no frontend existed
(`app/` was a generic unrelated marketing-template clone with zero deposit/withdraw/draw/Verify
Draw UI), and the prize is sponsor-funded rather than real yield (disclosed, and the right call —
building real yield sourcing would spend scarce time proving nothing about FHE competence).

## Work completed this session (contracts + tests)

### 1. Fixed: the prize escrow bug (real correctness bug, not just a scope gap)

**Before**: `commitDraw(uint64 prize)` took a *plaintext* prize number. It escrowed whatever
`token.confidentialTransferFrom` actually transferred (discarding the return value) but stored and
later paid out the separately-declared plaintext `prize`. If a sponsor's real balance didn't cover
the declared amount, `settle`/`abandonDraw` would try to pay out more than was ever escrowed —
threatening depositor principal (invariant I1) — and the amount was public from the moment of
commit anyway, which also broke the brief's "winnings remain encrypted" requirement.

**After** (`contracts/DrawMachine.sol`): `commitDraw(bool fundPrize, externalEuint64 encryptedPrize,
bytes inputProof)`. Same pattern as `deposit()` — the ciphertext the token *actually* moves (its
return value) is the one and only prize value stored in `Draw.prize` (now `euint64`, not `uint64`).
There is no second, independently-trusted number left to disagree with it. `fundPrize` is a
plaintext flag (legitimate to branch on — it's the caller's own declared choice, same category as
`child > 0` checks elsewhere), so a no-prize draw skips the transfer/operator-approval entirely.
`DrawCommitted`/`DrawSettled`/`PrizeReturned` events no longer broadcast the prize amount.

Learned along the way: OpenZeppelin's ERC7984 confidential transfer is **all-or-nothing**, not a
partial clamp — `FHESafeMath.tryDecrease` + `FHE.select` means an amount the sender can't fully
cover moves *zero*, not "as much as they have." Test added:
`test/draw.spec.ts` → *"pays out exactly what was escrowed, even if the sponsor asked for more
than they hold"* — proves an oversized request moves nothing for anyone, principal untouched.

Also updated (had to be, or they'd be broken): every test file that opens a draw (`test/*.spec.ts`,
via a new `commit()` helper in `test/helpers/draw.ts`), plus `tasks/keeper.ts` and
`live/draw.live.ts`.

### 2. Started: paying strangers to advance a draw (the "who runs this in production" gap)

Every step after `commitDraw` was already *legally* permissionless (anyone may call
`selectLevel`/`revealLevel`/`settle`) but nothing made it worth a stranger's time — PoolTogether
solves the equivalent problem with a pair of Dutch auctions. Added a minimal version:
`commitDraw` is now `payable`; `msg.value` is split evenly over the draw's `2·depth + 1` remaining
steps and paid to whoever actually calls each one (`Draw.rewardPerStep`, `Draw.rewardBudget`).
Sending nothing reproduces the old behavior exactly (fully backward compatible). If a draw is
abandoned instead of finished, the unpaid remainder of the budget refunds to the sponsor
(`abandonDraw`) rather than getting stuck. New file `test/reward.spec.ts` (3 tests): stranger gets
paid per step, zero-funding is a no-op, abandon refunds the unpaid remainder.
`tasks/keeper.ts` got a `--reward` CLI param to fund this from the real keeper script.

**Left as explicit future work, not done**: `drainQueue` isn't incentivized, and it's a flat fee,
not real price discovery (PT's Dutch auctions exist because a flat fee is wrong in either
direction depending on gas conditions). Fine for a hackathon submission; flagged, not solved.

### Test status

All green: **60/60 passing** (56 original + 1 prize regression test + 3 reward tests), full
`npx tsc --noEmit` clean. Nothing has been committed to git — that's a deliberate choice, left for
the user to review/commit.

### Still outstanding (explicitly the user's own item, not done by me)

The user said "I'll do the second" back when I listed three fix candidates. Item #2 was:
- `docs/WHALE.md` doesn't exist yet, but the README's `npx hardhat ticket:whale ...` command
  promises it (task code + test already exist and pass — just needs a real run committed).
- README's closing line points at `../../specs/ticket/spec.md`, which doesn't exist anywhere on
  disk — dangling reference, either repoint it at `PRD.md` or find/restore the real file.

Unknown whether the user has done this yet — check before assuming.

## Frontend / design research (Wishlabs clone project)

**Goal stated by the user**: replace `app/`'s current generic template clone with an *exact*
structural/motion replica of `https://www.wishlabs.ai/`'s design system and animation, remapped to
Ticket's own content — done with real rigor, not a vague/generic reproduction. After nailing this
one page, the plan is to roll the same system out across the other pages in `app/`.

**Tooling note**: the user declined the `claude-in-chrome` browser extension this session —
**do not offer it again** (that instruction persists; if a new chat re-offers it, that's a fresh
context and fine, but this file is flagging it so you don't reflexively re-suggest it if this
context gets summarized forward). Research was done via `WebFetch` (lossy — flattens to markdown,
misses all motion/scroll mechanics) plus raw `curl` of the page source grepped for CSS custom
properties, inline styles, and `data-framer-*` attributes, plus a full-page screenshot the user
supplied directly (`~/Downloads/wishlabs.png`, 1704×16384) which was cropped locally with a
throwaway Python venv (`pip install Pillow`; `sips` on macOS turned out to crop from image center
by default, not top-left, which cost real time before switching to Pillow).

### Confirmed technical facts about wishlabs.ai

- Built on **Framer** (the site builder) — confirmed via `framerusercontent.com` asset hosts and
  `--framer-*` / `data-framer-*` markup. Its animation system is Framer's built-in scroll/hover
  motion engine, which is the same underlying model as the `framer-motion` npm package — so the
  right move for a Next.js rebuild is to use real `framer-motion`, not to reverse-engineer
  Framer's compiled runtime.
- **Color system** (exact hex values pulled from CSS custom properties): warm off-white background
  `#faf7f0` (not pure white); text in `#121212`/`#171717`/`#2b2b2b` (never pure black); brand
  violet `#4a3a82`/`#271c40` paired with lighter lavender `#d3c2ff` and soft blue `#94c4ff`; a
  signature blue→violet→pink "aurora" gradient family (`#112f72 → #6e8bf3 → #e891e3 → #6b50cf`)
  used behind hero/illustration art; scattered accent colors (pink `#fec2df`/`#ff81b2`, lime
  `#c0ff73`) used sparingly elsewhere on the page.
- **The glow/aura technique**: a tiny element with a massive blurred `box-shadow` spread
  (`box-shadow: 0 0 26px 155px <color>`) fakes a soft gradient orb without an image — worth
  reusing.
- **Corners**: aggressively rounded everywhere — `24px`/`46px` on cards, `999px`/`50%` on pills and
  avatar-style images. Nothing sharp.
- **Type**: DM Sans + Lato loaded, Inter as Framer's fallback. Headlines carry tight negative
  letter-spacing (`-0.04em` to `-0.06em` on the largest text) — that tightness is a big part of why
  the headlines read as dense/confident rather than default-browser-ish. Font weights span
  400→900.
- **Hover motion**: fast and simple — `opacity`/`color` transitions at `0.2s ease` on links; one
  bouncier `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (an overshoot/back-out easing) almost
  certainly on buttons, giving a slight springy "pop."
- **Scroll reveals**: 19 separate elements carry `data-framer-appear-id` — Framer's built-in
  "fade/slide up as it enters the viewport" pattern, applied section by section down the whole
  page, not just once at the top.

### The hero, precisely (this is what the user specifically flagged I'd missed on the first pass)

Confirmed by cropping the user's full-page screenshot (`sips`/Pillow, top 1450px and the next
1450px band — do this again in a new chat if the screenshot needs re-inspecting; the raw file is
still at `~/Downloads/wishlabs.png`, and one cropped reference lives at
`/private/tmp/claude-501/-Users-mac/bbbbb2b7-2bce-4307-9453-689d8da21d47/scratchpad/hero_final.png`
and `hero_final2.png`, though scratchpad contents may not survive into a new session — re-crop from
the Downloads original if needed):

The mountain/fog illustration is **one continuous tall art piece**, not a single static hero image,
and it carries two separate text beats before handing off to a flat cream section:

1. **First screen**: nav (small logo mark top-left, hamburger top-right, both white) sits over a
   blue→violet→pink gradient sky behind a misty mountain ridge with a small factory-like structure
   perched on the peak, poking through cloud/fog. A small "Welcome to" label sits above a **massive
   lowercase wordmark** sized so large that the illustration's foreground object (the factory
   shape) visually sits *inside* the wordmark's letterforms — the letters and the illustration are
   composed together, not stacked as separate layers. Below the wordmark: a short two-line bold
   subheadline, then a row of small product/partner logo marks near the bottom of the screen.
2. **Continuing scroll**: the same mountain/fog art continues (darker, denser fog, tree
   silhouettes now visible), and this is where a **word-by-word scroll-reveal headline** lives,
   overlaid directly on the art, left-aligned. Each word starts dim/blurred/off-color and sharpens
   to full opacity/color as it's scrolled past — implemented via a `position: sticky` container
   with individually-animated `<span>`s per word (confirmed directly in the page's inline styles:
   each word span carries its own `opacity`/`filter: blur()`/`color`/`transition`).
3. **Hard cut to a flat cream section**: a stat headline, then a 3-column stat row with numbers and
   thin vertical divider lines between columns.

Layer-by-layer, the illustration is built from independently named/positioned pieces (confirmed via
`data-framer-name`: `gradient`, `cloud`, `factory`, `valley`, `mountain`), each carrying its own
`transform: perspective(1200px) translateY(...)` — different layers move at different rates as you
scroll, which is the actual parallax mechanic (farther layers move less per scroll pixel, nearer
layers move more; `perspective()` adds 3D falloff to the effect). Three sampled offsets were
found: `-20px`, `-80px`, `-148px` — enough to confirm the technique and relative depth ordering,
not enough to have the exact full scroll-to-transform curve nailed down pixel-for-pixel.

### Rest of the page structure (below the hero, in order)

Stat row → "It's a lab" section (label + headline + a couple of short punchy fragments) →
flagship-product spotlight (single product, before/after-style image, one CTA — this is the
"prove the thesis with one hero example" section) → 4-card product grid (icon, name, download
count, CTA link, each) → two-column capability split (each side: short headline + a 3-item bullet
list) → testimonial card carousel (5 real-feeling quotes, name + role each) → centered hiring CTA
→ multi-column footer (tagline, socials, company links, copyright).

### Content mapping proposed so far (discussed, not yet locked in or built)

| Wishlabs section | Proposed Ticket equivalent |
|---|---|
| Hero statement | Core one-line pitch: encrypted pool that still proves itself fair |
| Stat row | No loss · Private · Fair · Checkable (from the existing README table) |
| Flagship spotlight | **Verify Draw** — the one feature worth a dedicated spotlight; a "hidden balances / still verifiable" framing fits the before/after visual pattern |
| Product grid (4 cards) | Deposit / Time-weighted odds / On-chain draw / Withdraw anytime |
| Two-column capability split | "How the draw stays fair" / "What stays private" |
| Testimonials | Likely cut — no real users yet; open question, not decided |
| Hiring CTA | Replace with a "deposit → watch a draw → withdraw, under 3 minutes" CTA (matches the PRD's own success metric) |

### Open decision, not yet made

**What replaces the mountain/factory illustration and the "wishlabs" wordmark integration for
Ticket's own hero?** I was explicit with the user that pixel-copying Wishlabs' actual illustration
or logo glyphs would be copying their proprietary creative assets, not reusing a design pattern —
so Ticket needs its **own** illustration concept built on the same layered-parallax mechanism
(gradient/back layer/mid layer/fog-or-atmosphere/foreground object) and its **own** wordmark
treatment. Proposed a few directions to the user (a vault/lockbox catching light through fog, a
sealed ticket/token drifting over a similar misty landscape, an abstract encrypted-orb-over-terrain
scene) but **no decision was made before this handover** — that's the next open question to
resolve before any hero implementation starts.

### Implementation plan (agreed direction, not started)

Rebuild in the existing Next.js app (`app/`) using real `framer-motion` (`whileInView` +
`initial`/`animate` variants for scroll reveals, spring/overshoot transitions for hover) rather
than trying to replicate Framer's compiled runtime. Plain CSS/Tailwind reproduces the visual
language (colors, radii, type scale) with no Framer-specific dependency needed. After the hero (and
presumably the rest of this one landing page) is right, the stated next step is porting the same
system to the other pages already scaffolded in `app/src/app/` (`contact-us`, `privacy-policy`,
`terms-of-service`, plus whatever the actual product screens end up being — deposit/withdraw/draw/
Verify Draw, which per the earlier project audit **do not exist yet at all** in the codebase).

## Suggested first moves in the new chat

1. Confirm current git status / whether the user has landed the docs cleanup (item #2).
2. Get a decision on the hero illustration/wordmark concept before writing any component code.
3. Decide whether testimonials get cut entirely or replaced with something else.
4. Only after 2–3: start scaffolding the hero section in `app/`, matching the mechanics above with
   Ticket's own content and art direction.
5. Keep the deadline (2026-09-05 23:59 AOE) visibly in view — as of this handover there is no
   product UI at all yet (deposit/withdraw/draw/Verify Draw), which is the dominant remaining risk
   to the submission, bigger than landing-page polish. Worth explicitly checking with the user
   whether landing-page fidelity or the functional product screens should get the remaining time
   first, if that hasn't already been decided.
