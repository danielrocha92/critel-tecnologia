import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Critel Tecnologia | Infraestrutura de TI e Segurança",
  description: "Conectando Negócios. Protegendo o Futuro. Soluções corporativas em Infraestrutura de TI, Segurança Eletrônica, IoT e Outsourcing desde 1994.",
};

import FloatingActions from "@/components/FloatingActions/FloatingActions";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

import { getDictionary } from "@/dictionaries";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);

  return (
    <html lang={resolvedParams.lang} className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        <Header lang={resolvedParams.lang} dict={dict.nav} />
        <main style={{ paddingTop: '80px' }}>
          {children}
        </main>
        <Footer dict={dict.footer} lang={resolvedParams.lang} />
        <FloatingActions lang={resolvedParams.lang} />
      </body>
    </html>
  );
}
