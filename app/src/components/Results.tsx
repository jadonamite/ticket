import React from "react";
import { SectionHeader } from "./SectionHeader";
import { ShieldCheck, LockKey, Scales, MagnifyingGlass, DoorOpen } from "@phosphor-icons/react/dist/ssr";

export const Results = () => {
  const cards = [
    {
      title: "No loss",
      tagline: "Full principal back, whenever you ask.",
      description:
        "Nobody loses principal. Ever. No exceptions, no rounding against the depositor — the only thing at stake is the prize, pooled and drawn for instead.",
      icon: ShieldCheck,
      metric: "100%",
      metricLabel: "principal protected",
    },
    {
      title: "Private",
      tagline: "Your balance and history are yours.",
      description:
        "Balances are encrypted from other players, the operator, and the person who wrote the contract — for the whole time your money is in the pool.",
      icon: LockKey,
      metric: "0",
      metricLabel: "balances in the clear",
    },
    {
      title: "Fair",
      tagline: "Odds by time held, not by timing the draw.",
      description:
        "A late whale who deposits seconds before a draw wins odds near zero, demonstrably — the same protection public pools have, rebuilt to work encrypted.",
      icon: Scales,
      metric: "Longer = better",
      metricLabel: "odds by time held",
    },
    {
      title: "Checkable",
      tagline: "Every draw verifiable by anyone.",
      description:
        "Randomness, weighting, cap, and winner selection — each independently confirmed in one click from any settled draw.",
      icon: MagnifyingGlass,
      metric: "1-click",
      metricLabel: "verify draw",
    },
    {
      title: "Free to leave",
      tagline: "No lock-up, no notice period.",
      description:
        "Withdraw in full at any time. There is no penalty for leaving early and no minimum holding period to earn a draw entry.",
      icon: DoorOpen,
      metric: "0",
      metricLabel: "lock-up days",
    },
  ];

  return (
    <section className="framed-section py-24 md:py-32 bg-[#f9f9f9] relative">
      <div className="corner-cross top-[-9px] left-4 lg:left-10" />
      <div className="corner-cross top-[-9px] right-4 lg:right-10" />

      <div className="framed-container px-4 sm:px-6">
        <SectionHeader
          badge="what you get"
          title="Five promises, held at once"
          description="Everything anyone needs to check fairness is public. Nothing anyone could use to snoop is."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="verseo-card verseo-card-hover p-8 bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-[#f6f6f6] border border-[#ededed] flex items-center justify-center text-[#181818]">
                      <Icon className="w-5 h-5" weight="bold" />
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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
