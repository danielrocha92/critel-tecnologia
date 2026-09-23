import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { nome, email, senha, cargo } = await req.json();

    if (!nome || !email || !senha || !cargo) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS to create user
    );

    // 1. Criar o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, cargo }
    });

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Atualizar ou inserir na tabela perfis
    const { error: perfilError } = await supabase
      .from('perfis')
      .upsert({
        user_id: userId,
        nome,
        email,
        cargo,
        status: 'ATIVO'
      });

    if (perfilError) {
      console.error('Erro ao inserir perfil:', perfilError);
      return NextResponse.json({ error: perfilError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro na API de criar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
