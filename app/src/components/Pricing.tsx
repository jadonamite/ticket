"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SectionHeader } from "./SectionHeader";
import { Check, Sparkles, ArrowRight } from "lucide-react";

export const Pricing = () => {
  const [annual, setAnnual] = useState(true);

  const tiers = [
    {
      name: "Starter",
      tagline: "For individuals and freelancers",
      price: annual ? "$12" : "$15",
      period: "/ month",
      billingNote: annual ? "Billed annually ($144/yr)" : "Billed monthly",
      popular: false,
      features: [
        "AI writing assistant",
        "Essential content templates",
        "Rewrite and improve text",
        "Standard support",
        "Export to Markdown & Text",
      ],
      cta: "Get Started",
      btnClass: "btn-secondary",
    },
    {
      name: "Pro",
      tagline: "For creators and professionals",
      price: annual ? "$29" : "$35",
      period: "/ month",
      billingNote: annual ? "Billed annually ($348/yr)" : "Billed monthly",
      popular: true,
      features: [
        "Advanced AI generation",
        "Brand voice controls",
        "Full template library",
        "Priority content tools",
        "1-Click Multi-Channel Repurposing",
        "Direct export to Notion & Webflow",
      ],
      cta: "Get Started Free",
      btnClass: "btn-primary",
    },
    {
      name: "Team",
      tagline: "For agencies and growing teams",
      price: annual ? "$79" : "$95",
      period: "/ month",
      billingNote: annual ? "Billed annually ($948/yr)" : "Billed monthly",
      popular: false,
      features: [
        "Shared team workspace",
        "Team collaboration tools",
        "Unlimited team projects",
        "Priority 24/7 dedicated support",
        "Custom brand tone guidelines",
        "API access & webhook exports",
      ],
      cta: "Contact Sales",
      btnClass: "btn-secondary",
    },
  ];

  return (
    <section id="pricing" className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="pricing"
          title={
            <>
              Choose the plan that <br className="hidden sm:inline" />
              grows with you
            </>
          }
          description="Whether you’re creating content solo or collaborating with a team, there’s a plan designed for your workflow."
        />

        {/* Monthly / Annual Toggle */}
        <div className="flex items-center justify-center mb-16">
          <div className="bg-white p-1.5 rounded-full border border-[#ededed] shadow-xs flex items-center gap-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                !annual
                  ? "bg-[#181818] text-white shadow-xs"
                  : "text-[#686868] hover:text-[#181818]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                annual
                  ? "bg-[#181818] text-white shadow-xs"
                  : "text-[#686868] hover:text-[#181818]"
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded-full font-mono-custom">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`verseo-card p-8 flex flex-col justify-between relative transition-all duration-300 ${
                tier.popular
                  ? "bg-white border-[#181818] shadow-xl ring-2 ring-[#181818] lg:-translate-y-2"
                  : "bg-white border-[#ededed] shadow-xs hover:border-[#dbdce0]"
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#181818] text-white text-[11px] font-mono-custom font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#76e5fc]" />
                  <span>Most Popular</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-[#181818]">{tier.name}</h3>
                  <span className="text-xs font-mono-custom text-[#858585]">
                    Tier
                  </span>
                </div>

                <p className="text-xs text-[#686868] mb-6 min-h-[32px]">
                  {tier.tagline}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[#181818] font-heading">
                    {tier.price}
                  </span>
                  <span className="text-sm font-medium text-[#858585]">
                    {tier.period}
                  </span>
                </div>

                <p className="text-xs text-[#858585] mb-8 font-mono-custom">
                  {tier.billingNote}
                </p>

                {/* CTA Button */}
                <Link
                  href="/contact-us"
                  className={`${tier.btnClass} w-full py-3 text-center mb-8 font-medium`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Feature Checklist */}
                <div className="space-y-3 pt-6 border-t border-[#ededed]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
                    Included Features:
                  </p>
                  {tier.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#404040]">
                      <Check className="w-4 h-4 text-[#10b981] flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
                <span>No long-term contracts</span>
                <span className="font-mono-custom">Cancel anytime</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
