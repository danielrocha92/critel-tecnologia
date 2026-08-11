import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        <Header />
        <main style={{ paddingTop: '80px' }}>
          {children}
        </main>
        <Footer />
        <FloatingActions />
      </body>
    </html>
  );
}
