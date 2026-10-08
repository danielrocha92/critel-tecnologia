import type { Metadata } from 'next';
import BacioMonitoringDashboard from '@/components/BacioMonitoring/BacioMonitoringDashboard';

export const metadata: Metadata = {
  title: 'Monitoramento Bacio | Critel Core',
  description: 'Acompanhe o status de conexão dos PDVs das lojas Bacio di Latte.',
};

export default function BacioMonitoringPage() {
  return <BacioMonitoringDashboard />;
}
