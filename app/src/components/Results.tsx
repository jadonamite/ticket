import React from "react";
import { SectionHeader } from "./SectionHeader";
import { Gauge, CheckCheck, Clock, Share2, Sparkles, TrendingUp } from "lucide-react";

export const Results = () => {
  const cards = [
    {
      title: "Stay in the flow",
      tagline: "No more switching between tools and tabs.",
      description:
        "Keep momentum while writing. Generate, improve, and expand ideas without breaking your creative process.",
      icon: Gauge,
      metric: "10x",
      metricLabel: "faster creation",
    },
    {
      title: "Ready to Publish",
      tagline: "Export your content wherever you need it.",
      description:
        "Review, edit, regenerate, and push your content directly into production channels with verified formatting.",
      icon: CheckCheck,
      metric: "100%",
      metricLabel: "brand aligned",
    },
    {
      title: "Less time spent editing",
      tagline: "Refine and finalize drafts in seconds.",
      description:
        "Polish phrasing and tone with AI-powered suggestions, cutting out repetitive back-and-forth review loops.",
      icon: Clock,
      metric: "-70%",
      metricLabel: "editing hours",
    },
    {
      title: "Content that fits anywhere",
      tagline: "From social posts to long-form content.",
      description:
        "Keep messaging aligned across emails, social media, landing pages, and campaigns with unified tone memory.",
      icon: Share2,
      metric: "Omni",
      metricLabel: "channel sync",
    },
  ];

  return (
    <section className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="results"
          title="See the impact instantly"
          description="Create content faster, stay consistent across every channel, and achieve better results with less effort."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="verseo-card verseo-card-hover p-8 bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-[#f6f6f6] border border-[#ededed] flex items-center justify-center text-[#181818]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono-custom text-[#181818]">
                        {c.metric}
                      </div>
                      <div className="text-[10px] uppercase font-mono-custom text-[#858585]">
                        {c.metricLabel}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[#181818] mb-1.5">
                    {c.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#858585] mb-3">
                    {c.tagline}
                  </p>
                  <p className="text-sm text-[#686868] leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
                  <span>Verseo Benefit 0{i + 1}</span>
                  <span className="font-mono-custom text-[#10b981]">Verified Impact ✓</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
