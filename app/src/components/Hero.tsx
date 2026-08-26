"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Wand2, RefreshCw, Layers, Check, Copy, Sliders } from "lucide-react";

export const Hero = () => {
  const [activeTab, setActiveTab] = useState<"writer" | "voice" | "rewrite" | "summarize">("writer");
  const [promptText, setPromptText] = useState("Write a high-converting announcement email for our AI feature launch");
  const [tone, setTone] = useState("Professional");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<string | null>(
    "Subject: Introducing Intelligent Content Workflows 🚀\n\nHey Team,\n\nWe're thrilled to announce the next generation of content automation. With Verseo, your team can turn rough ideas into publication-ready copy in under 3 seconds.\n\nKey Highlights:\n• Automated Tone Matching across all channels\n• 1-Click Smart Rewrites for clarity\n• Seamless integration with your existing stack\n\nReady to transform your content velocity?"
  );
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setOutput(
        `Subject: Supercharge your writing with Verseo ⚡\n\nHi there,\n\nContent creation shouldn't feel like a bottleneck. Verseo eliminates blank-page syndrome with real-time, context-aware suggestions tailored directly to your brand voice.\n\n✓ Zero manual rewriting\n✓ Unified team tone\n✓ Instant export to Markdown & HTML\n\nExperience seamless content delivery today.`
      );
    }, 600);
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const samplePrompts = [
    "Launch announcement email",
    "SaaS landing page headline",
    "Engaging LinkedIn post",
    "Product changelog summary"
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Subtle Gradient & Grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#ededed_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#76e5fc]/15 via-[#aeabff]/15 to-transparent blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Main Hero Header */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-12 md:mb-16">
          {/* Framer style badge */}
          <div className="badge-pill mb-6 px-4 py-1.5 rounded-full bg-white border border-[#ededed] shadow-[0_2px_8px_rgba(0,0,0,0.02)] animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="text-[#a0a0a0]">[</span>
            <span className="text-[#181818] font-medium tracking-wide">AI writing tool</span>
            <span className="text-[#a0a0a0]">]</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#181818] leading-[1.08] mb-6">
            Write better content. <br />
            <span className="text-[#181818]/90">Faster. With AI</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[#686868] max-w-2xl font-normal leading-relaxed mb-8">
            Verseo helps teams, founders, and marketers generate high-quality content in seconds — without overthinking every word
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 w-full">
            <Link
              href="#pricing"
              className="btn-primary px-7 py-3.5 text-[15px] font-medium group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <button
              onClick={() => {
                const el = document.getElementById("demo-workspace");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-secondary px-7 py-3.5 text-[15px] font-medium group"
            >
              <span>Try Demo</span>
              <Sparkles className="w-4 h-4 text-[#686868] transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>
        </div>

        {/* Interactive Dashboard Preview Card */}
        <div
          id="demo-workspace"
          className="relative max-w-5xl mx-auto rounded-3xl bg-white border border-[#ededed] shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300"
        >
          {/* Top Window Bar with Controls */}
          <div className="bg-[#f9f9f9] border-b border-[#ededed] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            {/* Mac style dots */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ec6b5e]/80" />
              <span className="w-3 h-3 rounded-full bg-[#ffcc40]/80" />
              <span className="w-3 h-3 rounded-full bg-[#a2e198]/80" />
              <span className="ml-3 text-xs font-mono-custom text-[#858585]">verseo_workspace.v2</span>
            </div>

            {/* Feature Tabs */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#ededed]">
              <button
                onClick={() => setActiveTab("writer")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "writer"
                    ? "bg-[#181818] text-white shadow-sm"
                    : "text-[#686868] hover:text-[#181818] hover:bg-[#f6f6f6]"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Writer</span>
              </button>

              <button
                onClick={() => setActiveTab("voice")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "voice"
                    ? "bg-[#181818] text-white shadow-sm"
                    : "text-[#686868] hover:text-[#181818] hover:bg-[#f6f6f6]"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Brand Voice</span>
              </button>

              <button
                onClick={() => setActiveTab("rewrite")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "rewrite"
                    ? "bg-[#181818] text-white shadow-sm"
                    : "text-[#686868] hover:text-[#181818] hover:bg-[#f6f6f6]"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rewrite</span>
              </button>

              <button
                onClick={() => setActiveTab("summarize")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "summarize"
                    ? "bg-[#181818] text-white shadow-sm"
                    : "text-[#686868] hover:text-[#181818] hover:bg-[#f6f6f6]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Summarize</span>
              </button>
            </div>
          </div>

          {/* Interactive Workspace Area */}
          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-b from-white to-[#fbfbfb]">
            {/* Left Prompt Input Box */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#858585] mb-2">
                  What do you want to write today?
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Describe what you want to create..."
                    className="w-full text-sm p-3.5 rounded-2xl bg-[#f6f6f6] border border-[#ededed] focus:border-[#181818] focus:bg-white focus:outline-none transition-all resize-none text-[#181818] placeholder:text-[#858585]"
                  />
                </div>

                {/* Quick Prompts */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {samplePrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPromptText(p)}
                      className="text-[11px] font-medium bg-white hover:bg-[#ededed] text-[#686868] hover:text-[#181818] px-2.5 py-1 rounded-full border border-[#ededed] transition-colors"
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls bar */}
              <div className="pt-2 border-t border-[#ededed] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#858585] font-medium">Tone:</span>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="text-xs bg-[#f6f6f6] border border-[#ededed] rounded-lg px-2 py-1 text-[#181818] font-medium focus:outline-none"
                  >
                    <option>Professional</option>
                    <option>Casual & Friendly</option>
                    <option>Persuasive</option>
                    <option>Bold & Direct</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-primary text-xs py-2 px-4 shadow-sm"
                >
                  {generating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{generating ? "Generating..." : "Generate Content"}</span>
                </button>
              </div>
            </div>

            {/* Right Generated Preview Box */}
            <div className="lg:col-span-7 rounded-2xl bg-[#f6f6f6]/80 border border-[#ededed] p-5 flex flex-col justify-between min-h-[260px] relative">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#ededed]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-xs font-semibold text-[#181818]">Live Output</span>
                  <span className="text-[11px] font-mono-custom text-[#858585] bg-white px-2 py-0.5 rounded border border-[#ededed]">
                    {tone}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="text-xs flex items-center gap-1 text-[#686868] hover:text-[#181818] bg-white px-2.5 py-1 rounded-lg border border-[#ededed] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-[#10b981]" />
                      <span className="text-[#10b981]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Content */}
              <div className="text-sm font-normal text-[#2b2b2b] leading-relaxed whitespace-pre-line font-sans flex-1 overflow-y-auto max-h-[220px]">
                {output}
              </div>

              <div className="mt-3 pt-2 border-t border-[#ededed] flex items-center justify-between text-[11px] text-[#858585]">
                <span>Status: Ready to publish ✓</span>
                <span className="font-mono-custom">Generated in 1.4s</span>
              </div>
            </div>
          </div>

          {/* Bottom Visual Banner Image from Original Verseo */}
          <div className="relative w-full h-44 sm:h-56 bg-[#f0f0f0] border-t border-[#ededed] overflow-hidden">
            <Image
              src="/assets/yj2cqScVkBBWEyJJVdm9obYl4OU.png"
              alt="Verseo AI content generation dashboard preview"
              fill
              className="object-cover object-top opacity-90 hover:opacity-100 transition-opacity duration-300"
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};
