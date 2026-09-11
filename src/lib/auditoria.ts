import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Para operações seguras (auditoria e cofre), usamos a chave de serviço (Service Role)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Cliente admin ignora as políticas RLS para garantir a gravação e leitura pelo backend
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function registrarAuditoria(
  usuarioId: string,
  sistemaDestino: string,
  ipOrigem: string = 'unknown',
  userAgent: string = 'unknown'
) {
  try {
    const { error } = await supabaseAdmin.from('auditoria_acessos').insert({
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

export { supabaseAdmin };
