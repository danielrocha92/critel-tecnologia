import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
  }

  // Usar service_role key para ignorar RLS e permitir a inserção
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const payloadString = formData.get('payload') as string;
      const payload = JSON.parse(payloadString);
      
      const { data: ticket, error } = await supabase.from('tickets').insert(payload).select().single();
      
      if (error) {
        console.error('Erro ao inserir ticket (API):', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const files = formData.getAll('files') as File[];
      for (const file of files) {
        if (!file.name) continue;
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${ticket.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('anexos')
          .upload(fileName, file);
          
        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('anexos').getPublicUrl(fileName);
          
          await supabase.from('ticket_anexos').insert({
            ticket_id: ticket.id,
            nome_arquivo: file.name,
            url: publicUrlData.publicUrl,
            tamanho_bytes: file.size,
          });
        } else {
          console.error('Erro ao fazer upload do anexo:', uploadError);
        }
      }

      return NextResponse.json({ success: true, ticket });
    } else {
      const payload = await request.json();
      const { data, error } = await supabase.from('tickets').insert(payload).select().single();
      
      if (error) {
        console.error('Erro ao inserir ticket (API):', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, ticket: data });
    }
  } catch (error: any) {
    console.error('Erro no processamento da API de tickets:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
