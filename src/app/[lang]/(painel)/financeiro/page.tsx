import type { Metadata } from 'next';
import FinancialApprovalDashboard from '@/components/FinancialOSDashboard/FinancialApprovalDashboard';

export const metadata: Metadata = {
  title: 'Painel Financeiro | Critel Core',
  description: 'Revise e aprove os valores de ordens de serviço finalizadas.',
};

export default function FinanceiroPage() {
  return <FinancialApprovalDashboard />;
}
