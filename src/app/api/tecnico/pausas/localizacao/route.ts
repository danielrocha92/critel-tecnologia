import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const deltaLat = radians(lat2 - lat1);
  const deltaLon = radians(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceRoleKey) return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });

    const cookieStore = await cookies();
    const session = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options })),
      },
    });
    const { data: { user }, error: authError } = await session.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 });

    const body = await request.json();
    const ticketId = body.ticket_id;
    const pauseId = body.pause_id;
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    if (typeof ticketId !== 'string' || typeof pauseId !== 'string'
      || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: 'Coordenadas ou chamado inválidos.' }, { status: 400 });
    }

    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: profile, error: profileError } = await admin.from('perfis').select('id,cargo,status').eq('user_id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'ATIVO' || profile.cargo?.trim().toUpperCase() !== 'TECNICO') {
      return NextResponse.json({ error: 'Apenas técnicos ativos podem registrar o trajeto.' }, { status: 403 });
    }

    const { data: ticket, error: ticketError } = await admin.from('tickets').select('id,status,tecnico_id,pausa_atual_id')
      .eq('id', ticketId).maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket || ticket.status !== 'PAUSADO' || ticket.pausa_atual_id !== pauseId
      || (ticket.tecnico_id !== user.id && ticket.tecnico_id !== profile.id)) {
      return NextResponse.json({ error: 'O chamado não está mais pausado para este técnico.' }, { status: 409 });
    }

    const { data: pause, error: pauseError } = await admin.from('ticket_pauses').select('id,reason_code,resumed_at')
      .eq('id', pauseId).eq('ticket_id', ticketId).maybeSingle();
    if (pauseError) throw pauseError;
    if (!pause || pause.reason_code !== 'COMPRA_MATERIAL' || pause.resumed_at) {
      return NextResponse.json({ error: 'O rastreamento não está ativo para esta pausa.' }, { status: 409 });
    }

    const { data: lastPoint, error: pointError } = await admin.from('ticket_pause_locations')
      .select('latitude,longitude,recorded_at').eq('pause_id', pauseId)
      .order('recorded_at', { ascending: false }).limit(1).maybeSingle();
    if (pointError) throw pointError;
    if (lastPoint) {
      const secondsSinceLast = (Date.now() - new Date(lastPoint.recorded_at).getTime()) / 1000;
      if (secondsSinceLast < 45 && distanceMeters(lastPoint.latitude, lastPoint.longitude, latitude, longitude) < 15) {
        return NextResponse.json({ success: true, skipped: true });
      }
    }

    const { error: insertError } = await admin.from('ticket_pause_locations').insert({ pause_id: pauseId, latitude, longitude });
    if (insertError) throw insertError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar localização da pausa:', error);
    return NextResponse.json({ error: 'Não foi possível registrar o trajeto.' }, { status: 500 });
  }
}
