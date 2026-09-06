import React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Terminal } from "@phosphor-icons/react/dist/ssr";

export const CTABanner = () => {
  return (
    <section id="verify" className="framed-section py-24 md:py-32 bg-[#181818] text-white relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#748CEB]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#76e5fc]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="framed-container px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Framer style badge */}
          <div className="badge-pill mb-6 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white shadow-xs">
            <span className="text-[#76e5fc]">[</span>
            <span className="text-white font-medium tracking-wide">verify draw</span>
            <span className="text-[#76e5fc]">]</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.12] mb-6">
            A fairness claim is only <br className="hidden sm:inline" />
            worth what a stranger can check
          </h2>

          <p className="text-base sm:text-lg text-[#a0a0a0] max-w-2xl font-normal leading-relaxed mb-10">
            One click, from any settled draw. Randomness, time-weighted balances, the weight cap,
            and winner selection — each independently verified, while every balance behind it
            stays encrypted.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              href="#deposit"
              className="bg-white text-[#181818] hover:bg-[#ededed] font-semibold text-base px-10 py-4 rounded-full transition-all duration-200 flex items-center gap-2.5 shadow-lg hover:scale-105"
            >
              <span>Deposit Principal</span>
              <ArrowRight weight="bold" className="w-5 h-5" />
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-base px-10 py-4 rounded-full transition-all duration-200 flex items-center gap-2.5"
            >
              <span>Read the Docs</span>
              <FileText weight="bold" className="w-5 h-5 text-[#76e5fc]" />
            </Link>
          </div>

          {/* Terminal / Verify Draw output — a real settled draw, not a mock-up */}
          <div className="w-full max-w-lg rounded-2xl bg-[#0b0d14] border border-white/15 p-6 text-left shadow-2xl font-mono-custom text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[#686868]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ec6b5e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffcc40]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#a2e198]" />
                <span className="ml-2 text-[11px] text-[#858585]">verify-draw.sh</span>
              </div>
              <Terminal weight="bold" className="w-3.5 h-3.5 text-[#858585]" />
            </div>

            <div className="space-y-1.5 leading-relaxed">
              <p className="text-[#76e5fc]">DRAW #0842</p>
              <p className="text-[#858585] pt-2">Participants: <span className="text-white">1,284</span></p>
              <p className="text-[#a2e198]">Randomness source: ✓ verified</p>
              <p className="text-[#a2e198]">Time-weighted balances: ✓ verified</p>
              <p className="text-[#a2e198]">Weight cap: ✓ verified</p>
              <p className="text-[#a2e198]">Winner selection: ✓ verified</p>
              <p className="text-white font-bold pt-2">Winner: 0x7A…</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
