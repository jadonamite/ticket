"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { Mail, Send, CheckCircle2, MessageSquare, ArrowRight } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full pt-32 pb-24 md:pt-40 md:pb-32 bg-[#f9f9f9]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <SectionHeader
          badge="contact"
          title="Contact Us"
          description="Have a question, want to see Verseo in action, or need help choosing the right workflow? Send us a note and we’ll get back to you soon."
        />

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="verseo-card p-8 bg-white shadow-sm space-y-6">
              <div>
                <span className="badge-pill mb-3">
                  <span>[</span>
                  <span className="text-[#181818]">get in touch</span>
                  <span>]</span>
                </span>
                <h3 className="text-2xl font-bold text-[#181818] mb-2">
                  Tell us what you’re building
                </h3>
                <p className="text-sm text-[#686868] leading-relaxed">
                  Share a few details and the Verseo team will point you toward the fastest way to create, refine, and publish better content.
                </p>
              </div>

              <div className="pt-4 border-t border-[#ededed] space-y-2">
                <span className="text-xs font-mono-custom text-[#858585] block">
                  [ contact us through e-mail ]
                </span>
                <a
                  href="mailto:verseo@gmail.com"
                  className="text-base font-semibold text-[#181818] hover:text-[#006fff] transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-[#006fff]" />
                  <span>verseo@gmail.com</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#ededed]">
                <span className="text-xs font-mono-custom text-[#858585] block mb-2">
                  Response Time
                </span>
                <p className="text-xs text-[#181818] font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  Average reply time: under 2 hours (Mon–Fri)
                </p>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="verseo-card p-8 md:p-10 bg-white shadow-sm">
              {submitted ? (
                <div className="text-center py-12 space-y-4 animate-in fade-in duration-300">
                  <div className="w-14 h-14 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#181818]">Message Sent!</h3>
                  <p className="text-sm text-[#686868] max-w-md mx-auto">
                    Thank you for reaching out, {formData.name}. Our team has received your message and will respond to {formData.email} shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", subject: "", message: "" });
                    }}
                    className="btn-secondary text-xs px-6 py-2.5 mt-4"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#181818] mb-1.5 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full text-sm px-4 py-3 rounded-xl bg-[#f6f6f6] border border-[#ededed] focus:border-[#181818] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#181818] mb-1.5 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-sm px-4 py-3 rounded-xl bg-[#f6f6f6] border border-[#ededed] focus:border-[#181818] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1.5 uppercase tracking-wider">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Product question, custom enterprise plan, demo request..."
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full text-sm px-4 py-3 rounded-xl bg-[#f6f6f6] border border-[#ededed] focus:border-[#181818] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1.5 uppercase tracking-wider">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Tell us about your team and content goals..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full text-sm p-4 rounded-xl bg-[#f6f6f6] border border-[#ededed] focus:border-[#181818] focus:bg-white focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <span>Submit Message</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
