import Sidebar from '@/components/Navigation/Sidebar';
import Topbar from '@/components/Navigation/Topbar';

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
        }
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            width: 100%;
            padding-bottom: 70px; /* Espaço para a bottom bar */
          }
          .topbar-header {
            padding: 0 1rem !important;
          }
          .topbar-user-text {
            display: none !important;
          }
        }
      `}} />
      <Sidebar lang={lang} />
      <div className="main-content">
        <Topbar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {props.children}
        </main>
      </div>
    </div>
  );
}
