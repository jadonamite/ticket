import React from "react";
import Image from "next/image";
import { SectionHeader } from "./SectionHeader";
import { Star } from "lucide-react";

export const Testimonials = () => {
  const reviews = [
    {
      name: "Sarah Jenkins",
      role: "Marketing Director",
      rating: "5.0",
      quote:
        "Verseo transformed our content velocity. We went from spending days on campaign drafts to producing crisp, publication-ready copy in minutes.",
      avatar: "/assets/jGPR10PaUc2g7jVAdTW3K3uSFbk.png",
    },
    {
      name: "Alex Rivera",
      role: "Growth Lead",
      rating: "5.0",
      quote:
        "The brand voice feature is incredible. Every team member writes with the exact same tone now, whether drafting an ad or sending a customer email.",
      avatar: "/assets/h5rCp4jswKQdNAM4xKJGxNK6Z3o.png",
    },
    {
      name: "Emily Chen",
      role: "Content Strategist",
      rating: "5.0",
      quote:
        "Verseo cut our content creation time in half. What used to take hours now takes minutes, and the quality is consistently high.",
      avatar: "/assets/AsiepU8Q6cQPmSmUnIMC2lYLq9I.png",
    },
    {
      name: "Michael Torres",
      role: "Product Manager",
      rating: "4.9",
      quote:
        "We draft all our release notes and user guides in Verseo. It's clean, lightning-fast, and remarkably accurate at capturing complex features.",
      avatar: "/assets/2v2GryGVQgI5g55jWHai2MM.png",
    },
    {
      name: "Jessica Taylor",
      role: "Founder",
      rating: "5.0",
      quote:
        "As a solo founder, Verseo is like having a full-time senior copywriter on my team. It helps me communicate value propositions with precision.",
      avatar: "/assets/vVTknYFA7IZN0HAcmVCCx108Hxw.png",
    },
    {
      name: "David Miller",
      role: "Startup Founder",
      rating: "4.9",
      quote:
        "We tested several AI writing tools, but Verseo felt the most practical. It's fast, intuitive, and fits naturally into our daily workflow.",
      avatar: "/assets/13HVRbRMIvaT2O959gNx4NtLoQ.png",
    },
  ];

  return (
    <section className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="testimonials"
          title="Loved by teams that create content every day"
          description="Discover how founders, creators, and agencies rely on Verseo to ship top-tier copy with confidence."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="verseo-card verseo-card-hover p-7 bg-white flex flex-col justify-between"
            >
              <div>
                {/* Rating Stars */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#ffcc40]">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-[#ffcc40]" />
                    ))}
                  </div>
                  <span className="text-xs font-mono-custom text-[#858585] font-semibold">
                    {r.rating} / 5.0
                  </span>
                </div>

                <p className="text-sm text-[#404040] leading-relaxed mb-6 italic">
                  "{r.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-[#ededed] flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#f0f0f0] border border-[#ededed]">
                  <Image
                    src={r.avatar}
                    alt={r.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#181818]">{r.name}</h4>
                  <p className="text-xs text-[#858585]">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
