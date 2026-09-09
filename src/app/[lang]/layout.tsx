import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "../globals.css";
import JsonLd, { getOrganizationSchema } from "@/components/JsonLd/JsonLd";
import { getDictionary } from "@/dictionaries";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const seo = dict.seo ?? {
    siteName: "Critel Tecnologia",
    defaultTitle: "Critel Tecnologia | Infraestrutura de TI e Segurança",
    defaultDescription: "Conectando Negócios. Protegendo o Futuro. Soluções corporativas em Infraestrutura de TI, Segurança Eletrônica, IoT e Outsourcing desde 1994.",
    keywords: [],
  };

  const locale = resolvedParams.lang;
  const ogLocale = locale === "pt" ? "pt_BR" : locale === "en" ? "en_US" : "es_ES";

  return {
    metadataBase: new URL("https://criteltecnologia.com.br"),
    title: {
      default: seo.defaultTitle,
      template: "%s | Critel Tecnologia",
    },
    description: seo.defaultDescription,
    keywords: seo.keywords,
    authors: [{ name: "Critel Tecnologia", url: "https://criteltecnologia.com.br" }],
    creator: "Critel Tecnologia",
    publisher: "Critel Tecnologia",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        "pt-BR": "/pt",
        "en-US": "/en",
        "es-ES": "/es",
        "x-default": "/pt",
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      alternateLocale: ["pt_BR", "en_US", "es_ES"].filter((l) => l !== ogLocale),
      url: `https://criteltecnologia.com.br/${locale}`,
      siteName: seo.siteName,
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      images: [
        {
          url: "/400PngdpiLogoCropped.png",
          width: 1200,
          height: 630,
          alt: "Critel Tecnologia - Soluções em Infraestrutura de TI e Segurança",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      images: ["/400PngdpiLogoCropped.png"],
      creator: "@criteltecnologia",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/FaviconLogo.png", sizes: "32x32", type: "image/png" },
        { url: "/FaviconLogo.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/FaviconLogo.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: any;
}>) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);

  return (
    <html lang={resolvedParams.lang} className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <JsonLd data={getOrganizationSchema()} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved) {
                    document.documentElement.setAttribute('data-theme', saved);
                  } else {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
