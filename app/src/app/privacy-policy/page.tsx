import React from "react";
import { SectionHeader } from "@/components/SectionHeader";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function PrivacyPolicyPage() {
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
          title="Privacy Policy"
          description="Ticket is open-source software running against Ethereum Sepolia. There is no account, and no server collecting your data."
        />

        <div className="max-w-3xl mx-auto verseo-card p-8 md:p-12 bg-white shadow-sm space-y-8 text-sm sm:text-base text-[#404040] leading-relaxed">
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">1. What this site is</h3>
            <p>
              Ticket is a static frontend for a smart contract deployed on Ethereum Sepolia. There
              is no login, no account, and no backend server that stores your personal information.
              Every deposit, draw, and withdrawal is a transaction you sign yourself and send
              directly to the chain.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">2. What's public, and what isn't</h3>
            <p>
              Ethereum addresses and transaction metadata are public by nature — this site does not
              hide who interacts with the contract. What it does hide is your balance: deposit
              amounts and the time-weighted balance they generate are encrypted with FHEVM
              (Zama), and are never decrypted except for the single winning address at the end of a
              draw.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">3. Wallets & third parties</h3>
            <p>
              Connecting a wallet is handled entirely by the wallet extension you choose (e.g.
              MetaMask) — this site never sees or stores your private keys or seed phrase. RPC
              requests to read chain state may pass through a public Sepolia endpoint.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">4. Contact</h3>
            <p>
              This is open-source, MIT-licensed software. Questions or concerns about the code are
              best raised as an issue on the project's GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
