import React from "react";
import { SectionHeader } from "@/components/SectionHeader";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function TermsOfServicePage() {
  return (
    <div className="w-full pt-32 pb-24 md:pt-40 md:pb-32 bg-[#f9f9f9]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="mb-8 max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono-custom text-[#686868] hover:text-[#181818] transition-colors mb-4"
          >
            <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
            <span>Back to home</span>
          </Link>
        </div>

        <SectionHeader
          badge="legal"
          title="Terms of Service"
          description="Open-source software, provided as-is, running on Ethereum Sepolia testnet."
        />

        <div className="max-w-3xl mx-auto verseo-card p-8 md:p-12 bg-white shadow-sm space-y-8 text-sm sm:text-base text-[#404040] leading-relaxed">
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">1. What Ticket is</h3>
            <p>
              Ticket is MIT-licensed, open-source software: a smart contract and a frontend for
              interacting with it. It currently runs on Ethereum Sepolia, a public testnet — the
              demo token used for deposits has no monetary value.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">2. You control your funds</h3>
            <p>
              Every action — deposit, withdrawal, draw — is a transaction you sign with your own
              wallet. Nobody, including the contract's author, can move your funds or read your
              balance. You are solely responsible for the security of your wallet and private keys.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">3. No warranty</h3>
            <p>
              This software is provided "as is," without warranty of any kind, express or implied,
              per the MIT License. It has not undergone a third-party security audit. Use on
              mainnet, or with funds you cannot afford to lose, is not recommended.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">4. No custody, no subscription</h3>
            <p>
              There are no accounts, no subscriptions, and no fees charged by Ticket itself — only
              the gas cost of the transactions you choose to send. The full source is available to
              read, fork, and self-host.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
