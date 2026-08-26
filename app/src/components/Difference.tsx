import React from "react";
import { SectionHeader } from "./SectionHeader";
import { X, Check, ArrowRight, Sparkles, Zap, Flame, Clock } from "lucide-react";

export const Difference = () => {
  return (
    <section id="difference" className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      {/* 4 Corner Crosses */}
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="the difference"
          title={
            <>
              Where content friction <br className="hidden sm:inline" />
              ends, clarity begins
            </>
          }
          description="See how AI replaces slow, manual writing with fast, structured content creation."
        />

        {/* 3 Column Grid Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1: Problem */}
          <div className="verseo-card verseo-card-hover p-8 flex flex-col justify-between relative bg-white">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-10 h-10 rounded-2xl bg-[#ec6b5e]/10 text-[#ec6b5e] flex items-center justify-center font-bold">
                  <X className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono-custom text-[#ec6b5e] bg-[#ec6b5e]/10 px-2.5 py-1 rounded-full font-medium">
                  Problem 01
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#181818] mb-3">
                Fragmented writing
              </h3>
              <p className="text-sm text-[#686868] mb-6">
                Disorganized thoughts lead to weak copy and hours lost staring at an empty cursor.
              </p>

              <ul className="space-y-3.5">
                {[
                  "Ideas don’t translate into clear content",
                  "Constantly starting from a blank page",
                  "No clear structure or direction",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#505050]">
                    <div className="w-4 h-4 rounded-full bg-[#ededed] text-[#858585] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-2.5 h-2.5" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>Result: Low output</span>
              <span className="font-mono-custom">~3-5 hrs / draft</span>
            </div>
          </div>

          {/* Card 2: Problem */}
          <div className="verseo-card verseo-card-hover p-8 flex flex-col justify-between relative bg-white">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="w-10 h-10 rounded-2xl bg-[#ffcc40]/15 text-[#d97706] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono-custom text-[#d97706] bg-[#ffcc40]/15 px-2.5 py-1 rounded-full font-medium">
                  Problem 02
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#181818] mb-3">
                Manual workflows
              </h3>
              <p className="text-sm text-[#686868] mb-6">
                Repetitive drafting cycles cause communication delays and erratic brand perception.
              </p>

              <ul className="space-y-3.5">
                {[
                  "Writing takes too much time",
                  "Endless editing and rewriting",
                  "Inconsistent tone across channels",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#505050]">
                    <div className="w-4 h-4 rounded-full bg-[#ededed] text-[#858585] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-2.5 h-2.5" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>Result: Team friction</span>
              <span className="font-mono-custom">Inconsistent voice</span>
            </div>
          </div>

          {/* Card 3: The Solution (Highlighted Hero) */}
          <div className="verseo-card verseo-card-hover p-8 flex flex-col justify-between relative bg-[#181818] text-white shadow-xl border-[#2b2b2b] overflow-hidden group">
            {/* Ambient subtle glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#76e5fc]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#aeabff]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <span className="w-10 h-10 rounded-2xl bg-white/10 text-[#76e5fc] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono-custom text-[#76e5fc] bg-[#76e5fc]/15 px-3 py-1 rounded-full font-medium border border-[#76e5fc]/30">
                  Verseo Flow
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">
                AI-powered content flow
              </h3>
              <p className="text-sm text-[#a0a0a0] mb-6">
                Turn thoughts into structured, engaging, brand-aligned copy ready in seconds.
              </p>

              <ul className="space-y-3.5">
                {[
                  "Generate structured content in seconds",
                  "Keep your voice consistent everywhere",
                  "Refine, edit, and scale effortlessly",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#e0e0e0]">
                    <div className="w-4 h-4 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#a0a0a0]">
              <span className="text-[#76e5fc] font-medium">10x Speed & Precision</span>
              <span className="font-mono-custom text-white">~3 seconds ✓</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
