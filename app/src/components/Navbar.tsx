"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X, Sparkles } from "lucide-react";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Product", href: "/#product" },
    { name: "Use Cases", href: "/#use-cases" },
    { name: "Examples", href: "/#examples" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Contact Us", href: "/contact-us" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 transition-all duration-300">
      <div
        className={`w-full max-w-[1360px] mx-auto rounded-full px-5 py-3 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? "glass-nav shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#ededed]"
            : "bg-white/80 backdrop-blur-md border border-[#ededed]/80 shadow-sm"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#181818] flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-heading font-bold text-lg text-[#181818] tracking-tight">
            Verseo
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#f6f6f6] px-3 py-1.5 rounded-full border border-[#ededed]">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="px-4 py-1.5 text-[13.5px] font-medium text-[#686868] hover:text-[#181818] rounded-full transition-colors hover:bg-white/70"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/contact-us"
            className="text-[13.5px] font-medium text-[#686868] hover:text-[#181818] px-3 py-1.5 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="#pricing"
            className="btn-primary text-xs sm:text-[13px] py-2 px-4 group"
          >
            <span>Get Template Free</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 rounded-lg text-[#181818] hover:bg-[#ededed] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-4 top-20 bg-white border border-[#ededed] rounded-3xl p-6 shadow-xl z-50 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-base font-medium text-[#181818] hover:bg-[#f6f6f6] rounded-xl transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="h-px bg-[#ededed] my-1" />
          <Link
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-primary w-full py-3 text-center"
          >
            Get Template Free
          </Link>
        </div>
      )}
    </header>
  );
};
