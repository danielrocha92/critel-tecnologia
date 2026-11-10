import type { Metadata } from 'next';
import FinancialApprovalDashboard from '@/components/FinancialOSDashboard/FinancialApprovalDashboard';

export const metadata: Metadata = {
  title: 'Painel Financeiro | Critel Core',
  description: 'Valide ordens de serviço encerradas pelos técnicos antes de fechar e liberar os valores.',
};

export default function FinanceiroPage() {
  return <FinancialApprovalDashboard />;
}
