import React from "react";
import Link from "next/link";
import { ArrowUpRight, GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { TicketLogo } from "@/components/TicketLogo";

export const Footer = () => {
  return (
    <footer className="w-full bg-[#f9f9f9] border-t border-[#ededed] pt-20 pb-12 text-[#181818]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Col */}
          <div className="md:col-span-7 space-y-4">
            <Link href="/" className="inline-flex items-center">
              <TicketLogo size="lg" theme="light" />
            </Link>

            <p className="text-sm text-[#686868] max-w-md leading-relaxed">
              A prize pool that cannot see your money and still cannot be gamed. Confidential
              time-weighted odds with a publicly verifiable draw, built on Zama's FHEVM.
            </p>

            <div className="pt-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#181818] hover:text-[#006fff] transition-colors"
              >
                <GithubLogo weight="bold" className="w-4 h-4" />
                <span>Source & docs on GitHub</span>
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-5 grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-mono-custom text-[#858585] block">
                [ Navigation ]
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/#fairness" className="text-[#686868] hover:text-[#181818] transition-colors">
                    Fairness
                  </Link>
                </li>
                <li>
                  <Link href="/#use-cases" className="text-[#686868] hover:text-[#181818] transition-colors">
                    Who it's for
                  </Link>
                </li>
                <li>
                  <Link href="/#verify" className="text-[#686868] hover:text-[#181818] transition-colors">
                    Verify Draw
                  </Link>
                </li>
                <li>
                  <Link href="/#faq" className="text-[#686868] hover:text-[#181818] transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono-custom text-[#858585] block">
                [ resources ]
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="text-[#686868] hover:text-[#181818] transition-colors flex items-center gap-1">
                    README <ArrowUpRight weight="bold" className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="text-[#686868] hover:text-[#181818] transition-colors flex items-center gap-1">
                    PRD <ArrowUpRight weight="bold" className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-[#686868] hover:text-[#181818] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-[#686868] hover:text-[#181818] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#ededed] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#858585]">
          <p>© 2026 Ticket. MIT Licensed.</p>
          <p className="font-mono-custom">Ethereum Sepolia · Zama FHEVM</p>
        </div>
      </div>
    </footer>
  );
};
