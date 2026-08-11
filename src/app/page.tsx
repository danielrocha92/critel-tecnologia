import Header from "@/components/Header/Header";
import Hero from "@/components/Hero/Hero";
import SocialProof from "@/components/SocialProof/SocialProof";
import Verticals from "@/components/Verticals/Verticals";
import Innovation from "@/components/Innovation/Innovation";
import Institutional from "@/components/Institutional/Institutional";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '80px' }}>
        <Hero />
        <Institutional />
        <Verticals />
        <Innovation />
        <SocialProof />
        <Footer />
      </main>
    </>
  );
}
