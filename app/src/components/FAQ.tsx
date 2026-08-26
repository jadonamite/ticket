"use client";

import React, { useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { Plus, Minus } from "lucide-react";

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is Verseo?",
      a: "Verseo is an AI-powered writing assistant that helps you generate, rewrite, and improve content in seconds. From emails and social posts to product descriptions and marketing copy, it helps you create content faster with less effort.",
    },
    {
      q: "Who is Verseo designed for?",
      a: "Verseo is built for founders, marketers, content creators, copywriters, and teams who need to produce consistent, high-converting content quickly without writer's block or messy drafts.",
    },
    {
      q: "Do I need any writing experience?",
      a: "Not at all. Verseo guides you through simple prompts and structured templates, turning basic ideas or rough bullets into polished, ready-to-publish copy.",
    },
    {
      q: "Can I customize the generated content?",
      a: "Yes. You have full control over tone of voice, formatting, length, and style. You can edit inline, regenerate specific paragraphs, or apply custom brand voice rules.",
    },
    {
      q: "What types of content can I create?",
      a: "You can generate landing page copy, email sequences, blog posts, social media updates, ad creatives, product descriptions, video scripts, and internal documentation.",
    },
    {
      q: "How fast can I generate content?",
      a: "Most drafts, rewrites, and summaries are generated in under 3 seconds, allowing you to iterate and publish in real time.",
    },
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="faq"
          title="Everything you need to know"
          description="Whether you’re creating content solo or collaborating with a team, there’s a plan designed for your workflow."
        />

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className={`verseo-card overflow-hidden transition-all duration-200 ${
                  isOpen
                    ? "bg-white border-[#181818] shadow-sm"
                    : "bg-white border-[#ededed] hover:border-[#dbdce0]"
                }`}
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-bold text-[#181818]">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isOpen
                        ? "bg-[#181818] text-white"
                        : "bg-[#f6f6f6] text-[#686868] border border-[#ededed]"
                    }`}
                  >
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-sm sm:text-base text-[#686868] leading-relaxed border-t border-[#ededed] pt-4">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
