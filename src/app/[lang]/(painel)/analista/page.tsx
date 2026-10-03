import type { Metadata } from 'next';
import DepartmentEnvironment from '@/components/Dashboard/DepartmentEnvironment';

export const metadata: Metadata = {
  title: 'Painel do Analista | Critel Core',
  description: 'Acompanhe solicitações e encaminhe atendimentos.',
};

export default function AnalistaPage() {
  return <DepartmentEnvironment department="analista" />;
}
