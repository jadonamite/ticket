import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ticket — Confidential Prize-Linked Savings",
  description:
    "A prize pool that cannot see your money and still cannot be gamed. Confidential time-weighted odds with a publicly verifiable draw, built on Zama's FHEVM.",
  icons: {
    icon: "/ticket.png",
    apple: "/ticket.png",
  },
  openGraph: {
    title: "Ticket — Confidential Prize-Linked Savings",
    description:
      "A prize pool that cannot see your money and still cannot be gamed. Confidential time-weighted odds with a publicly verifiable draw, built on Zama's FHEVM.",
    images: ["/images/ticket-card-clean.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased selection:bg-[#181818] selection:text-white">
        <Navbar />
        <main className="min-h-screen relative flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
