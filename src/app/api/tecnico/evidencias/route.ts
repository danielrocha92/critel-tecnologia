import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']);

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
    if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });

    const formData = await request.formData();
    const ticketId = formData.get('ticket_id');
    const type = formData.get('type');
    const file = formData.get('file');
    const requestedLanguage = formData.get('lang');
    const language = requestedLanguage === 'es' ? 'es' : 'pt';
    if (typeof ticketId !== 'string' || !ticketId || (type !== 'BEFORE' && type !== 'AFTER') || !(file instanceof File)) {
      return NextResponse.json({ error: 'Dados da evidência inválidos.' }, { status: 400 });
    }
    if (!ALLOWED_MEDIA_TYPES.has(file.type)) return NextResponse.json({ error: 'Envie uma imagem JPEG, PNG, WebP ou um vídeo MP4/WebM.' }, { status: 415 });
    if (!file.size || file.size > MAX_MEDIA_BYTES) return NextResponse.json({ error: 'O arquivo deve ter até 20 MB.' }, { status: 413 });

    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: profile, error: profileError } = await admin.from('perfis').select('id,cargo,status').eq('user_id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.cargo?.trim().toUpperCase().replace('É', 'E') !== 'TECNICO' || profile.status !== 'ATIVO') {
      return NextResponse.json({ error: 'Apenas técnicos ativos podem enviar evidências.' }, { status: 403 });
    }

    const { data: ticket, error: ticketError } = await admin.from('tickets').select('id,status,tecnico_id,protocolo_origem,cliente,titulo').eq('id', ticketId).like('protocolo_origem', 'OS-%').maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) return NextResponse.json({ error: 'Ordem de serviço não encontrada.' }, { status: 404 });
    if (ticket.status !== 'EM_ANDAMENTO') return NextResponse.json({ error: 'Só é possível enviar mídia enquanto o chamado está em andamento.' }, { status: 409 });
    if (ticket.tecnico_id !== user.id && ticket.tecnico_id !== profile.id) return NextResponse.json({ error: 'Esta ordem de serviço não está atribuída a você.' }, { status: 403 });

    const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || (file.type.startsWith('video/') ? 'mp4' : 'jpg');
    const objectPath = `evidences/${ticketId}/${type.toLowerCase()}_${Date.now()}_${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from('anexos').upload(objectPath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = admin.storage.from('anexos').getPublicUrl(objectPath);
    const { data: evidence, error: insertError } = await admin.from('ticket_evidences').insert({
      ticket_id: ticketId, type, media_url: publicUrl.publicUrl, caption: '', created_by: user.id,
    }).select('id,ticket_id,type,media_url,caption,created_by,created_at').single();
    if (insertError) {
      await admin.storage.from('anexos').remove([objectPath]);
      throw insertError;
    }

    const { data: profiles, error: profilesError } = await admin.from('perfis')
      .select('user_id,cargo').eq('status', 'ATIVO').not('user_id', 'is', null);
    if (profilesError) {
      console.error('A evidência foi salva, mas não foi possível buscar os destinatários das notificações:', profilesError.message);
    } else {
      const recipients = (profiles || []).filter((item) => {
        const role = item.cargo?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
        return ['ANALISTA', 'ADMIN', 'SUPER_ADMIN'].includes(role || '') && Boolean(item.user_id);
      });
      const notifications = recipients.map((recipient) => ({
        user_id: recipient.user_id,
        titulo: 'Nova evidência do técnico',
        mensagem: `O técnico enviou ${type === 'BEFORE' ? 'uma evidência do antes' : 'uma evidência do depois'} para #${ticket.protocolo_origem || ticket.id.slice(0, 8)} · ${ticket.cliente || 'Cliente'}${ticket.titulo ? ` · ${ticket.titulo}` : ''}`,
        tipo: 'evidencia_enviada',
        href: `/${language}/os/${ticket.id}`,
      }));
      if (notifications.length) {
        const { error: notificationError } = await admin.from('notificacoes').insert(notifications);
        if (notificationError) console.error('A evidência foi salva, mas não foi possível persistir as notificações:', notificationError.message);
      }
    }
    return NextResponse.json({ evidence }, { status: 201 });
  } catch (error) {
    console.error('Erro ao enviar evidência:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível enviar a mídia.' }, { status: 500 });
  }
}
