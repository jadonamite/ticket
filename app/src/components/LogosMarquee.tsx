import React from "react";
import Image from "next/image";

export const LogosMarquee = () => {
  const logos = [
    { src: "/assets/QCk9cViz1F2xnGiau496ziuo0.svg", alt: "Acme Corp" },
    { src: "/assets/TEhQDP8wXbK7ykvjjeOZ4T6whY4.svg", alt: "Pulse Tech" },
    { src: "/assets/rk7BarLvRq1CODbxSAWbsERxdg.svg", alt: "Vertex AI" },
    { src: "/assets/lVhMUf5x9wehQI1PonsBsvD57yE.svg", alt: "Nova Studio" },
    { src: "/assets/sl1agytIn7rTvY5T2FMRTaytw.svg", alt: "Kite Labs" },
    { src: "/assets/YPA31dypqQhkEL6FPlyB7OyvY.png", alt: "Echo Media" },
    { src: "/assets/5qmVyUJP6fkUQu9HmQk5SICIvI.png", alt: "Sphere Group" },
    { src: "/assets/Bk3oddwYJWgFVj2XpkfDiNytRY.png", alt: "Aura System" },
    { src: "/assets/GEtxM7r4rJ5mXgZWQtd8N7CTGk.png", alt: "Onyx Data" },
  ];

  return (
    <div className="w-full py-16 border-y border-[#ededed] bg-[#f9f9f9] overflow-hidden relative">
      <div className="max-w-[1360px] mx-auto px-4 text-center mb-8">
        <p className="text-xs font-mono-custom uppercase tracking-widest text-[#858585] font-semibold">
          Trusted by modern teams
        </p>
      </div>

      {/* Infinite Horizontal Marquee */}
      <div className="relative w-full flex overflow-x-hidden mask-gradient">
        <div className="animate-marquee flex items-center gap-14 sm:gap-20 opacity-70 hover:opacity-100 transition-opacity duration-300">
          {logos.concat(logos).concat(logos).map((logo, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-200 flex items-center justify-center h-9"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="max-h-7 max-w-[130px] object-contain opacity-80"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
