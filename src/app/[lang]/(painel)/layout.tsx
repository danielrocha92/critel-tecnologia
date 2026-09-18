import Sidebar from '@/components/Navigation/Sidebar';
import Topbar from '@/components/Navigation/Topbar';
import { TelephonyProvider } from '@/contexts/TelephonyContext';
import TelephonyWidget from '@/components/Telephony/TelephonyWidget';
import BackToTop from '@/components/Navigation/BackToTop';

export default async function PainelLayout(
  props: { children: React.ReactNode; params: Promise<{ lang: string }> }
) {
  const params = await props.params;
  const lang = params.lang;

  return (
    <div className="layout-root" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0b1120 0%, #162032 50%, #0f172a 100%)',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        .main-content {
          margin-left: 250px;
          flex: 1;
          display: flex;
          flex-direction: column;
          width: calc(100% - 250px);
          transition: margin-left 0.3s ease, width 0.3s ease;
        }
        .layout-root.sidebar-collapsed .main-content {
          margin-left: 70px;
          width: calc(100% - 70px);
        }
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            width: 100%;
          }
          .topbar-header {
            padding: 0 1rem !important;
          }
          .topbar-user-text {
            display: none !important;
          }
        }
      `}} />
      <TelephonyProvider>
        <Sidebar lang={lang} />
        <div className="main-content">
          <Topbar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {props.children}
          </main>
        </div>
        <TelephonyWidget />
        <BackToTop />
      </TelephonyProvider>
    </div>
  );
}
