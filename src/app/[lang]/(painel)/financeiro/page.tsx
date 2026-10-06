import type { Metadata } from 'next';
import FinancialOSDashboard from '@/components/FinancialOSDashboard/FinancialOSDashboard';

export const metadata: Metadata = {
  title: 'Painel Financeiro | Critel Core',
  description: 'Acompanhe lançamentos financeiros e despesas de ordens de serviço.',
};

export default function FinanceiroPage() {
  return <FinancialOSDashboard />;
}
