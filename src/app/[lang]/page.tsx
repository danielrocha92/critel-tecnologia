import Hero from "@/components/Hero/Hero";
import Highlights from "@/components/Highlights/Highlights";
import Institutional from "@/components/Institutional/Institutional";
import Innovation from "@/components/Innovation/Innovation";
import Verticals from "@/components/Verticals/Verticals";
import SocialProof from "@/components/SocialProof/SocialProof";
import ContactForm from "@/components/ContactForm/ContactForm";

import { getDictionary } from "@/dictionaries";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);

  return (
    <>
      <Hero dict={dict.hero} lang={resolvedParams.lang} />
      <Highlights dict={dict.highlights} />
      <Institutional dict={dict.institutional} />
      <Innovation dict={dict.innovation} />
      <Verticals dict={dict.verticals} lang={resolvedParams.lang} />
      <SocialProof dict={dict.socialProof} />
      <ContactForm dict={dict.contactForm} />
    </>
  );
}
