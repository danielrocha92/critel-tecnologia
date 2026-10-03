import { redirect } from 'next/navigation';

export default async function AllTicketsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/atendimento?filter=todos&meus=false`);
}
