import { redirect } from 'next/navigation';

export default async function CertificationsRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  redirect(`/${resolvedParams.lang}/sobre/certificacoes-e-premios`);
}
