import React from "react";
import { SectionHeader } from "./SectionHeader";
import { LockKey, DiceFive, Wallet } from "@phosphor-icons/react/dist/ssr";

export const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Deposit",
      subtitle: "Confidential from the first transaction",
      description:
        "Your balance is encrypted as an euint64 the moment it lands — never visible to other players, the operator, or the contract author.",
      icon: LockKey,
    },
    {
      number: "02",
      title: "Hold, and watch a draw",
      subtitle: "Odds accrue automatically",
      description:
        "Odds come from the time-weighted integral of your balance. On-chain randomness, unpredictable by anyone, selects a winner through a tournament.",
      icon: DiceFive,
    },
    {
      number: "03",
      title: "Withdraw, in full, any time",
      subtitle: "No penalty, no notice period",
      description:
        "Full principal back whenever you ask. Nobody loses principal — ever, no exceptions, no rounding against the depositor.",
      icon: Wallet,
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
              Deposit. Wait. <br className="hidden sm:inline" />
              Withdraw whenever you like.
            </>
          }
          description="The one genuinely awkward moment — revealing a winner takes an oracle round trip — is treated as a designed screen, not a spinner."
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
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#181818] bg-[#f6f6f6] border border-[#ededed] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" weight="bold" />
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
                  <span className="font-mono-custom text-[#181818]">Zero documentation</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
