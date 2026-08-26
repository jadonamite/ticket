"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

export const Footer = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-[#f9f9f9] border-t border-[#ededed] pt-20 pb-12 text-[#181818]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#181818] flex items-center justify-center text-white font-bold">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-heading font-bold text-xl tracking-tight">
                Verseo
              </span>
            </Link>

            <p className="text-sm text-[#686868] max-w-sm leading-relaxed">
              Verseo helps teams create, refine, and publish high-quality content faster — without complicated workflows or endless revisions.
            </p>

            <div className="pt-4">
              <span className="text-xs font-mono-custom text-[#858585] block mb-1">
                [ Contact us through e-mail ]
              </span>
              <a
                href="mailto:verseo@gmail.com"
                className="text-sm font-semibold text-[#181818] hover:text-[#006fff] transition-colors"
              >
                verseo@gmail.com
              </a>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-mono-custom text-[#858585] block">
              [ Newsletter ]
            </span>
            <h4 className="text-sm font-bold text-[#181818]">Stay connected</h4>
            <p className="text-xs text-[#686868]">
              Receive monthly tips on AI content workflows and conversion copywriting.
            </p>

            {subscribed ? (
              <div className="text-xs text-[#10b981] font-medium flex items-center gap-1.5 pt-2">
                <Check className="w-4 h-4" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center gap-2 pt-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-full bg-white border border-[#ededed] focus:border-[#181818] focus:outline-none"
                />
                <button type="submit" className="btn-primary text-xs py-2.5 px-4">
                  Join
                </button>
              </form>
            )}
          </div>

          {/* Links Columns */}
          <div className="md:col-span-4 grid grid-cols-3 gap-6">
            {/* Resources */}
            <div className="space-y-3">
              <span className="text-xs font-mono-custom text-[#858585] block">
                [ resources ]
              </span>
              <ul className="space-y-2 text-xs">
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
                <li>
                  <Link href="/404" className="text-[#686868] hover:text-[#181818] transition-colors">
                    404 page
                  </Link>
                </li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="space-y-3">
              <span className="text-xs font-mono-custom text-[#858585] block">
                [ Navigation ]
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/#product" className="text-[#686868] hover:text-[#181818] transition-colors">
                    Product
                  </Link>
                </li>
                <li>
                  <Link href="/#use-cases" className="text-[#686868] hover:text-[#181818] transition-colors">
                    Use Cases
                  </Link>
                </li>
                <li>
                  <Link href="/#examples" className="text-[#686868] hover:text-[#181818] transition-colors">
                    Examples
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-[#686868] hover:text-[#181818] transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div className="space-y-3">
              <span className="text-xs font-mono-custom text-[#858585] block">
                [ Social ]
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-[#686868] hover:text-[#181818] transition-colors flex items-center gap-1">
                    Instagram <ArrowUpRight className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-[#686868] hover:text-[#181818] transition-colors flex items-center gap-1">
                    Linkedin <ArrowUpRight className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://x.com" target="_blank" rel="noreferrer" className="text-[#686868] hover:text-[#181818] transition-colors flex items-center gap-1">
                    Twitter / X <ArrowUpRight className="w-2.5 h-2.5" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#ededed] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#858585]">
          <p>© 2026 Verseo | All Rights Reserved</p>
          <div className="flex items-center gap-4">
            <span className="text-[#858585]">Built with High Craft</span>
            <span>•</span>
            <span className="text-[#181818] font-medium">Framer Replica</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
