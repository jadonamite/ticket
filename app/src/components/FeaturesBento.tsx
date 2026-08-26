"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SectionHeader } from "./SectionHeader";
import { Sparkles, RefreshCw, Sliders, Check, Wand2, Zap, ArrowRight } from "lucide-react";

export const FeaturesBento = () => {
  const [rewriteApplied, setRewriteApplied] = useState(false);
  const [selectedTone, setSelectedTone] = useState("Direct");

  return (
    <section id="features" className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="features"
          title={
            <>
              Everything you need <br className="hidden sm:inline" />
              to create better content
            </>
          }
          description="Create, refine, and scale content - faster and without starting from scratch."
        />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto">
          {/* Bento Item 1: Smart Rewrite (Large Left Column) */}
          <div className="md:col-span-7 verseo-card verseo-card-hover p-8 flex flex-col justify-between bg-white relative overflow-hidden">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#006fff]/10 text-[#006fff] flex items-center justify-center font-bold mb-6">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-[#181818] mb-2">Smart Rewrite</h3>
              <p className="text-sm text-[#686868] mb-6">
                Improve clarity, structure, and tone instantly without rewriting from scratch. Fix and refine in one click.
              </p>

              {/* Interactive Rewrite Preview Box */}
              <div className="rounded-2xl bg-[#f6f6f6] border border-[#ededed] p-5 mb-4">
                <div className="flex items-center justify-between text-xs text-[#858585] mb-3 pb-2 border-b border-[#ededed]">
                  <span>Before vs After</span>
                  <button
                    onClick={() => setRewriteApplied(!rewriteApplied)}
                    className="btn-primary text-[11px] py-1 px-3"
                  >
                    {rewriteApplied ? "Reset Original" : "Apply 1-Click Polish"}
                  </button>
                </div>

                {!rewriteApplied ? (
                  <div className="text-sm text-[#686868] space-y-2">
                    <p className="line-through opacity-70">
                      "We are making a tool that does AI writing for anyone who wants to write faster emails and posts."
                    </p>
                    <p className="text-xs text-[#ec6b5e] font-mono-custom">
                      Feedback: Weak verbs, generic hook, lacking value proposition.
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-[#181818] font-medium space-y-2 animate-in fade-in duration-300">
                    <p className="bg-[#10b981]/10 text-[#047857] p-2.5 rounded-xl border border-[#10b981]/20">
                      "Verseo empowers modern teams to produce punchy, conversion-driven copy across emails and socials in seconds."
                    </p>
                    <p className="text-xs text-[#10b981] font-mono-custom flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Clarity +48% · Engagement +65%
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>Fix and refine in one click</span>
              <span className="font-mono-custom text-[#006fff]">Active Engine</span>
            </div>
          </div>

          {/* Bento Item 2: AI Writing (Right Column) */}
          <div className="md:col-span-5 verseo-card verseo-card-hover p-8 flex flex-col justify-between bg-white relative overflow-hidden">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#ec6b5e]/10 text-[#ec6b5e] flex items-center justify-center font-bold mb-6">
                <Wand2 className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-[#181818] mb-2">AI Writing</h3>
              <p className="text-sm text-[#686868] mb-6">
                Start from a simple idea and turn it into structured, high-quality content in seconds. No more blank pages.
              </p>

              {/* Graphic container */}
              <div className="relative w-full h-44 rounded-2xl bg-[#f6f6f6] border border-[#ededed] overflow-hidden">
                <Image
                  src="/assets/m3aswBY1UUBkd3vPtSwGvdxjNsg.png"
                  alt="AI writing workflow interface"
                  fill
                  className="object-cover object-top hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>Instant Drafts</span>
              <span className="font-mono-custom text-[#ec6b5e]">Zero Writer's Block</span>
            </div>
          </div>

          {/* Bento Item 3: Tone Control (Left Column 5) */}
          <div className="md:col-span-5 verseo-card verseo-card-hover p-8 flex flex-col justify-between bg-white relative overflow-hidden">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#ffcc40]/20 text-[#b45309] flex items-center justify-center font-bold mb-6">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-[#181818] mb-2">Tone Control</h3>
              <p className="text-sm text-[#686868] mb-6">
                Keep your voice consistent across every channel — from emails to social posts. Write like your brand, every time.
              </p>

              {/* Tone Badges Selector */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { name: "Direct", desc: "No fluff, high impact" },
                  { name: "Persuasive", desc: "Built for conversion" },
                  { name: "Friendly", desc: "Warm and inviting" },
                  { name: "Executive", desc: "Authoritative & crisp" },
                ].map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTone(t.name)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      selectedTone === t.name
                        ? "bg-[#181818] text-white border-[#181818] shadow-sm"
                        : "bg-[#f6f6f6] text-[#686868] border-[#ededed] hover:border-[#dbdce0]"
                    }`}
                  >
                    <div className="text-xs font-bold">{t.name}</div>
                    <div className="text-[10px] opacity-75">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>Active Tone: <strong className="text-[#181818]">{selectedTone}</strong></span>
              <span className="font-mono-custom">Omnichannel</span>
            </div>
          </div>

          {/* Bento Item 4: Content Automation Workspace (Right Column 7) */}
          <div className="md:col-span-7 verseo-card verseo-card-hover p-8 flex flex-col justify-between bg-white relative overflow-hidden">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#a2e198]/25 text-[#15803d] flex items-center justify-center font-bold mb-6">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-[#181818] mb-2">Automated Content Pipeline</h3>
              <p className="text-sm text-[#686868] mb-6">
                Generate, refine, and organize campaign assets in a single consolidated workspace with built-in export presets.
              </p>

              {/* Graphic container */}
              <div className="relative w-full h-44 rounded-2xl bg-[#f6f6f6] border border-[#ededed] overflow-hidden">
                <Image
                  src="/assets/iMm875MSCvJtmlENPQwNDe1KjyE.png"
                  alt="Content automation dashboard"
                  fill
                  className="object-cover object-top hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
              <span>Export to Notion, Webflow, Markdown</span>
              <span className="font-mono-custom text-[#15803d]">Instant Sync ✓</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
