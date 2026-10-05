import { redirect } from 'next/navigation';

export default async function MyTicketsPage({
  params,
}: {
  params: Promise<{ lang: string; filter: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/analista`);
}
