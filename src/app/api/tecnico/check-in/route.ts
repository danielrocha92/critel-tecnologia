import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { ticket_id, latitude, longitude } = body;

    if (!ticket_id || !latitude || !longitude) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }

    const { error: ticketError } = await supabaseAdmin
      .from('tickets')
      .update({ 
        check_in_lat: latitude,
        check_in_lng: longitude,
        check_in_at: new Date().toISOString(),
        status: 'EM_ANDAMENTO'
      })
      .eq('id', ticket_id);

    if (ticketError) throw ticketError;

    return NextResponse.json({ success: true, check_in_at: new Date().toISOString() });
  } catch (error: any) {
    console.error('Erro no check-in:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
