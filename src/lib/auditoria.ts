import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | undefined;

// Criado apenas quando uma rota realmente usa o cliente, nunca durante o build.
export function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  // Chave de serviço ignora RLS; mantenha este cliente somente no servidor.
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

export async function registrarAuditoria(
  usuarioId: string,
  sistemaDestino: string,
  ipOrigem: string = 'unknown',
  userAgent: string = 'unknown'
) {
  try {
    const { error } = await getSupabaseAdmin().from('auditoria_acessos').insert({
      usuario_id: usuarioId,
      sistema_destino: sistemaDestino,
      ip_origem: ipOrigem,
      user_agent: userAgent
    });

    if (error) {
      console.error('Erro ao registrar log de auditoria:', error.message);
    }
  } catch (err) {
    console.error('Falha ao inserir auditoria:', err);
  }
}
