import React from "react";
import { SectionHeader } from "./SectionHeader";
import { X, Check, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export const Difference = () => {
  return (
    <section id="fairness" className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      {/* 4 Corner Crosses */}
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="the problem"
          title={
            <>
              Encrypting a prize pool <br className="hidden sm:inline" />
              breaks it in silence
            </>
          }
          description="Every on-chain prize pool added three anti-abuse mechanisms after being gamed. All three read balances in the clear."
        />

        {/* 3 Column Grid Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1: Public pools */}
          <div className="verseo-card verseo-card-hover p-8 flex flex-col justify-between relative bg-white">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-10 h-10 rounded-2xl bg-[#ec6b5e]/10 text-[#ec6b5e] flex items-center justify-center font-bold">
                  <X className="w-5 h-5" weight="bold" />
                </span>
                <span className="text-xs font-mono-custom text-[#ec6b5e] bg-[#ec6b5e]/10 px-2.5 py-1 rounded-full font-medium">
                  Case 01
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#181818] mb-3">
                A public prize pool
              </h3>
              <p className="text-sm text-[#686868] mb-6">
                Odds by time-weighted balance, an exit penalty, and a per-address cap all work — because
                everyone's balance is legible to everyone, forever.
              </p>

              <ul className="space-y-3.5">
                {[
                  "Fair, and provably so",
                  "Every depositor's balance is public",
                  "Deposit timing and win size are public too",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#505050]">
                    <div className="w-4 h-4 rounded-full bg-[#ededed] text-[#858585] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-2.5 h-2.5" weight="bold" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>Result: fair, not private</span>
              <span className="font-mono-custom">balances in clear</span>
            </div>
          </div>

          {/* Card 2: Naive encryption */}
          <div className="verseo-card verseo-card-hover p-8 flex flex-col justify-between relative bg-white">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-10 h-10 rounded-2xl bg-[#ffcc40]/15 text-[#d97706] flex items-center justify-center font-bold">
                  <X className="w-5 h-5" weight="bold" />
                </span>
                <span className="text-xs font-mono-custom text-[#d97706] bg-[#ffcc40]/15 px-2.5 py-1 rounded-full font-medium">
                  Case 02
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#181818] mb-3">
                Encryption, sprinkled on
              </h3>
              <p className="text-sm text-[#686868] mb-6">
                Encrypt the balances and all three mechanisms stop working at once — with no error,
                no warning.
              </p>

              <ul className="space-y-3.5">
                {[
                  "A whale can deposit right before a draw",
                  "Win, withdraw, and leave no visible trace",
                  "No observer can even show it happened",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#505050]">
                    <div className="w-4 h-4 rounded-full bg-[#ededed] text-[#858585] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-2.5 h-2.5" weight="bold" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>Result: private, not fair</span>
              <span className="font-mono-custom">gameable, invisibly</span>
            </div>
          </div>

          {/* Card 3: Ticket */}
          <div className="verseo-card verseo-card-hover p-8 flex flex-col justify-between relative bg-[#181818] text-white shadow-xl border-[#2b2b2b] overflow-hidden group">
            {/* Ambient subtle glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#748CEB]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#76e5fc]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <span className="w-10 h-10 rounded-2xl bg-white/10 text-[#76e5fc] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" weight="fill" />
                </span>
                <span className="text-xs font-mono-custom text-[#76e5fc] bg-[#76e5fc]/15 px-3 py-1 rounded-full font-medium border border-[#76e5fc]/30">
                  Ticket
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">
                Fairness rebuilt inside the encryption
              </h3>
              <p className="text-sm text-[#a0a0a0] mb-6">
                An encrypted time-weighted balance replaces the mechanism that broke — decrypted by
                nobody, ever.
              </p>

              <ul className="space-y-3.5">
                {[
                  "Odds by time held, computed on encrypted state",
                  "One value made public per draw: the winner",
                  "Every claim independently verifiable, on demand",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#e0e0e0]">
                    <div className="w-4 h-4 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3" weight="bold" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#a0a0a0]">
              <span className="text-[#76e5fc] font-medium">Fair and private</span>
              <span className="font-mono-custom text-white">Both, at once ✓</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
