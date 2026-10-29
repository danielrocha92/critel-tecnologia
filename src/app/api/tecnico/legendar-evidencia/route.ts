import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });
    }
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'A geração de legendas não está configurada no servidor (GEMINI_API_KEY).' }, { status: 503 });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options })),
      },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });

    const body = await request.json();
    const ticketId = typeof body.ticket_id === 'string' ? body.ticket_id : '';
    const imageUrl = typeof body.image_url === 'string' ? body.image_url : '';
    if (!ticketId || !imageUrl) {
      return NextResponse.json({ error: 'Chamado ou imagem inválidos.' }, { status: 400 });
    }
    const image = new URL(imageUrl);
    const expectedOrigin = new URL(supabaseUrl);
    const expectedPath = `/storage/v1/object/public/anexos/evidences/${ticketId}/`;
    if (image.origin !== expectedOrigin.origin || !image.pathname.startsWith(expectedPath)) {
      return NextResponse.json({ error: 'Chamado ou imagem inválidos.' }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: ticket, error: ticketError } = await admin
      .from('tickets')
      .select('id, tecnico_id, protocolo_origem')
      .eq('id', ticketId)
      .like('protocolo_origem', 'OS-%')
      .maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) return NextResponse.json({ error: 'Ordem de serviço não encontrada.' }, { status: 404 });

    const { data: profile } = await admin.from('perfis').select('id').eq('user_id', user.id).maybeSingle();
    if (ticket.tecnico_id !== user.id && ticket.tecnico_id !== profile?.id) {
      return NextResponse.json({ error: 'Esta ordem de serviço não está atribuída a você.' }, { status: 403 });
    }

    const imageResponse = await fetch(image, { signal: AbortSignal.timeout(15000) });
    if (!imageResponse.ok) throw new Error('Não foi possível ler a imagem enviada.');
    const contentType = imageResponse.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || '';
    const contentLength = Number(imageResponse.headers.get('content-length') || 0);
    if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
      return NextResponse.json({ error: 'Use uma imagem JPEG, PNG ou WebP para gerar a legenda.' }, { status: 415 });
    }
    if (contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 8 MB para gerar a legenda.' }, { status: 413 });
    }
    const imageBytes = await imageResponse.arrayBuffer();
    if (imageBytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 8 MB para gerar a legenda.' }, { status: 413 });
    }
    const imageBase64 = Buffer.from(imageBytes).toString('base64');

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
        body: JSON.stringify({
          contents: [{ parts: [
            { inline_data: { mime_type: contentType, data: imageBase64 } },
            { text: 'Descreva em português brasileiro o objeto ou conteúdo principal visível na foto, em uma legenda curta de até 8 palavras. Seja objetivo, como "Modem preto com cabos conectados". Não invente marca, modelo ou detalhes que não sejam visíveis. Retorne somente a legenda.' },
          ] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 60 },
        }),
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!geminiResponse.ok) {
      console.error('Gemini não gerou a legenda:', geminiResponse.status, await geminiResponse.text());
      return NextResponse.json({ error: 'Não foi possível gerar a legenda da foto. Tente novamente.' }, { status: 502 });
    }

    const result = await geminiResponse.json();
    const caption = result.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join(' ')
      .trim()
      .replace(/^['"“”]+|['"“”]+$/g, '');
    if (!caption) return NextResponse.json({ error: 'A IA não retornou uma legenda. Tente novamente.' }, { status: 502 });

    return NextResponse.json({ caption });
  } catch (error) {
    console.error('Erro ao gerar legenda da evidência:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao gerar a legenda.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
