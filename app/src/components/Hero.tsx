"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import {
  LockKey,
  TrendUp,
  ShieldCheck,
  FileText,
  Eye,
  CheckCircle,
  CaretDown,
  ArrowRight,
} from "@phosphor-icons/react";
import { TicketLogo } from "@/components/TicketLogo";

// Word component for Wishlabs-style word-by-word blur-to-sharp scroll reveal
const ScrollWord = ({
  word,
  progress,
  range,
}: {
  word: string;
  progress: any;
  range: [number, number];
}) => {
  const opacity = useTransform(progress, [range[0], range[1]], [0.18, 1]);
  const blur = useTransform(progress, [range[0], range[1]], [6, 0]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  return (
    <motion.span
      style={{ opacity, filter }}
      className="inline-block mr-[0.25em] transition-colors duration-150 will-change-[opacity,filter]"
    >
      {word}
    </motion.span>
  );
};

export const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    damping: 32,
    stiffness: 120,
    mass: 0.5,
  });

  // --- BACKGROUND PARALLAX & SKY DEPTH ---
  const landscapeY = useTransform(smoothProgress, [0, 1], ["0%", "-35%"]);
  const landscapeScale = useTransform(smoothProgress, [0, 1], [1.02, 1.12]);

  // --- SCREEN 0: LOGO LOCKUP ALONE, DEAD CENTER (0% - 10%) ---
  // Mirrors the Wishlabs pattern: the wordmark owns the first screen by itself,
  // nothing else competes with it for attention.
  const wordmarkOpacity = useTransform(smoothProgress, [0, 0.05, 0.1], [1, 1, 0]);
  const wordmarkY = useTransform(smoothProgress, [0, 0.14], ["0%", "-12%"]);
  const logoOpacity = wordmarkOpacity;
  const logoY = wordmarkY;

  // Bottom CTA / trust-strip row lives on the same screen as the logo
  const ctaRowOpacity = useTransform(smoothProgress, [0, 0.05, 0.09], [1, 1, 0]);
  const ctaRowY = useTransform(smoothProgress, [0, 0.1], ["0px", "-16px"]);

  // --- SCREEN 1: HEADLINE TAKES OVER THE LANDSCAPE, BOTTOM-ANCHORED (4% - 20%) ---
  // Only starts appearing once the logo has begun clearing out, so the two
  // never fight for the same space.
  const heroTextOpacity = useTransform(smoothProgress, [0.04, 0.09, 0.16, 0.2], [0, 1, 1, 0]);
  const heroTextY = useTransform(smoothProgress, [0.04, 0.09, 0.16, 0.2], [40, 0, 0, -30]);

  const headlineWords = [
    "A", "prize", "pool", "that", "cannot", "see", "your", "money", "and",
    "still", "cannot", "be", "gamed.",
  ];

  // --- WRITING ON TICKET: DOES NOT SHOW TILL SCROLL STARTS ---
  // Opacity is strictly 0 at rest (scroll = 0) and illuminates on scroll
  const ticketWritingOpacity = useTransform(
    smoothProgress,
    [0, 0.04, 0.14],
    [0, 0.3, 1]
  );

  // --- SCREEN 2: WISHLABS STICKY WORD-BY-WORD SCROLL REVEAL (18% - 36%) ---
  const wordRevealOpacity = useTransform(smoothProgress, [0.16, 0.22, 0.32, 0.38], [0, 1, 1, 0]);
  const wordRevealY = useTransform(smoothProgress, [0.16, 0.22, 0.32, 0.38], [40, 0, 0, -40]);

  const revealWords = [
    "Encrypting",
    "balances",
    "doesn't",
    "just",
    "hide",
    "the",
    "money.",
    "It",
    "deletes",
    "every",
    "mechanism",
    "that",
    "made",
    "the",
    "game",
    "fair.",
    "Ticket",
    "rebuilds",
    "the",
    "fairness",
    "inside",
    "the",
    "encryption.",
  ];

  // --- SCREEN 3: BLUEPRINT ROTATION TO -90deg & LEFT DOCK (36% - 84%) ---
  // 3D Isometric Floating Perspective at rest -> un-tilts as scroll begins
  const ticketTiltX = useTransform(smoothProgress, [0, 0.16], ["7deg", "0deg"]);
  const ticketTiltY = useTransform(smoothProgress, [0, 0.16], ["-10deg", "0deg"]);
  const ticketRotate = useTransform(
    smoothProgress,
    [0, 0.16, 0.34],
    ["1.5deg", "0deg", "-90deg"]
  );

  const ticketX = useTransform(
    smoothProgress,
    [0, 0.16, 0.34, 0.82, 0.9],
    ["0%", "0%", "-58%", "-58%", "-68%"]
  );

  const ticketY = useTransform(
    smoothProgress,
    [0, 0.16, 0.34],
    ["4%", "4%", "0%"]
  );

  const ticketScale = useTransform(
    smoothProgress,
    [0, 0.16, 0.34, 0.86, 0.94],
    [1.0, 1.0, 0.82, 0.82, 0.72]
  );

  // The ticket is big in the center of the hero at rest, then stays visible until handoff
  const ticketOpacity = useTransform(smoothProgress, [0, 0.88, 0.95], [1, 1, 0]);

  // Right-hand callout card opacities (continuous sequence across docked scroll phase)
  const card1Opacity = useTransform(smoothProgress, [0.36, 0.40, 0.47, 0.51], [0, 1, 1, 0]);
  const card1Y = useTransform(smoothProgress, [0.36, 0.40, 0.47, 0.51], [25, 0, 0, -25]);

  const card2Opacity = useTransform(smoothProgress, [0.49, 0.53, 0.60, 0.64], [0, 1, 1, 0]);
  const card2Y = useTransform(smoothProgress, [0.49, 0.53, 0.60, 0.64], [25, 0, 0, -25]);

  const card3Opacity = useTransform(smoothProgress, [0.62, 0.66, 0.73, 0.77], [0, 1, 1, 0]);
  const card3Y = useTransform(smoothProgress, [0.62, 0.66, 0.73, 0.77], [25, 0, 0, -25]);

  const card4Opacity = useTransform(smoothProgress, [0.75, 0.79, 0.86, 0.90], [0, 1, 1, 0]);
  const card4Y = useTransform(smoothProgress, [0.75, 0.79, 0.86, 0.90], [25, 0, 0, -25]);

  // Blueprint Callout Markers & Arrows
  const marker1Glow = useTransform(smoothProgress, [0.36, 0.40, 0.47, 0.51], [0, 1, 1, 0]);
  const marker2Glow = useTransform(smoothProgress, [0.49, 0.53, 0.60, 0.64], [0, 1, 1, 0]);
  const marker3Glow = useTransform(smoothProgress, [0.62, 0.66, 0.73, 0.77], [0, 1, 1, 0]);
  const marker4Glow = useTransform(smoothProgress, [0.75, 0.79, 0.86, 0.90], [0, 1, 1, 0]);

  return (
    <div ref={containerRef} className="relative bg-[#0d091a] text-white font-sans">
      {/* ========================================================================= */}
      {/* PINNED SCROLLYTELLING VIEWPORT (480vh container) */}
      {/* ========================================================================= */}
      <div className="relative h-[480vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-between py-6 px-4 md:px-8">
          
          {/* LAYER 1: WISHLABS ETHEREAL LANDSCAPE ART PIECE (TALL PARALLAX) */}
          <motion.div
            style={{ y: landscapeY, scale: landscapeScale }}
            className="absolute inset-x-0 -top-24 h-[160vh] pointer-events-none z-0 will-change-transform"
          >
            <Image
              src="/images/ticket-landscape-hero.jpg"
              alt="Ethereal Mountain Landscape"
              fill
              priority
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1c1236]/25 to-[#0e0a1f]/80" />
          </motion.div>

          {/* LAYER 2: THE FULL "TICKET" WORDMARK, DEAD CENTER, HUGE — SCREEN 0 */}
          {/* The card (BEAT 3) sits low and slightly overlaps its bottom edge on purpose. */}
          <motion.div
            style={{ y: wordmarkY, opacity: wordmarkOpacity }}
            className="absolute inset-x-0 top-[4%] sm:top-[6%] flex justify-center pointer-events-none z-[2] select-none"
          >
            <TicketLogo
              size="hero"
              theme="dark"
              markClassName="drop-shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
              textClassName="drop-shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
            />
          </motion.div>

          {/* ======================================================================= */}
          {/* BEAT 1: HEADLINE TAKES THE LANDSCAPE, BOTTOM-ANCHORED WORD REVEAL   */}
          {/* (Wishlabs "We build the tools..." caption pattern)                  */}
          {/* ======================================================================= */}
          <motion.div
            style={{ opacity: heroTextOpacity, y: heroTextY }}
            className="absolute right-6 md:right-16 bottom-[16%] md:bottom-[18%] z-30 max-w-[220px] sm:max-w-xs text-right pointer-events-none"
          >
            <h1 className="text-base sm:text-lg md:text-xl font-extrabold tracking-[-0.03em] text-white leading-[1.25] drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              {headlineWords.map((w, idx) => {
                const total = headlineWords.length;
                const start = 0.045 + (idx / total) * 0.11;
                const end = start + 0.02;
                return (
                  <ScrollWord key={idx} word={w} progress={smoothProgress} range={[start, end]} />
                );
              })}
            </h1>
          </motion.div>

          {/* ======================================================================= */}
          {/* BEAT 2: WISHLABS WORD-BY-WORD SCROLL REVEAL (IN THE MISTY VALLEY) */}
          {/* ======================================================================= */}
          <motion.div
            style={{ opacity: wordRevealOpacity, y: wordRevealY }}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto max-w-3xl px-8 text-center z-30 pointer-events-none"
          >
            <div className="text-xs font-mono text-[#fec2df] uppercase tracking-widest mb-4 font-bold drop-shadow">
              The Fairness Problem Under Encryption
            </div>
            <p className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-[-0.04em] leading-[1.25] drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              {revealWords.map((w, idx) => {
                const total = revealWords.length;
                const start = 0.17 + (idx / total) * 0.14;
                const end = start + 0.025;
                return (
                  <ScrollWord
                    key={idx}
                    word={w}
                    progress={smoothProgress}
                    range={[start, end]}
                  />
                );
              })}
            </p>
          </motion.div>

          {/* ======================================================================= */}
          {/* BEAT 3: THE ISOLATED TICKET (NO BACKGROUND BOX, ROTATES TO -90deg) */}
          {/* Card is bottom-anchored on its own; the zones row is vertically      */}
          {/* centered independently, so it never inherits the card's position.   */}
          {/* ======================================================================= */}
          <div className="relative w-full max-w-[1500px] flex-1 z-20 [perspective:1200px]">
            {/* DYNAMIC SVG HIGHLIGHTING CONNECTOR LINES (SYNCED TO ACTIVE ZONE) */}
            <svg className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible">
              <defs>
                <filter id="laserGlowWhite" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="laserGlowGold" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="laserGlowCyan" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="laserGlowGreen" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Zone 1 Line: Principal Invariant */}
              <motion.g style={{ opacity: card1Opacity }}>
                <path
                  d="M 485 535 L 620 535 L 720 425 L 940 425"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeDasharray="8 5"
                  filter="url(#laserGlowWhite)"
                />
                <circle cx="485" cy="535" r="4.5" fill="#ffffff" />
                <circle cx="485" cy="535" r="12" fill="#ffffff" className="animate-ping" opacity="0.4" />
                <circle cx="940" cy="425" r="4.5" fill="#ffffff" />
              </motion.g>

              {/* Zone 2 Line: Time-Weighted Integral */}
              <motion.g style={{ opacity: card2Opacity }}>
                <path
                  d="M 485 450 L 640 450 L 675 425 L 940 425"
                  fill="none"
                  stroke="#ffcc40"
                  strokeWidth="2.5"
                  strokeDasharray="8 5"
                  filter="url(#laserGlowGold)"
                />
                <circle cx="485" cy="450" r="4.5" fill="#ffcc40" />
                <circle cx="485" cy="450" r="12" fill="#ffcc40" className="animate-ping" opacity="0.4" />
                <circle cx="940" cy="425" r="4.5" fill="#ffcc40" />
              </motion.g>

              {/* Zone 3 Line: FHEVM Confidentiality */}
              <motion.g style={{ opacity: card3Opacity }}>
                <path
                  d="M 485 365 L 630 365 L 690 425 L 940 425"
                  fill="none"
                  stroke="#76e5fc"
                  strokeWidth="2.5"
                  strokeDasharray="8 5"
                  filter="url(#laserGlowCyan)"
                />
                <circle cx="485" cy="365" r="4.5" fill="#76e5fc" />
                <circle cx="485" cy="365" r="12" fill="#76e5fc" className="animate-ping" opacity="0.4" />
                <circle cx="940" cy="425" r="4.5" fill="#76e5fc" />
              </motion.g>

              {/* Zone 4 Line: Verification Seal */}
              <motion.g style={{ opacity: card4Opacity }}>
                <path
                  d="M 485 260 L 600 260 L 760 425 L 940 425"
                  fill="none"
                  stroke="#a2e198"
                  strokeWidth="2.5"
                  strokeDasharray="8 5"
                  filter="url(#laserGlowGreen)"
                />
                <circle cx="485" cy="260" r="4.5" fill="#a2e198" />
                <circle cx="485" cy="260" r="12" fill="#a2e198" className="animate-ping" opacity="0.4" />
                <circle cx="940" cy="425" r="4.5" fill="#a2e198" />
              </motion.g>
            </svg>

            <div className="absolute inset-x-0 bottom-[2%] md:bottom-[3%] flex justify-center [perspective:1200px]">
              <motion.div
                style={{
                  x: ticketX,
                  y: ticketY,
                  rotateX: ticketTiltX,
                  rotateY: ticketTiltY,
                  rotateZ: ticketRotate,
                  scale: ticketScale,
                  opacity: ticketOpacity,
                  transformStyle: "preserve-3d",
                }}
                className="relative w-full max-w-[680px] md:max-w-[760px] aspect-[1307/680] will-change-transform drop-shadow-[0_30px_70px_rgba(10,5,25,0.7)] select-none"
              >
                {/* 3D DIE-CUT INDUSTRIAL CHASSIS (#748CEB WITH SUNRISE RIM LIGHTING) */}
                <div className="relative w-full h-full">
                  <Image
                    src="/images/ticket-chassis-cutout.png"
                    alt="Ticket — Precision Industrial Hardware Voucher #748CEB"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 760px"
                    className="object-contain object-center"
                  />

                  {/* ATMOSPHERIC HORIZON RIM-LIGHT REFLECTION */}
                  <div className="absolute inset-0 rounded-[18px] pointer-events-none bg-gradient-to-b from-amber-200/20 via-transparent to-transparent mix-blend-screen" />

                  {/* VECTOR TYPOGRAPHY & PRECISION INVARIANT BAYS (ALWAYS PRESENT, POPS ON SCROLL) */}
                  <div className="absolute inset-0 flex pointer-events-none p-3.5 sm:p-5 md:p-6">
                    
                    {/* LEFT 67%: MAIN CHASSIS BODY */}
                    <div className="w-[67%] pr-3 sm:pr-5 flex flex-col justify-between text-left">
                      <div>
                        {/* Header bar: Brand mark + Voucher Series */}
                        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <TicketLogo size="sm" theme="dark" textClassName="text-sm sm:text-base font-bold tracking-tight text-white" />
                            <span className="text-[8px] sm:text-[10px] font-mono font-bold text-white/80 uppercase tracking-widest pl-1">
                              · CONFIDENTIAL BOND · #0042
                            </span>
                          </div>
                        </div>

                        {/* Pitch Headline */}
                        <h3 className="text-[10px] sm:text-xs md:text-[13px] font-extrabold text-white leading-tight tracking-tight mb-2 sm:mb-2.5 drop-shadow-sm">
                          Capital Protected. Odds Encrypted. Verifiably Fair.
                        </h3>

                        {/* 3 ARCHITECTURAL INVARIANT BAYS */}
                        <div className="space-y-1.5 sm:space-y-2">
                          
                          {/* BAY 01: 100% PRINCIPAL PROTECTED */}
                          <motion.div
                            style={{
                              borderColor: useTransform(marker1Glow, [0, 1], ["rgba(255,255,255,0.22)", "#ffffff"]),
                              boxShadow: useTransform(marker1Glow, [0, 1], ["0 2px 8px rgba(0,0,0,0.15)", "0 0 32px rgba(255, 255, 255, 0.95), inset 0 0 16px rgba(255,255,255,0.35)"]),
                              backgroundColor: useTransform(marker1Glow, [0, 1], ["rgba(15, 12, 28, 0.45)", "rgba(116, 140, 235, 0.35)"]),
                              scale: useTransform(marker1Glow, [0, 1], [1.0, 1.025]),
                            }}
                            className="border rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 backdrop-blur-xs transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] sm:text-[9px] font-mono font-bold bg-white text-[#181818] px-1.5 py-0.5 rounded shadow-sm">
                                  01
                                </span>
                                <span className="text-[9px] sm:text-xs font-bold text-white tracking-tight">
                                  100% PRINCIPAL PROTECTED
                                </span>
                              </div>
                              <ShieldCheck size={13} weight="fill" className="text-white" />
                            </div>
                            <p className="text-[8px] sm:text-[10px] text-white/80 leading-tight">
                              Instant unconditional withdrawal · Zero capital loss guarantee
                            </p>
                          </motion.div>

                          {/* BAY 02: ENCRYPTED ODDS INVARIANT */}
                          <motion.div
                            style={{
                              borderColor: useTransform(marker2Glow, [0, 1], ["rgba(255,255,255,0.22)", "#ffcc40"]),
                              boxShadow: useTransform(marker2Glow, [0, 1], ["0 2px 8px rgba(0,0,0,0.15)", "0 0 32px rgba(255, 204, 64, 0.95), inset 0 0 16px rgba(255,204,64,0.35)"]),
                              backgroundColor: useTransform(marker2Glow, [0, 1], ["rgba(15, 12, 28, 0.45)", "rgba(255, 204, 64, 0.28)"]),
                              scale: useTransform(marker2Glow, [0, 1], [1.0, 1.025]),
                            }}
                            className="border rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 backdrop-blur-xs transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] sm:text-[9px] font-mono font-bold bg-[#ffcc40] text-[#181818] px-1.5 py-0.5 rounded shadow-sm">
                                  02
                                </span>
                                <span className="text-[9px] sm:text-xs font-bold text-white tracking-tight">
                                  ENCRYPTED ODDS · <span className="font-mono text-[#ffcc40]">W = ∫ b(t) dt</span>
                                </span>
                              </div>
                              <TrendUp size={13} weight="bold" className="text-[#ffcc40]" />
                            </div>
                            <p className="text-[8px] sm:text-[10px] text-white/80 leading-tight">
                              Time-weighted accumulation · Late-whale sniping defeated
                            </p>
                          </motion.div>

                          {/* BAY 03: FHEVM CONFIDENTIALITY */}
                          <motion.div
                            style={{
                              borderColor: useTransform(marker3Glow, [0, 1], ["rgba(255,255,255,0.22)", "#76e5fc"]),
                              boxShadow: useTransform(marker3Glow, [0, 1], ["0 2px 8px rgba(0,0,0,0.15)", "0 0 32px rgba(118, 229, 252, 0.95), inset 0 0 16px rgba(118,229,252,0.35)"]),
                              backgroundColor: useTransform(marker3Glow, [0, 1], ["rgba(15, 12, 28, 0.45)", "rgba(118, 229, 252, 0.28)"]),
                              scale: useTransform(marker3Glow, [0, 1], [1.0, 1.025]),
                            }}
                            className="border rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 backdrop-blur-xs transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] sm:text-[9px] font-mono font-bold bg-[#76e5fc] text-[#181818] px-1.5 py-0.5 rounded shadow-sm">
                                  03
                                </span>
                                <span className="text-[9px] sm:text-xs font-bold text-white tracking-tight">
                                  FHEVM CONFIDENTIALITY · <span className="font-mono text-[#76e5fc]">euint64</span>
                                </span>
                              </div>
                              <LockKey size={13} weight="fill" className="text-[#76e5fc]" />
                            </div>
                            <p className="text-[8px] sm:text-[10px] text-white/80 leading-tight">
                              Encrypted state · 0 balances or deposit timings in the clear
                            </p>
                          </motion.div>
                        </div>
                      </div>

                      {/* Footer chassis markings */}
                      <div className="flex items-center justify-between text-[7px] sm:text-[8px] md:text-[9px] font-mono font-semibold text-white/70 pt-1 border-t border-white/15">
                        <span>SERIES 04 · SEPOLIA TESTNET</span>
                        <span>ZAMA FHEVM · CONTRACT 0x748C</span>
                      </div>
                    </div>

                    {/* RIGHT 33%: VERIFICATION STUB & SEAL */}
                    <div className="w-[33%] pl-3 sm:pl-5 flex flex-col justify-between text-center relative py-1">
                      <div>
                        <div className="text-[8px] sm:text-[10px] font-mono font-extrabold uppercase tracking-wider text-white">
                          VERIFICATION STUB
                        </div>
                        <div className="text-[7px] sm:text-[8px] font-mono text-white/70">
                          ID: TK-0042-FHE
                        </div>
                      </div>

                      {/* DYNAMIC GLOW RING FOR SEAL IN ZONE 4 */}
                      <motion.div
                        style={{
                          opacity: marker4Glow,
                          scale: useTransform(marker4Glow, [0, 1], [0.95, 1.08]),
                        }}
                        className="absolute right-[8%] sm:right-[11%] top-1/2 -translate-y-1/2 w-[92px] h-[92px] sm:w-[120px] sm:h-[120px] rounded-full border-2 border-[#a2e198] shadow-[0_0_40px_rgba(162,225,152,0.95),inset_0_0_20px_rgba(162,225,152,0.5)] pointer-events-none transition-all duration-300"
                      />

                      {/* Bottom stub audit status */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[6.5px] sm:text-[7.5px] font-mono text-white/60 tracking-wider select-none">
                          0x4012...8E82 // VRF
                        </span>
                        <div className="text-[7px] sm:text-[8px] md:text-[9px] font-mono font-bold text-white leading-tight bg-white/15 backdrop-blur-xs py-1 px-1.5 rounded border border-white/25">
                          4/4 Claims Independently Audited
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>

            {/* ===================================================================== */}
            {/* RIGHT-HAND SCROLLYTELLING DEEP DIVE CARDS (WISHLABS AESTHETIC) */}
            {/* ===================================================================== */}
            <div className="hidden lg:flex absolute right-6 xl:right-16 inset-y-0 items-center w-[420px] xl:w-[460px] pointer-events-none z-30">
              <div className="relative w-full h-[360px]">

                {/* STEP 1: Zero Principal Loss */}
                <motion.div
                  style={{ opacity: card1Opacity, y: card1Y }}
                  className="absolute inset-0 bg-[#171129]/95 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.6)] pointer-events-auto flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-[#748CEB]/20 border border-[#748CEB]/40 flex items-center justify-center text-[#748CEB]">
                        <LockKey size={22} weight="fill" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-widest text-[#748CEB] font-semibold block">
                          Zone 01 · Shielded Vault Core
                        </span>
                        <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                          Zero Principal Loss
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-white/80 leading-relaxed mb-6 font-sans">
                      Your deposit is not spent on a lottery ticket. Principal is held securely in
                      the contract, encrypted under FHEVM as an{" "}
                      <code className="text-xs bg-white/10 px-2 py-0.5 rounded text-[#748CEB] font-mono">
                        euint64
                      </code>{" "}
                      balance. It is never visible to other players, the operator, or the contract author.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <span className="text-white/40 block mb-1">Principal Status</span>
                      <span className="text-[#748CEB] font-semibold text-sm">100% Guaranteed</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <span className="text-white/40 block mb-1">Withdrawal Notice</span>
                      <span className="text-white font-semibold text-sm">Instant · No Lockup</span>
                    </div>
                  </div>
                </motion.div>

                {/* STEP 2: Time-Weighted Odds */}
                <motion.div
                  style={{ opacity: card2Opacity, y: card2Y }}
                  className="absolute inset-0 bg-[#171129]/95 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.6)] pointer-events-auto flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-[#ffcc40]/15 border border-[#ffcc40]/30 flex items-center justify-center text-[#ffcc40]">
                        <TrendUp size={22} weight="bold" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-widest text-[#ffcc40] font-semibold block">
                          Zone 02 · The Fairness Invariant
                        </span>
                        <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                          Time-Weighted Odds
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-white/80 leading-relaxed mb-6 font-sans">
                      Odds come from the running integral of your balance over time:{" "}
                      <code className="text-xs bg-white/10 px-2 py-0.5 rounded text-[#ffcc40] font-mono">
                        W = ∫ b(t) dt
                      </code>
                      . Holding for 90 days beats capital parked for 1 hour. Late whales who deposit
                      seconds before a draw win odds near zero—demonstrated live.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 text-xs font-mono space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/50">90-Day Saver (1 ETH):</span>
                      <span className="text-[#ffcc40] font-semibold">Weight: 90.0 ETH·d</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50">1-Hour Whale (100 ETH):</span>
                      <span className="text-white/80 font-semibold">Weight: 4.1 ETH·d</span>
                    </div>
                  </div>
                </motion.div>

                {/* STEP 3: Decrypt Exactly One Thing */}
                <motion.div
                  style={{ opacity: card3Opacity, y: card3Y }}
                  className="absolute inset-0 bg-[#171129]/95 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.6)] pointer-events-auto flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-[#76e5fc]/15 border border-[#76e5fc]/30 flex items-center justify-center text-[#76e5fc]">
                        <Eye size={22} weight="fill" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-widest text-[#76e5fc] font-semibold block">
                          Zone 03 · Public Draw Stub
                        </span>
                        <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                          Decrypt Exactly One Thing
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-white/80 leading-relaxed mb-6 font-sans">
                      The laser perforation separates private balances from the public tournament.
                      Public decryption is permanent on-chain—Ticket spends it deliberately: only the
                      single winning address is decrypted. Losing entries stay confidential forever.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <span className="text-white/40 block mb-1">Public Decryption</span>
                      <span className="text-[#76e5fc] font-semibold text-sm">Winner Only</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <span className="text-white/40 block mb-1">Balances Leaked</span>
                      <span className="text-[#748CEB] font-semibold text-sm">Zero (Never)</span>
                    </div>
                  </div>
                </motion.div>

                {/* STEP 4: Verify Draw */}
                <motion.div
                  style={{ opacity: card4Opacity, y: card4Y }}
                  className="absolute inset-0 bg-[#171129]/95 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.6)] pointer-events-auto flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-[#748CEB]/20 border border-[#748CEB]/40 flex items-center justify-center text-[#748CEB]">
                        <FileText size={22} weight="fill" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-widest text-[#748CEB] font-semibold block">
                          Zone 04 · Verify Draw Seal
                        </span>
                        <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                          4-Point Stranger Audit
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-white/80 leading-relaxed mb-4 font-sans">
                      A fairness claim is only worth what a stranger can check. In one click from any
                      settled draw, anyone can independently confirm execution, randomness, and the winner.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    {[
                      "Randomness source: ✓ verified",
                      "Time-weighted balances: ✓ verified",
                      "Per-address prize cap: ✓ verified",
                      "Winner selection tournament: ✓ verified",
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 text-white/90 text-[11px]"
                      >
                        <CheckCircle size={14} weight="fill" className="text-[#748CEB] shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SCREEN 0 - BOTTOM: CTAS & TRUST ROW (WISHLABS HERO FOOTER)          */}
          {/* Lives on the same screen as the giant logo, fades with it.         */}
          {/* ======================================================================= */}
          <motion.div
            style={{ opacity: ctaRowOpacity, y: ctaRowY }}
            className="relative z-30 pb-3 max-w-xl text-center flex flex-col items-center shrink-0"
          >
            <div className="flex flex-wrap items-center justify-center gap-3.5 mb-4">
              <Link
                href="#deposit"
                className="px-9 py-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-2 group font-sans"
              >
                <span>Deposit Principal</span>
                <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="#verify"
                className="px-8 py-4 rounded-full bg-white/15 hover:bg-white/25 text-white font-medium text-sm backdrop-blur-md border border-white/20 transition-all duration-200 flex items-center gap-2 font-sans"
              >
                <FileText size={18} weight="bold" className="text-[#748CEB]" />
                <span>Verify Draw</span>
              </Link>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-white/40">
              <CaretDown size={12} weight="bold" className="animate-bounce" />
              <span>SCROLL TO SEE HOW IT WORKS</span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 4: WISHLABS WARM CREAM SECTION HANDOFF (#faf7f0) */}
      {/* ========================================================================= */}
      <section className="relative z-30 bg-[#faf7f0] text-[#121212] pt-28 pb-32 px-6 sm:px-10 border-t border-[#e8e4dc]">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ede8dc] text-xs font-mono text-[#505050] mb-4 font-medium">
              <span>01 / THE FAIRNESS GUARANTEE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.05em] text-[#121212] leading-[1.06] font-sans mb-6">
              Only the real numbers here.
            </h2>
            <p className="text-lg text-[#555] leading-relaxed font-sans font-normal">
              Prize-linked savings isn't exotic — Britain has run it since 1956 as Premium Bonds:
              over £78B held for 22M people. Ticket brings that exact promise on-chain, fully private.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 border-y border-[#e2ded5] py-14">
            <div className="lg:pr-8 lg:border-r border-[#e2ded5]">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#121212] font-sans block mb-2">
                100%
              </span>
              <h4 className="text-base font-bold text-[#121212] mb-2 font-sans">
                Principal Protected
              </h4>
              <p className="text-sm text-[#666] leading-relaxed font-sans">
                Full principal back whenever you ask. No penalty, no notice period, zero loss ever.
              </p>
            </div>

            <div className="lg:px-8 lg:border-r border-[#e2ded5]">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#121212] font-sans block mb-2">
                0
              </span>
              <h4 className="text-base font-bold text-[#121212] mb-2 font-sans">
                Balances Anyone Can See
              </h4>
              <p className="text-sm text-[#666] leading-relaxed font-sans">
                Hidden from other players, hidden from us. Your balance is nobody's business but yours.
              </p>
            </div>

            <div className="lg:px-8 lg:border-r border-[#e2ded5]">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#121212] font-sans block mb-2">
                22M
              </span>
              <h4 className="text-base font-bold text-[#121212] mb-2 font-sans">
                People Already Trust This
              </h4>
              <p className="text-sm text-[#666] leading-relaxed font-sans">
                Britain's Premium Bonds have paid out this way since 1956. Ticket just brings it on-chain.
              </p>
            </div>

            <div className="lg:pl-8">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#121212] font-sans block mb-2">
                &lt; 3m
              </span>
              <h4 className="text-base font-bold text-[#121212] mb-2 font-sans">
                Start To Finish
              </h4>
              <p className="text-sm text-[#666] leading-relaxed font-sans">
                Deposit, wait for a draw, withdraw whenever you like. No paperwork, ever.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
