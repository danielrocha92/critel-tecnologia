// milvus-worker.js
// Este script deve ser executado no servidor via PM2 ou Systemd.
// Exemplo: pm2 start milvus-worker.js --name "milvus-proxy"

// O Axios foi removido e substituído por fetch nativo do Node.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' }); // Garante leitura do .env.local

// Configurações do Supabase (lerá do .env ou do ambiente do servidor)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service role para bypass de RLS no worker
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações da API Oculta do Milvus
const milvusApiUrl = process.env.MILVUS_API_URL || 'https://app.milvus.com.br';

const POLLING_INTERVAL_MS = 60000; // 60 segundos

async function syncMilvusStatus() {
  console.log(`[${new Date().toISOString()}] Iniciando sync com Milvus...`);
  try {
    // 1. Autenticação no Milvus
    const milvusEmail = process.env.MILVUS_EMAIL;
    const milvusPassword = process.env.MILVUS_PASSWORD;

    if (!milvusEmail || !milvusPassword) {
      throw new Error('Credenciais do Milvus (MILVUS_EMAIL e MILVUS_PASSWORD) não configuradas no .env.local');
    }

    // Fazemos o login para obter o token/cookie usando fetch
    const loginResponse = await fetch(`${milvusApiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: milvusEmail,
        password: milvusPassword
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Falha no login do Milvus: ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.access_token;
    
    // 2. Buscar os PDVs com o Token Obtido
    const response = await fetch(`${milvusApiUrl}/api/status-pdvs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Falha ao buscar PDVs: ${response.statusText}`);
    }
    
    const data = await response.json();

    // Formatar a resposta do Milvus para a estrutura que esperamos no banco
    // ATENÇÃO: Dependendo da API do Milvus, a lista pode estar em data.data ou apenas data.
    const listaDispositivos = Array.isArray(data) ? data : data.data || [];
    
    const pdvs = listaDispositivos.map(device => ({
      loja: device.cliente_nome || 'Desconhecida',
      status: device.is_online ? 'ONLINE' : 'OFFLINE'
    }));

    // Mock temporário caso os endpoints acima precisem de ajuste na URL exata
    /*
    const pdvs = [
      { loja: 'Bacio di Latte - Morumbi', status: 'ONLINE' },
      { loja: 'Bacio di Latte - JK Iguatemi', status: 'OFFLINE' }
    ];
    */

    // 3. Atualizar o Supabase (Upsert)
    for (const pdv of pdvs) {
      const { error } = await supabase
        .from('status_pdv')
        .upsert({ 
          loja: pdv.loja, 
          status_conexao: pdv.status, 
          ultima_verificacao: new Date().toISOString() 
        }, { onConflict: 'loja' });
        
      if (error) {
        console.error(`Erro ao atualizar PDV ${pdv.loja}:`, error.message);
      }
    }
    
    console.log(`[${new Date().toISOString()}] Sync concluído com sucesso.`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Erro no sync do Milvus:`, err.message);
  }
}

// Iniciar o loop de polling
console.log('Worker do Milvus Proxy iniciado. Polling a cada 60s.');
syncMilvusStatus();
setInterval(syncMilvusStatus, POLLING_INTERVAL_MS);
