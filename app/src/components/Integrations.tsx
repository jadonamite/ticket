import React from "react";
import Image from "next/image";

export const Integrations = () => {
  const tools = [
    { name: "Asana", icon: "/assets/BPPaIo0JzXU1pg5qKzI8XasN8k.svg" },
    { name: "Notion", label: "Notion" },
    { name: "Slack", label: "Slack" },
    { name: "Google Docs", label: "Google Docs" },
    { name: "Figma", label: "Figma" },
    { name: "Webflow", label: "Webflow" },
    { name: "Zapier", label: "Zapier" },
  ];

  return (
    <div className="w-full py-16 border-t border-[#ededed] bg-[#f9f9f9]">
      <div className="max-w-[1360px] mx-auto px-4 text-center">
        <p className="text-xs font-mono-custom uppercase tracking-widest text-[#858585] font-semibold mb-6">
          Works with your favorite tools
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {tools.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full border border-[#ededed] shadow-xs text-xs font-medium text-[#181818] hover:border-[#dbdce0] transition-colors"
            >
              {t.icon ? (
                <img src={t.icon} alt={t.name} className="w-4 h-4" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-[#181818]" />
              )}
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
