"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SectionHeader } from "./SectionHeader";
import { ChevronRight, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export const UseCases = () => {
  const [activeTab, setActiveTab] = useState(0);

  const useCases = [
    {
      number: "001",
      title: "For marketers",
      role: "Marketing Teams & Growth Leads",
      description:
        "Create ads, emails, landing pages, and social content - without starting from scratch. Quickly generate multiple variations, test different angles, and adapt your message for every platform in seconds.",
      bullets: [
        "Generate 10+ ad headline variations simultaneously",
        "A/B test value propositions with instant iterations",
        "Transform one blog post into an entire campaign package",
      ],
      tags: ["Ad Creatives", "Landing Pages", "Multi-Variant Testing"],
      image: "/assets/2uCm8cnVOvjGE6PdFkpqiqkTM.png",
    },
    {
      number: "002",
      title: "For founders",
      role: "Early-Stage & Scaling Founders",
      description:
        "Craft pitch decks, launch announcements, investor updates, and brand messaging with clarity and speed. Communicate high-level product vision without hiring an expensive agency.",
      bullets: [
        "Structure crisp monthly investor updates",
        "Draft Product Hunt and launch day announcements",
        "Refine positioning statements for maximum investor impact",
      ],
      tags: ["Investor Updates", "Pitch Scripts", "Launch Copy"],
      image: "/assets/Vf63KZZ3HXH75JHpG3fMZT1DL7o.png",
    },
    {
      number: "003",
      title: "For creators",
      role: "Solopreneurs & Content Creators",
      description:
        "Turn rough outlines into engaging threads, newsletters, and articles while preserving your unique creative voice. Never let writer's block delay your publishing calendar.",
      bullets: [
        "Convert bullet thoughts into polished weekly newsletters",
        "Create high-engagement threads with viral hooks",
        "Maintain a 7-day content schedule in 30 minutes",
      ],
      tags: ["Newsletters", "Social Media", "Audience Growth"],
      image: "/assets/m3aswBY1UUBkd3vPtSwGvdxjNsg.png",
    },
    {
      number: "004",
      title: "For teams",
      role: "Agencies & Distributed Companies",
      description:
        "Collaborate on shared tone guidelines, review drafts in real-time, and ensure brand consistency across all touchpoints, clients, and team members.",
      bullets: [
        "Centralized tone-of-voice memory for all writers",
        "Review and approve drafts with real-time feedback",
        "Multi-project client management workspaces",
      ],
      tags: ["Shared Guidelines", "Real-time Review", "Team Workspaces"],
      image: "/assets/iMm875MSCvJtmlENPQwNDe1KjyE.png",
    },
  ];

  return (
    <section id="use-cases" className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="use cases"
          title={
            <>
              Built for how you <br className="hidden sm:inline" />
              actually create content
            </>
          }
          description="Whether you’re creating content daily or scaling it across a team, Verseo adapts to your workflow."
        />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Accordion Column */}
          <div className="lg:col-span-6 space-y-3">
            {useCases.map((uc, index) => {
              const isActive = activeTab === index;
              return (
                <div
                  key={uc.number}
                  onClick={() => setActiveTab(index)}
                  className={`verseo-card cursor-pointer p-6 transition-all duration-300 ${
                    isActive
                      ? "bg-white border-[#181818] shadow-md ring-1 ring-[#181818]"
                      : "bg-[#fbfbfb] border-[#ededed] hover:bg-white hover:border-[#dbdce0]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-custom text-xs text-[#858585] font-semibold">
                        {uc.number}
                      </span>
                      <h3 className="text-lg font-bold text-[#181818]">
                        {uc.title}
                      </h3>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-[#858585] transition-transform duration-300 ${
                        isActive ? "rotate-90 text-[#181818]" : ""
                      }`}
                    />
                  </div>

                  {isActive && (
                    <div className="mt-4 pt-4 border-t border-[#ededed] animate-in fade-in duration-300">
                      <p className="text-sm text-[#686868] leading-relaxed mb-4">
                        {uc.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {uc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-medium bg-[#f6f6f6] text-[#505050] px-2.5 py-1 rounded-full border border-[#ededed]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Active Preview Visual */}
          <div className="lg:col-span-6">
            <div className="verseo-card p-6 md:p-8 bg-white border border-[#ededed] shadow-lg rounded-3xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#ededed]">
                <div>
                  <span className="text-xs font-mono-custom text-[#858585] block mb-0.5">
                    Target Role
                  </span>
                  <h4 className="text-base font-bold text-[#181818]">
                    {useCases[activeTab].role}
                  </h4>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#181818] text-white flex items-center justify-center text-xs font-mono-custom">
                  {useCases[activeTab].number}
                </div>
              </div>

              {/* Bullet Points */}
              <div className="space-y-2.5 mb-6">
                {useCases[activeTab].bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#404040]">
                    <CheckCircle2 className="w-4 h-4 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Image Preview */}
              <div className="relative w-full h-56 rounded-2xl bg-[#f6f6f6] border border-[#ededed] overflow-hidden">
                <Image
                  src={useCases[activeTab].image}
                  alt={useCases[activeTab].title}
                  fill
                  className="object-cover object-top transition-all duration-500"
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
