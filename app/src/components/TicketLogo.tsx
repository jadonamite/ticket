"use client";

import React from "react";
import Image from "next/image";

interface TicketLogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  theme?: "dark" | "light"; // "dark" for white text on dark/colored sky, "light" for dark text on cream
  size?: "sm" | "md" | "lg" | "xl" | "hero";
}

export const TicketLogo: React.FC<TicketLogoProps> = ({
  className = "",
  markClassName = "",
  textClassName = "",
  theme = "dark",
  size = "md",
}) => {
  // Dimension scales. "hero" uses viewport-relative units so the mark scales
  // in lockstep with the "icket" text (which is sized in vw) at any screen width.
  const sizeMap = {
    sm: { mark: "20px", text: "text-base", tracking: "tracking-[-0.04em]", offset: "-ml-0.5" },
    md: { mark: "26px", text: "text-xl", tracking: "tracking-[-0.04em]", offset: "-ml-1" },
    lg: { mark: "38px", text: "text-3xl", tracking: "tracking-[-0.05em]", offset: "-ml-1.5" },
    xl: { mark: "54px", text: "text-5xl", tracking: "tracking-[-0.05em]", offset: "-ml-2" },
    hero: { mark: "19vw", text: "text-[26vw]", tracking: "tracking-[-0.06em]", offset: "-ml-[2vw]" },
  };

  const currentSize = sizeMap[size];
  const textColor = theme === "dark" ? "text-white" : "text-[#121212]";
  const logoSrc = theme === "dark" ? "/ticket-dark.png" : "/ticket.png";

  return (
    <div className={`inline-flex items-center font-sans select-none ${className}`}>
      {/* The "T" Mark from official ticket logo */}
      <div
        className={`relative shrink-0 flex items-center justify-center ${markClassName}`}
        style={{ width: currentSize.mark, height: currentSize.mark }}
      >
        <Image
          src={logoSrc}
          alt="T"
          fill
          priority
          sizes={currentSize.mark}
          className="w-full h-full object-contain"
        />
      </div>

      {/* The remaining letters "icket" completing "Ticket" */}
      <span
        className={`font-black leading-none ${currentSize.text} ${currentSize.tracking} ${textColor} ${currentSize.offset} ${textClassName}`}
      >
        icket
      </span>
    </div>
  );
};
