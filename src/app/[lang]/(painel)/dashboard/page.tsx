import type { Metadata } from 'next';
import DashboardHome from '@/components/Dashboard/DashboardHome';

export const metadata: Metadata = {
  title: 'Início | Critel Core',
  description: 'Resumo operacional e atalhos para os ambientes Critel.',
};

export default function DashboardPage() {
  return <DashboardHome />;
}
