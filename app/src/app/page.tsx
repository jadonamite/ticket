import React from "react";
import { Hero } from "@/components/Hero";
import { Difference } from "@/components/Difference";
import { FeaturesBento } from "@/components/FeaturesBento";
import { UseCases } from "@/components/UseCases";
import { HowItWorks } from "@/components/HowItWorks";
import { Results } from "@/components/Results";
import { FAQ } from "@/components/FAQ";
import { CTABanner } from "@/components/CTABanner";

export default function Home() {
  return (
    <div className="w-full flex flex-col">
      <Hero />
      <Difference />
      <FeaturesBento />
      <UseCases />
      <HowItWorks />
      <Results />
      <FAQ />
      <CTABanner />
    </div>
  );
}
