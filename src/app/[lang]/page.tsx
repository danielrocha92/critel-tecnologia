import type { Metadata } from "next";
import Hero from "@/components/Hero/Hero";
import TrustBadges from "@/components/TrustBadges/TrustBadges";
import Highlights from "@/components/Highlights/Highlights";
import Institutional from "@/components/Institutional/Institutional";
import Innovation from "@/components/Innovation/Innovation";
import Verticals from "@/components/Verticals/Verticals";
import SocialProof from "@/components/SocialProof/SocialProof";
import DiagnosticBanner from "@/components/DiagnosticBanner/DiagnosticBanner";
import ContactForm from "@/components/ContactForm/ContactForm";
import JsonLd, { getWebSiteSchema } from "@/components/JsonLd/JsonLd";
import { getDictionary } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const homeSeo = dict.seo?.home;

  const title = homeSeo?.title ?? "Critel Tecnologia | Infraestrutura de TI e Segurança Corporativa";
  const description =
    homeSeo?.description ??
    "Potencializamos o desempenho do seu negócio com soluções integradas de TI, segurança da informação, redes corporativas e cabeamento estruturado.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${resolvedParams.lang}`,
      languages: {
        "pt-BR": "/pt",
        "en-US": "/en",
        "es-ES": "/es",
        "x-default": "/pt",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://criteltecnologia.com.br/${resolvedParams.lang}`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);

  return (
    <>
      <JsonLd data={getWebSiteSchema(resolvedParams.lang)} />
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
