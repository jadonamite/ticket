"use client";

import React, { useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { CaretRight, Check } from "@phosphor-icons/react";

export const UseCases = () => {
  const [activeTab, setActiveTab] = useState(0);

  const audiences = [
    {
      number: "001",
      title: "The saver who won't gamble",
      role: "Primary — Full Principal, No Loss",
      description:
        "Someone who wants the upside of a lottery ticket without the possibility of loss, and who doesn't want their savings balance, deposit timing, or win size legible to everyone forever.",
      bullets: [
        "Full principal back, whenever you ask — no penalty, no notice period",
        "Balance and deposit history stay encrypted from other players, the operator, and the contract author",
        "Odds come from time held, not from timing a draw",
      ],
      tags: ["No loss", "Private balance", "Free to leave"],
    },
    {
      number: "002",
      title: "The judge, the auditor, the sceptic",
      role: "Secondary — Verify Draw",
      description:
        "A fairness claim is only worth what a stranger can check. “It's on-chain” and “I can verify the fairness” are different sentences — only the second one is a promise.",
      bullets: [
        "Randomness source, time-weighted balances, weight cap, and winner selection — each independently checked",
        "One click from any settled draw, legible to someone who's never heard of a prefix-sum tree",
        "Everything needed to check fairness is public; nothing anyone could use to snoop is",
      ],
      tags: ["Verify Draw", "Public randomness", "No trust required"],
    },
  ];

  return (
    <section id="use-cases" className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="who it's for"
          title={
            <>
              Two people this <br className="hidden sm:inline" />
              was built for
            </>
          }
          description="Not for anyone seeking anonymity — Ticket hides amounts, not addresses."
        />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Accordion Column */}
          <div className="lg:col-span-5 space-y-3">
            {audiences.map((uc, index) => {
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
                    <CaretRight
                      weight="bold"
                      className={`w-4 h-4 text-[#858585] transition-transform duration-300 ${
                        isActive ? "rotate-90 text-[#181818]" : ""
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Active Preview */}
          <div className="lg:col-span-7">
            <div className="verseo-card p-6 md:p-8 bg-white border border-[#ededed] shadow-lg rounded-3xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#ededed]">
                <div>
                  <span className="text-xs font-mono-custom text-[#858585] block mb-0.5">
                    {audiences[activeTab].role}
                  </span>
                  <h4 className="text-base font-bold text-[#181818]">
                    {audiences[activeTab].title}
                  </h4>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#181818] text-white flex items-center justify-center text-xs font-mono-custom shrink-0">
                  {audiences[activeTab].number}
                </div>
              </div>

              <p className="text-sm text-[#686868] leading-relaxed mb-6">
                {audiences[activeTab].description}
              </p>

              <div className="space-y-2.5 mb-6">
                {audiences[activeTab].bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#404040]">
                    <Check weight="bold" className="w-4 h-4 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {audiences[activeTab].tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium bg-[#f6f6f6] text-[#505050] px-2.5 py-1 rounded-full border border-[#ededed]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
