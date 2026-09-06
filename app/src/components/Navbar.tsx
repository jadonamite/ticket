"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { List, X, ArrowUpRight } from "@phosphor-icons/react";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Overview", href: "#" },
    { name: "Fairness", href: "#fairness" },
    { name: "Verify Draw", href: "/app" },
    { name: "Benchmarks", href: "#benchmarks" },
    { name: "Docs", href: "https://github.com" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-5 transition-all duration-300">
      <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between">
        
        {/* Left: Brand Mark (icon only — the full wordmark lives in the Hero) */}
        <Link href="/" className="flex items-center group">
          <div className="relative w-7 h-7 transition-transform duration-200 group-hover:scale-105">
            <Image src="/ticket-dark.png" alt="Ticket — home" fill priority sizes="28px" className="object-contain" />
          </div>
        </Link>

        {/* Right: Hamburger / Action (Wishlabs exact pattern) */}
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-sans text-sm font-semibold backdrop-blur-md border border-white/20 transition-all duration-200"
          >
            <span>Launch App</span>
            <ArrowUpRight size={16} weight="bold" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:text-white/80 transition-colors p-1.5 focus:outline-none"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={32} weight="bold" /> : <List size={32} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-6 top-20 bg-[#171324]/95 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 max-w-sm ml-auto">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 text-sm font-sans font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="h-px bg-white/10 my-1" />
          <Link
            href="/app"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-2.5 text-center text-xs font-sans font-semibold rounded-xl bg-white text-black hover:bg-white/90 transition-colors"
          >
            Launch App
          </Link>
        </div>
      )}
    </header>
  );
};
