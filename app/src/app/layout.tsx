import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://verseo.framer.website"),
  title: "Verseo — AI Content Automation Template",
  description:
    "Launch an AI content product with Verseo's responsive template, polished SaaS sections, pricing, FAQs, testimonials, and conversion-focused flows.",
  icons: {
    icon: "/assets/gfU0zl40eLBy2f2kX2SqrhRTJo.png",
    apple: "/assets/3pSh1y7X2G2xmxxSUI8NYkfEw.png",
  },
  openGraph: {
    title: "Verseo — AI Content Automation Template",
    description:
      "Launch an AI content product with Verseo's responsive template, polished SaaS sections, pricing, FAQs, testimonials, and conversion-focused flows.",
    images: ["/assets/s4TGxHu3fH1hhw07KzybjAI6GFc.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased selection:bg-[#181818] selection:text-white">
        <Navbar />
        <main className="min-h-screen relative flex flex-col">
          {/* Vertical Side Guide Lines for 1400px Container */}
          <div className="grid-line-left hidden lg:block" />
          <div className="grid-line-right hidden lg:block" />
          
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
