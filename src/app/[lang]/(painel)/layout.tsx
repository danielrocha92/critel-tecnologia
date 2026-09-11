import Sidebar from '@/components/Navigation/Sidebar';
import Topbar from '@/components/Navigation/Topbar';

export default async function PainelLayout(
  props: { children: React.ReactNode; params: Promise<{ lang: string }> }
) {
  const params = await props.params;
  const lang = params.lang;

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0b1120 0%, #162032 50%, #0f172a 100%)',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <Sidebar lang={lang} />
      <div style={{ marginLeft: '250px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {props.children}
        </main>
      </div>
    </div>
  );
}
