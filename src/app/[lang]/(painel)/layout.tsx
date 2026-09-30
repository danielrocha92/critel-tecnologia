import Sidebar from '@/components/Navigation/Sidebar';
import Topbar from '@/components/Navigation/Topbar';
import BackToTop from '@/components/Navigation/BackToTop';

import styles from './layout.module.css';

export default async function PainelLayout(
  props: { children: React.ReactNode; params: Promise<{ lang: string }> }
) {
  const params = await props.params;
  const lang = params.lang;

  return (
    <div className={`layout-root ${styles.layoutRoot}`}>
      <Sidebar lang={lang} />
      <div className={`main-content ${styles.mainContent}`}>
        <Topbar />
        <main className={styles.mainArea}>
          {props.children}
        </main>
      </div>
      <BackToTop />
    </div>
  );
}
