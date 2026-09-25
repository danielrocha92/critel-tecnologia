import { redirect } from 'next/navigation';

export default async function TecnicoIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang || 'pt'}/tecnico/os`);
}
