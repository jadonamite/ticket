import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { TicketLogo } from "@/components/TicketLogo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Navigation",
    links: [
      { label: "Fairness", href: "/#fairness" },
      { label: "Who it's for", href: "/#use-cases" },
      { label: "Verify Draw", href: "/#verify" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Source & docs", href: "https://github.com/jadonamite/ticket" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="relative overflow-hidden w-full bg-[#f2f2f2] border-t border-[#ededed] pt-16 text-[#181818]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        {/* Main Footer Grid */}
        <div className="relative z-[2] grid grid-cols-1 md:grid-cols-12 gap-10 pb-6">
          {/* Brand Col */}
          <div className="md:col-span-6 space-y-4">
            <Link href="/" className="inline-flex items-center">
              <TicketLogo size="lg" theme="light" />
            </Link>

            <p className="text-sm text-[#686868] max-w-sm leading-relaxed">
              A prize pool that cannot see your money and still cannot be gamed. Confidential
              time-weighted odds with a publicly verifiable draw, built on Zama&apos;s FHEVM.
            </p>
          </div>

          {/* Link Columns */}
          {COLUMNS.map((column) => (
            <div key={column.title} className="md:col-span-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                <span className="footer-bullet" aria-hidden />
                {column.title}
              </h3>
              <ul className="space-y-1">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("http") ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 py-1 text-sm text-[#686868] hover:text-[#181818] transition-colors"
                      >
                        {link.label} <ArrowUpRight weight="bold" className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="block py-1 text-sm text-[#686868] hover:text-[#181818] transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Giant bleed wordmark */}
        <div className="footer-mark-wrap" aria-hidden>
          <div className="footer-mark">Ticket</div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-[2] py-6 border-t border-[#dbdce0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#858585]">
          <span>© 2026 Ticket. MIT Licensed.</span>
          <span className="font-mono-custom">Ethereum Sepolia · Zama FHEVM</span>
        </div>
      </div>
    </footer>
  );
};
