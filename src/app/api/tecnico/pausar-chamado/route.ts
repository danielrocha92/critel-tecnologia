import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isPauseReasonCode } from '@/lib/tickets/pauseReasons';

const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  let evidencePath = '';
  let createdPauseId = '';
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
    if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });

    const form = await request.formData();
    const ticketId = form.get('ticket_id');
    const reasonCode = form.get('reason_code');
    const contactName = form.get('contact_name');
    const contactRole = form.get('contact_role');
    const expectedReturnAt = form.get('expected_return_at');
    const description = form.get('description');
    const requestedLang = form.get('lang');
    const lang = typeof requestedLang === 'string' && ['pt', 'en', 'es'].includes(requestedLang) ? requestedLang : 'pt';
    const file = form.get('evidence');
    const latValue = form.get('latitude');
    const lonValue = form.get('longitude');
    const latitude = typeof latValue === 'string' ? Number(latValue) : NaN;
    const longitude = typeof lonValue === 'string' ? Number(lonValue) : NaN;

    if (typeof ticketId !== 'string' || !ticketId || !isPauseReasonCode(reasonCode)
      || typeof contactName !== 'string' || contactName.trim().length < 2
      || typeof contactRole !== 'string' || contactRole.trim().length < 2
      || typeof expectedReturnAt !== 'string' || !Number.isFinite(Date.parse(expectedReturnAt))
      || !(file instanceof File) || !IMAGE_TYPES.has(file.type) || !file.size || file.size > MAX_EVIDENCE_BYTES
      || (description !== null && typeof description !== 'string')) {
      return NextResponse.json({ error: 'Preencha o motivo, o contato responsável, a previsão de retorno e anexe uma foto JPEG, PNG ou WebP de até 10 MB.' }, { status: 400 });
    }
    if (Date.parse(expectedReturnAt) <= Date.now()) return NextResponse.json({ error: 'A previsão de retorno deve estar no futuro.' }, { status: 400 });
    if (reasonCode === 'COMPRA_MATERIAL' && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      return NextResponse.json({ error: 'Ative a localização do dispositivo para registrar o início do trajeto da compra.' }, { status: 400 });
    }

    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: profile, error: profileError } = await admin.from('perfis')
      .select('id,cargo,status,nome').eq('user_id', user.id).maybeSingle();
    const role = profile?.cargo?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
    if (profileError) throw profileError;
    if (!profile || role !== 'TECNICO' || profile.status !== 'ATIVO') return NextResponse.json({ error: 'Apenas técnicos ativos podem pausar chamados.' }, { status: 403 });

    const { data: ticket, error: ticketError } = await admin.from('tickets')
      .select('id,status,tecnico_id,protocolo_origem,cliente,titulo')
      .eq('id', ticketId).like('protocolo_origem', 'OS-%').maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) return NextResponse.json({ error: 'Ordem de serviço não encontrada.' }, { status: 404 });
    if (ticket.status !== 'EM_ANDAMENTO') return NextResponse.json({ error: 'Só é possível pausar um chamado em andamento.' }, { status: 409 });
    if (ticket.tecnico_id !== user.id && ticket.tecnico_id !== profile.id) return NextResponse.json({ error: 'Esta ordem de serviço não está atribuída a você.' }, { status: 403 });

    const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    evidencePath = `evidences/${ticketId}/pause_${Date.now()}_${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from('anexos').upload(evidencePath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = admin.storage.from('anexos').getPublicUrl(evidencePath);

    const { data: pause, error: pauseError } = await admin.from('ticket_pauses').insert({
      ticket_id: ticketId,
      technician_id: profile.id,
      reason_code: reasonCode,
      description: typeof description === 'string' ? description.trim().slice(0, 1000) || null : null,
      contact_name: contactName.trim().slice(0, 150),
      contact_role: contactRole.trim().slice(0, 100),
      expected_return_at: new Date(expectedReturnAt).toISOString(),
      evidence_url: publicUrl.publicUrl,
    }).select('*').single();
    if (pauseError) throw pauseError;
    createdPauseId = pause.id;

    if (reasonCode === 'COMPRA_MATERIAL') {
      const { error: locationError } = await admin.from('ticket_pause_locations').insert({ pause_id: pause.id, latitude, longitude });
      if (locationError) throw locationError;
    }

    const { data: updatedTicket, error: updateError } = await admin.from('tickets')
      .update({ status: 'PAUSADO', pausa_atual_id: pause.id, atualizado_em: new Date().toISOString() })
      .eq('id', ticketId).eq('status', 'EM_ANDAMENTO').is('pausa_atual_id', null)
      .select('id').maybeSingle();
    if (updateError) throw updateError;
    if (!updatedTicket) throw new Error('O status do chamado foi alterado. Atualize a tela e tente novamente.');

    const { error: transitionError } = await admin.from('ticket_transitions').insert({
      ticket_id: ticketId, from_status: 'EM_ANDAMENTO', to_status: 'PAUSADO', changed_by: user.id,
      reason: `Pausa: ${reasonCode} · Responsável: ${contactName.trim()} (${contactRole.trim()})`,
    });
    if (transitionError) console.error('Não foi possível registrar a transição da pausa:', transitionError.message);

    const { data: profiles } = await admin.from('perfis').select('user_id,cargo').eq('status', 'ATIVO').not('user_id', 'is', null);
    const recipients = (profiles || []).filter((item) => {
      const recipientRole = item.cargo?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
      return ['ANALISTA', 'ADMIN', 'SUPER_ADMIN'].includes(recipientRole || '') && Boolean(item.user_id);
    });
    if (recipients.length) {
      const { error: notificationError } = await admin.from('notificacoes').insert(recipients.map((recipient) => ({
        user_id: recipient.user_id,
        titulo: 'Chamado pausado pelo técnico',
        mensagem: `#${ticket.protocolo_origem || ticket.id.slice(0, 8)} · ${ticket.cliente || 'Cliente'} · Motivo: ${reasonCode}`,
        tipo: 'sistema',
        href: `/${lang}/os/${ticket.id}`,
      })));
      if (notificationError) console.error('Não foi possível notificar os analistas sobre a pausa:', notificationError.message);
    }

    return NextResponse.json({ success: true, pause }, { status: 201 });
  } catch (error) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceRoleKey) {
      const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
      if (createdPauseId) await admin.from('ticket_pauses').delete().eq('id', createdPauseId);
      if (evidencePath) await admin.storage.from('anexos').remove([evidencePath]);
    }
    console.error('Erro ao pausar chamado:', error);
    const message = error instanceof Error ? error.message : 'Não foi possível pausar o chamado.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
