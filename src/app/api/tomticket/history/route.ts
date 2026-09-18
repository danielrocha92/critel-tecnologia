import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tomticketId = searchParams.get('tomticket_id');

  if (!tomticketId) {
    return NextResponse.json({ error: 'tomticket_id is required' }, { status: 400 });
  }

  const token = process.env.TOMTICKET_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'TOMTICKET_API_TOKEN is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.tomticket.com/v2.0/ticket/detail?ticket_id=${tomticketId}`, {
      headers: {
        'Authorization': token,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`TomTicket API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // O retorno da API costuma vir dentro de data ou ticket, dependendo da versão
    const ticketData = data.data || data.ticket || data;
    
    // Retornamos as respostas (replies) e a mensagem original
    return NextResponse.json({
      success: true,
      messages: ticketData.replies || [],
      original_message: ticketData.message || ''
    });

  } catch (error: any) {
    console.error('Error fetching TomTicket history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
