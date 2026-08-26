import React from "react";
import { SectionHeader } from "@/components/SectionHeader";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
          title="Terms of Service"
          description="Last updated: June 2026 · It outlines the rules, responsibilities, and expectations between Verseo and users."
        />

        <div className="max-w-3xl mx-auto verseo-card p-8 md:p-12 bg-white shadow-sm space-y-8 text-sm sm:text-base text-[#404040] leading-relaxed">
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">1. Introduction</h3>
            <p>
              Welcome to Verseo ("we," "our," "us"). By accessing and using our website and services, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">2. Services & Content Ownership</h3>
            <p>
              We provide AI-powered content automation tools, templates, and workflow integrations. You retain 100% full intellectual property ownership of all original text prompts and final content generated through your account.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">3. User Responsibilities</h3>
            <p>By using Verseo, you agree that you will not:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#505050]">
              <li>Use the platform for any illegal, defamatory, or fraudulent purposes.</li>
              <li>Attempt to reverse-engineer, disrupt, or bypass rate limits on our infrastructure.</li>
              <li>Infringe upon the intellectual property or privacy rights of any third party.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">4. Subscriptions & Cancellations</h3>
            <p>
              Paid subscription tiers (Starter, Pro, Team) are billed in advance on a recurring monthly or annual basis. You may cancel your subscription at any time via your account settings with zero hidden penalty fees.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-[#181818]">5. Limitation of Liability</h3>
            <p>
              Verseo provides AI generation tools on an "as is" basis. While we strive for extreme accuracy, users are encouraged to review critical legal or medical copy prior to formal public distribution.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
