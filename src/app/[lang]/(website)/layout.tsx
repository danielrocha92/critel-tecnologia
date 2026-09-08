import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import FloatingActions from "@/components/FloatingActions/FloatingActions";
import { getDictionary } from "@/dictionaries";

export default async function WebsiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);

  return (
    <>
      <Header lang={resolvedParams.lang} dict={dict.nav} />
      <main style={{ paddingTop: "80px" }}>
        {children}
      </main>
      <Footer dict={dict.footer} lang={resolvedParams.lang} />
      <FloatingActions lang={resolvedParams.lang} />
    </>
  );
}
