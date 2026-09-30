import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { abrirChamado } from '@/lib/firebase/ticket-service';
import { storage } from '@/utils/firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

    let parsedData: any = {};
    let uploadedUrls: string[] = [];

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const payloadString = formData.get('payload') as string;
      parsedData = JSON.parse(payloadString);
      const files = formData.getAll('files') as File[];
      
      for (const file of files) {
        if (!file.name) continue;
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        const fileName = `anexos/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
        
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, buffer, { contentType: file.type });
        
        const downloadUrl = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadUrl);
      }
    } else {
      parsedData = await req.json();
    }

    const { title, description, department, category, priority } = parsedData;

    if (!title || !description) {
      return NextResponse.json({ error: 'Campos título e descrição são obrigatórios' }, { status: 400 });
    }

    // Invoca o Service Nativo para criar o chamado e o registro de Event Sourcing
    const ticketId = await abrirChamado({
      title,
      description,
      department: department || 'Suporte',
      category: category || 'Geral',
      priority: priority || 'Normal',
      attachments: uploadedUrls
    }, user.id);

    return NextResponse.json({ success: true, ticketId }, { status: 201 });

  } catch (error: any) {
    console.error('Erro na API POST /api/tickets:', error);
    return NextResponse.json({ error: 'Falha interna ao criar chamado', details: error.message }, { status: 500 });
  }
}
