import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { abrirChamado } from '@/lib/firebase/ticket-service';
import { isFirebaseConfigured, storage } from '@/utils/firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type TicketPayload = {
  title: string;
  description: string;
  department: string;
  category: string;
  priority: string;
};

function parseTicketPayload(value: unknown): TicketPayload | null {
  if (!value || typeof value !== 'object') return null;

  const payload = value as Record<string, unknown>;
  if (typeof payload.title !== 'string' || !payload.title.trim()) return null;
  if (typeof payload.description !== 'string' || !payload.description.trim()) return null;

  return {
    title: payload.title.trim(),
    description: payload.description.trim(),
    department: typeof payload.department === 'string' && payload.department.trim() ? payload.department.trim() : 'Suporte',
    category: typeof payload.category === 'string' && payload.category.trim() ? payload.category.trim() : 'Geral',
    priority: typeof payload.priority === 'string' && payload.priority.trim() ? payload.priority.trim() : 'Normal',
  };
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Verificação de autenticação com Supabase SSR
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!isFirebaseConfigured || !storage) {
      return NextResponse.json({ error: 'Firebase não configurado. Defina as variáveis NEXT_PUBLIC_FIREBASE_*.' }, { status: 503 });
    }

    let payloadValue: unknown;
    let files: File[] = [];

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const payloadString = formData.get('payload');
      if (typeof payloadString !== 'string') {
        return NextResponse.json({ error: 'Payload do chamado inválido' }, { status: 400 });
      }
      try {
        payloadValue = JSON.parse(payloadString) as unknown;
      } catch {
        return NextResponse.json({ error: 'Payload do chamado contém JSON inválido' }, { status: 400 });
      }
      files = formData.getAll('files').filter((file): file is File => file instanceof File);
    } else {
      try {
        payloadValue = await req.json();
      } catch {
        return NextResponse.json({ error: 'Corpo da requisição contém JSON inválido' }, { status: 400 });
      }
    }

    const payload = parseTicketPayload(payloadValue);
    if (!payload) {
      return NextResponse.json({ error: 'Campos título e descrição são obrigatórios' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    for (const file of files) {
      if (!file.name) continue;

      const buffer = new Uint8Array(await file.arrayBuffer());
      const fileName = `anexos/${Date.now()}-${crypto.randomUUID()}-${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, buffer, { contentType: file.type });
      uploadedUrls.push(await getDownloadURL(storageRef));
    }

    // Invoca o Service Nativo para criar o chamado e o registro de Event Sourcing
    const ticketId = await abrirChamado({
      ...payload,
      attachments: uploadedUrls
    }, user.id);

    return NextResponse.json({ success: true, ticketId }, { status: 201 });

  } catch (error) {
    console.error('Erro na API POST /api/tickets:', error);
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Falha interna ao criar chamado', details }, { status: 500 });
  }
}
