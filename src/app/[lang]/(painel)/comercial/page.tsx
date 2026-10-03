import type { Metadata } from 'next';
import DepartmentEnvironment from '@/components/Dashboard/DepartmentEnvironment';

export const metadata: Metadata = {
  title: 'Painel Comercial | Critel Core',
  description: 'Consulte os cadastros comerciais das lojas.',
};

export default function ComercialPage() {
  return <DepartmentEnvironment department="comercial" />;
}
