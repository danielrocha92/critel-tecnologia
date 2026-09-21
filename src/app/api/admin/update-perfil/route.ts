import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { id, cargo, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID do perfil é obrigatório' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS to update sensitive user fields
    );

    const updates: any = {};
    if (cargo) updates.cargo = cargo;
    if (status) updates.status = status;

    const { error } = await supabase
      .from('perfis')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Erro no Supabase ao atualizar perfil:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro na API de atualizar perfil:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
