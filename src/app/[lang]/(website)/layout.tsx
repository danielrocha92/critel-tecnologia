import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import FloatingActions from "@/components/FloatingActions/FloatingActions";
import { getDictionary } from "@/dictionaries";

import styles from './layout.module.css';

export default async function WebsiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);

  return (
    <>
      <Header lang={resolvedParams.lang} dict={dict.nav} />
      <main className={styles.mainContent}>
        {children}
      </main>
      <Footer dict={dict.footer} lang={resolvedParams.lang} />
      <FloatingActions lang={resolvedParams.lang} />
    </>
  );
}
