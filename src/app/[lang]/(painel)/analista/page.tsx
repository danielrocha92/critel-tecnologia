import type { Metadata } from 'next';
import DepartmentEnvironment from '@/components/Dashboard/DepartmentEnvironment';

export const metadata: Metadata = {
  title: 'Painel do Analista | Critel Core',
  description: 'Acompanhe solicitações e encaminhe atendimentos.',
};

export default async function AnalistaPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const { novo } = await searchParams;
  const openCreateTicket = novo === '1';

  return (
    <DepartmentEnvironment
      key={openCreateTicket ? 'novo-chamado' : 'painel-analista'}
      department="analista"
      openCreateTicket={openCreateTicket}
    />
  );
}
