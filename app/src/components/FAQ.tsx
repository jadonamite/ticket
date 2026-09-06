"use client";

import React, { useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { Plus, Minus } from "@phosphor-icons/react";

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is Ticket?",
      a: "A prize-linked savings pool: put money in, take it out in full whenever you like, and get entries in a draw instead of interest. Your balance stays encrypted with FHEVM the whole time — from other players, from the operator, from the person who wrote the contract.",
    },
    {
      q: "Can I lose my money?",
      a: "No. You never lose principal — full withdrawal, any time, no penalty, no notice period. The only thing at stake is the prize, which is pooled and drawn for instead of paid as interest.",
    },
    {
      q: "If balances are encrypted, how do odds stay fair?",
      a: "Odds come from an encrypted time-weighted balance — a running integral of your balance over time, maintained per depositor and decrypted by nobody, ever. Money held for three months outweighs money parked for an hour, without either being visible.",
    },
    {
      q: "What does Verify Draw actually prove?",
      a: "From any settled draw, anyone can independently confirm four things: the randomness source, the time-weighted balances, the per-address weight cap, and the winner selection. Exactly one value is ever made public — the winner. Never a balance, never a total, never a losing entry.",
    },
    {
      q: "Does this hide who I am?",
      a: "No — Ticket hides amounts, not addresses. It isn't built for anonymity; it's built so your balance and deposit timing aren't legible to everyone forever.",
    },
    {
      q: "What network is this on?",
      a: "Ethereum Sepolia, built on Zama's FHEVM. The pool and demo token are deployed and verifiable on-chain; the demo token is faucet-mintable so it can be tried without asking anyone for tokens.",
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
          description="If a fairness claim can't be checked by a stranger, it isn't a promise — it's an assertion."
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
                    {isOpen ? <Minus weight="bold" className="w-4 h-4" /> : <Plus weight="bold" className="w-4 h-4" />}
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
