import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });
    }

    const supabaseAuth = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          },
        },
      }
    );
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfis')
      .select('cargo, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const cargo = perfil?.cargo?.trim().toUpperCase().replace('É', 'E');
    if (perfilError || !perfil || cargo !== 'TECNICO' || perfil.status !== 'ATIVO') {
      return NextResponse.json({ error: 'Apenas técnicos ativos podem registrar o check-in.' }, { status: 403 });
    }

    const body = await request.json();
    const { ticket_id, latitude, longitude } = body;

    if (
      typeof ticket_id !== 'string' ||
      !ticket_id.trim() ||
      typeof latitude !== 'number' ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== 'number' ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json({ error: 'Identificador da OS ou coordenadas inválidas.' }, { status: 400 });
    }

    const { data: ticket, error: ticketLookupError } = await supabaseAdmin
      .from('tickets')
      .select('id, tecnico_id, analista_id, check_in_at')
      .eq('id', ticket_id)
      .like('protocolo_origem', 'OS-%')
      .maybeSingle();

    if (ticketLookupError) throw ticketLookupError;
    if (!ticket) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada.' }, { status: 404 });
    }
    if (ticket.tecnico_id !== user.id && ticket.analista_id !== user.id) {
      return NextResponse.json({ error: 'Esta ordem de serviço não está atribuída a você.' }, { status: 403 });
    }
    if (ticket.check_in_at) {
      return NextResponse.json({ success: true, check_in_at: ticket.check_in_at });
    }

    const checkInAt = new Date().toISOString();
    const { data: updatedTicket, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        check_in_lat: latitude,
        check_in_lng: longitude,
        check_in_at: checkInAt,
        status: 'EM_ANDAMENTO'
      })
      .eq('id', ticket_id)
      .select('id')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedTicket) {
      return NextResponse.json({ error: 'Não foi possível atualizar a ordem de serviço.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, check_in_at: checkInAt });
  } catch (error: any) {
    console.error('Erro no check-in:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
