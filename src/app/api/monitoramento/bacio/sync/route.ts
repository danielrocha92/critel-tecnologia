import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auditoria';
import stores from '@/data/bacio-stores.json';

export const dynamic = 'force-dynamic';

type IncomingPdv = {
  loja_codigo: string;
  pdv_codigo: string;
  pdv_nome: string;
  status_conexao: 'ONLINE' | 'OFFLINE';
  ultima_verificacao?: string;
};

function secretsMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const expectedSecret = process.env.MILVUS_SYNC_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Integração de monitoramento não configurada.' }, { status: 503 });
  }

  const authorization = request.headers.get('authorization') ?? '';
  const receivedSecret = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!receivedSecret || !secretsMatch(receivedSecret, expectedSecret)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const incomingPdvs = body && typeof body === 'object' && 'pdvs' in body ? body.pdvs : null;
  if (!Array.isArray(incomingPdvs) || incomingPdvs.length === 0 || incomingPdvs.length > 5000) {
    return NextResponse.json({ error: 'Envie entre 1 e 5.000 PDVs.' }, { status: 400 });
  }

  const knownStoreCodes = new Set((stores as { code: string; name: string }[]).map((store) => store.code));
  const receivedAt = new Date().toISOString();
  const rows = [];

  const seen = new Set<string>();
  for (const rawItem of incomingPdvs) {
    if (!rawItem || typeof rawItem !== 'object') {
      return NextResponse.json({ error: 'Um ou mais registros de PDV são inválidos.' }, { status: 400 });
    }
    const item = rawItem as IncomingPdv;
    if ((typeof item.loja_codigo !== 'string' && typeof item.loja_codigo !== 'number')
      || (typeof item.pdv_codigo !== 'string' && typeof item.pdv_codigo !== 'number')
      || typeof item.pdv_nome !== 'string') {
      return NextResponse.json({ error: 'Um ou mais registros de PDV são inválidos.' }, { status: 400 });
    }
    const code = String(item.loja_codigo ?? '').replace(/\D/g, '').padStart(4, '0');
    const pdvCode = String(item.pdv_codigo ?? '').trim();
    const pdvName = String(item.pdv_nome ?? '').trim();
    const status = item.status_conexao;
    const checkedAt = item.ultima_verificacao ? new Date(item.ultima_verificacao) : new Date(receivedAt);

    const terminalKey = `${code}:${pdvCode}`;
    if (!knownStoreCodes.has(code) || !pdvCode || !pdvName || pdvCode.length > 100 || pdvName.length > 150
      || (status !== 'ONLINE' && status !== 'OFFLINE') || Number.isNaN(checkedAt.getTime())
      || checkedAt.getTime() > Date.now() + 2 * 60_000 || seen.has(terminalKey)) {
      return NextResponse.json({ error: 'Um ou mais registros de PDV são inválidos.' }, { status: 400 });
    }
    seen.add(terminalKey);

    rows.push({
      loja_codigo: code,
      pdv_codigo: pdvCode,
      pdv_nome: pdvName,
      status_conexao: status,
      ultima_verificacao: checkedAt.toISOString(),
      atualizado_em: receivedAt,
    });
  }

  const { error } = await supabaseAdmin
    .from('bacio_pdv_status')
    .upsert(rows, { onConflict: 'loja_codigo,pdv_codigo' });

  if (error) {
    console.error('[Monitoramento Bacio] Falha ao persistir telemetria:', error.message);
    return NextResponse.json({ error: 'Não foi possível salvar a telemetria.' }, { status: 503 });
  }

  return NextResponse.json({ success: true, recebidos: rows.length }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
