import React from "react";
import { Hero } from "@/components/Hero";
import { LogosMarquee } from "@/components/LogosMarquee";
import { Difference } from "@/components/Difference";
import { FeaturesBento } from "@/components/FeaturesBento";
import { UseCases } from "@/components/UseCases";
import { HowItWorks } from "@/components/HowItWorks";
import { Results } from "@/components/Results";
import { Examples } from "@/components/Examples";
import { Integrations } from "@/components/Integrations";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { CTABanner } from "@/components/CTABanner";

export default function Home() {
  return (
    <div className="w-full flex flex-col">
      <Hero />
      <LogosMarquee />
      <Difference />
      <FeaturesBento />
      <UseCases />
      <HowItWorks />
      <Results />
      <Examples />
      <Integrations />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTABanner />
    </div>
  );
}
