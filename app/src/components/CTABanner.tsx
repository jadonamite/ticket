import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";

export const CTABanner = () => {
  return (
    <section className="framed-section py-24 md:py-32 bg-[#181818] text-white relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#006fff]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#76e5fc]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="framed-container px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Framer style badge */}
          <div className="badge-pill mb-6 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white shadow-xs">
            <span className="text-[#76e5fc]">[</span>
            <span className="text-white font-medium tracking-wide">ready to start?</span>
            <span className="text-[#76e5fc]">]</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.12] mb-6">
            Start creating better <br className="hidden sm:inline" />
            content today
          </h2>

          <p className="text-base sm:text-lg text-[#a0a0a0] max-w-2xl font-normal leading-relaxed mb-10">
            Turn ideas into polished content in seconds. Generate, refine, and publish faster with AI-powered workflows designed for modern teams.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              href="#pricing"
              className="bg-white text-[#181818] hover:bg-[#ededed] font-semibold text-sm px-8 py-3.5 rounded-full transition-all duration-200 flex items-center gap-2 shadow-lg hover:scale-105"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact-us"
              className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm px-8 py-3.5 rounded-full transition-all duration-200 flex items-center gap-2"
            >
              <span>Try Demo</span>
              <Sparkles className="w-4 h-4 text-[#76e5fc]" />
            </Link>
          </div>

          {/* Terminal / Code Box Demonstration */}
          <div className="w-full max-w-lg rounded-2xl bg-[#0b0d14] border border-white/15 p-6 text-left shadow-2xl font-mono-custom text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[#686868]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ec6b5e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffcc40]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#a2e198]" />
                <span className="ml-2 text-[11px] text-[#858585]">verseo_engine.sh</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-[#858585]" />
            </div>

            <div className="space-y-1.5 leading-relaxed">
              <p className="text-[#858585]">content_request:</p>
              <p className="text-[#76e5fc]">&gt; Create a high-converting landing page</p>
              <p className="text-[#858585] pt-2">processing…</p>
              <p className="text-[#aeabff]">→ analyzing audience</p>
              <p className="text-[#aeabff]">→ structuring content</p>
              <p className="text-[#aeabff]">→ optimizing messaging</p>
              <p className="text-[#858585] pt-2">output:</p>
              <p className="text-[#a2e198]">+ compelling headline</p>
              <p className="text-[#a2e198]">+ clear value proposition</p>
              <p className="text-[#a2e198]">+ conversion-focused copy</p>
              <p className="text-[#10b981] font-bold pt-2">status: ready to publish ✓</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
