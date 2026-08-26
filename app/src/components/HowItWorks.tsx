import React from "react";
import Image from "next/image";
import { SectionHeader } from "./SectionHeader";
import { MessageSquare, Sparkles, Send, ArrowRight } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Describe your idea",
      subtitle: "The simpler the input, the faster you get results",
      description:
        "Input a rough bullet list, a single sentence, or raw thoughts. Select your desired format and tone.",
      icon: MessageSquare,
      color: "#006fff",
    },
    {
      number: "02",
      title: "Watch your content take shape",
      subtitle: "Instant AI iterations tailored to your audience",
      description:
        "Verseo analyzes your prompt, structures the message, and crafts compelling copy in under 3 seconds.",
      icon: Sparkles,
      color: "#76e5fc",
    },
    {
      number: "03",
      title: "Refine your content before publishing",
      subtitle: "One-click polish and seamless exports",
      description:
        "Adjust length, tweak wording with Smart Rewrite, and export directly to Notion, Webflow, or your newsletter tool.",
      icon: Send,
      color: "#10b981",
    },
  ];

  return (
    <section className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="how it works"
          title={
            <>
              Turn any idea into <br className="hidden sm:inline" />
              ready-to-use content in seconds
            </>
          }
          description="No complex tools or long workflows - just describe what you need, and Verseo does the rest."
        />

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.number}
                className="verseo-card verseo-card-hover p-8 bg-white flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-2xl font-black font-mono-custom text-[#181818]">
                      {s.number}
                    </span>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#181818] bg-[#f6f6f6] border border-[#ededed] group-hover:scale-105 transition-transform"
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[#181818] mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#858585] mb-4">
                    {s.subtitle}
                  </p>
                  <p className="text-sm text-[#686868] leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#ededed] flex items-center justify-between text-xs text-[#858585]">
                  <span>Step {idx + 1} of 3</span>
                  <span className="font-mono-custom text-[#181818]">Automated</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
