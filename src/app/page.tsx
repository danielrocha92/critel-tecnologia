import Hero from "@/components/Hero/Hero";
import Highlights from "@/components/Highlights/Highlights";
import Institutional from "@/components/Institutional/Institutional";
import Innovation from "@/components/Innovation/Innovation";
import Verticals from "@/components/Verticals/Verticals";
import SocialProof from "@/components/SocialProof/SocialProof";
import ContactForm from "@/components/ContactForm/ContactForm";

export default function Home() {
  return (
    <>
      <Hero />
      <Highlights />
      <Institutional />
      <Innovation />
      <Verticals />
      <SocialProof />
      <ContactForm />
    </>
  );
}
