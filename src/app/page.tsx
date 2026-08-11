import Header from "@/components/Header/Header";
import Hero from "@/components/Hero/Hero";
import PainPoints from "@/components/PainPoints/PainPoints";
import Institutional from "@/components/Institutional/Institutional";
import Innovation from "@/components/Innovation/Innovation";
import Verticals from "@/components/Verticals/Verticals";
import SocialProof from "@/components/SocialProof/SocialProof";
import ContactForm from "@/components/ContactForm/ContactForm";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '80px' }}>
        <Hero />
        <PainPoints />
        <SocialProof />
        <Institutional />
        <Innovation />
        <Verticals />
        <ContactForm />
        <Footer />
      </main>
    </>
  );
}
