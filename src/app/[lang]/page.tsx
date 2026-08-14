import Hero from "@/components/Hero/Hero";
import TrustBadges from "@/components/TrustBadges/TrustBadges";
import Highlights from "@/components/Highlights/Highlights";
import Institutional from "@/components/Institutional/Institutional";
import Innovation from "@/components/Innovation/Innovation";
import Verticals from "@/components/Verticals/Verticals";
import SocialProof from "@/components/SocialProof/SocialProof";
import DiagnosticBanner from "@/components/DiagnosticBanner/DiagnosticBanner";
import ContactForm from "@/components/ContactForm/ContactForm";

import { getDictionary } from "@/dictionaries";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);

  return (
    <>
      <Hero dict={dict.hero} lang={resolvedParams.lang} />
      <TrustBadges dict={dict.trustBadges} />
      <Highlights dict={dict.highlights} />
      <Institutional dict={dict.institutional} />
      <Verticals dict={dict.verticals} lang={resolvedParams.lang} />
      <Innovation dict={dict.innovation} />
      <SocialProof dict={dict.socialProof} />
      <DiagnosticBanner dict={dict.diagnosticBanner} />
      <ContactForm dict={dict.contactForm} />
    </>
  );
}
