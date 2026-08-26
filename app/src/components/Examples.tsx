import React from "react";
import Image from "next/image";
import { SectionHeader } from "./SectionHeader";
import { Sparkles, ArrowRight, Check } from "lucide-react";

export const Examples = () => {
  const examples = [
    {
      title: "5 Ways AI Saves Time",
      badge: "Generated in 3 sec",
      tags: "Productivity | AI | Teams",
      description:
        "Learn how modern teams use AI to streamline content creation, improve consistency, and free up time for more meaningful work.",
      sampleOutput:
        "1. Instant First Drafts — Cut brainstorming from 2 hours to 30 seconds.\n2. Cross-Channel Repurposing — Turn one blog post into 10 social assets.\n3. Frictionless Proofreading — Eliminate tone inconsistencies automatically.\n4. Scaled A/B Testing — Test multiple value propositions simultaneously.\n5. Unified Brand Voice — Ensure every team member speaks the same language.",
    },
    {
      title: "Ready To Send",
      badge: "Ready to publish",
      tags: "Campaign | Marketing | Outreach",
      description:
        "Generate engaging emails with clear messaging, strong structure, and a tone that matches your brand in just a few seconds.",
      sampleOutput:
        "Subject: We just shipped something you asked for ⚡\n\nHey Alex,\n\nYou asked for faster workflows. Today, we're launching 1-Click Smart Rewrites.\n\nTake it for a spin and see how quickly your copy tightens up.\n\n[Explore New Features →]",
    },
    {
      title: "Built For Growth",
      badge: "Optimized for conversion",
      tags: "SaaS | Product | Copywriting",
      description:
        "Create polished product descriptions that communicate benefits clearly, build trust, and support better conversion rates.",
      sampleOutput:
        "Meet Verseo Core — The content operating system for high-velocity teams. Eliminate writer's block, enforce brand voice guidelines, and publish high-performing assets 10x faster.",
    },
  ];

  return (
    <section id="examples" className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="examples"
          title="See what you can create with Verseo"
          description="From social media posts and email campaigns to product descriptions and ad copy — generate content tailored to any channel in seconds."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {examples.map((ex, i) => (
            <div
              key={ex.title}
              className="verseo-card verseo-card-hover p-7 bg-white flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono-custom text-[#006fff] bg-[#006fff]/10 px-2.5 py-1 rounded-full font-medium">
                    {ex.badge}
                  </span>
                  <span className="text-xs font-mono-custom text-[#858585]">
                    0{i + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#181818] mb-1">
                  {ex.title}
                </h3>
                <p className="text-xs font-mono-custom text-[#858585] mb-3">
                  {ex.tags}
                </p>
                <p className="text-sm text-[#686868] leading-relaxed mb-6">
                  {ex.description}
                </p>

                {/* Simulated Content Box */}
                <div className="rounded-xl bg-[#f6f6f6] border border-[#ededed] p-4 text-xs font-sans text-[#2b2b2b] leading-relaxed whitespace-pre-line font-mono-custom">
                  {ex.sampleOutput}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
                <span>Status: High Conversion</span>
                <span className="text-[#10b981] font-mono-custom">100% Polish ✓</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
