import { redirect } from 'next/navigation';

export default async function MyTicketsPage({
  params,
}: {
  params: Promise<{ lang: string; filter: string }>;
}) {
  const { lang, filter } = await params;
  const activeFilter = filter === 'opened'
    ? 'abertos'
    : filter === 'closed'
      ? 'finalizados'
      : 'todos';

  redirect(`/${lang}/atendimento?filter=${activeFilter}&meus=true`);
}
