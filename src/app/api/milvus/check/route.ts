import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    error: 'Consulta aleatória desativada. Use a integração autenticada /api/monitoramento/bacio/sync.',
  }, { status: 410 });
}
