import React from "react";

interface SectionHeaderProps {
  badge: string;
  title: React.ReactNode;
  description?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  title,
  description,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center text-center max-w-3xl mx-auto mb-14 md:mb-20 px-4 ${className}`}>
      {/* Framer Bracket Pill */}
      <div className="badge-pill mb-4 px-3 py-1 rounded-full bg-[#ededed]/60 border border-[#dbdce0]/40">
        <span>[</span>
        <span className="text-[#181818] font-medium tracking-wide">{badge}</span>
        <span>]</span>
      </div>

      {/* Main Title */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#181818] leading-[1.15] mb-5">
        {title}
      </h2>

      {/* Description */}
      {description && (
        <p className="text-base sm:text-lg text-[#686868] leading-relaxed max-w-2xl font-normal">
          {description}
        </p>
      )}
    </div>
  );
};
