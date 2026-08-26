import React from "react";
import { SectionHeader } from "@/components/SectionHeader";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full pt-32 pb-24 md:pt-40 md:pb-32 bg-[#f9f9f9]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="mb-8 max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono-custom text-[#686868] hover:text-[#181818] transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to home</span>
          </Link>
        </div>

        <SectionHeader
          badge="legal"
          title="Privacy Policy"
          description="Last updated: June 2026 · It explains how Verseo collects, uses, stores, and protects user data."
        />

        <div className="max-w-3xl mx-auto verseo-card p-8 md:p-12 bg-white shadow-sm space-y-8 text-sm sm:text-base text-[#404040] leading-relaxed">
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">1. Introduction</h3>
            <p>
              Welcome to Verseo ("we," "our," "us"). Your privacy is important to us. This Privacy Policy outlines how we collect, use, disclose, and protect your information when you visit our website and use our content automation services. By using Verseo, you agree to the terms outlined in this Privacy Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">2. Information We Collect</h3>
            <p>
              We collect both personal and non-personal information to improve our services and provide you with a seamless experience:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#505050]">
              <li>
                <strong>Personal Information:</strong> Name, email address, billing information, and any custom brand tone guidelines or inputs you submit.
              </li>
              <li>
                <strong>Non-Personal Information:</strong> Browser type, device telemetry, IP address, and anonymized aggregate usage logs.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">3. How We Use Your Information</h3>
            <p>We use collected data solely to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#505050]">
              <li>Provide, maintain, and enhance AI content generation workflows.</li>
              <li>Process transactions and send critical account notifications.</li>
              <li>Improve algorithmic relevance and prevent fraudulent or abusive usage.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">4. Data Protection & Security</h3>
            <p>
              We implement industry-standard encryption protocols and strict access controls. Your content inputs and proprietary brand voice files are never sold to third-party data brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">5. Contact Us</h3>
            <p>
              If you have any questions or requests regarding your data, please contact our privacy compliance team at{" "}
              <a href="mailto:verseo@gmail.com" className="text-[#006fff] underline font-medium">
                verseo@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
