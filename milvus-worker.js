// milvus-worker.js
// Este script deve ser executado no servidor via PM2 ou Systemd.
// Exemplo: pm2 start milvus-worker.js --name "milvus-proxy"

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações do Supabase (lerá do .env ou do ambiente do servidor)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service role para bypass de RLS no worker
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações da API Oculta do Milvus
const milvusApiUrl = process.env.MILVUS_API_URL;
const milvusToken = process.env.MILVUS_API_KEY;

const POLLING_INTERVAL_MS = 60000; // 60 segundos

async function syncMilvusStatus() {
  console.log(`[${new Date().toISOString()}] Iniciando sync com Milvus...`);
  try {
    // 1. Fazer o Request para o Milvus
    // Descomente e ajuste os campos conforme a documentação oficial da API do Milvus
    /*
    const response = await axios.get(`${milvusApiUrl}/api/status-pdvs`, {
      headers: { Authorization: `Bearer ${milvusToken}` }
    });
    // Formatar a resposta do Milvus para a estrutura que esperamos no banco
    const pdvs = response.data.map(device => ({
      loja: device.cliente_nome || 'Desconhecida',
      status: device.is_online ? 'ONLINE' : 'OFFLINE'
    }));
    */
    
    // Mock temporário para simular a resposta do Milvus enquanto a URL oficial não é inserida
    const pdvs = [
      { loja: 'Bacio di Latte - Morumbi', status: 'ONLINE' },
      { loja: 'Bacio di Latte - JK Iguatemi', status: 'OFFLINE' }
    ];

    // 2. Atualizar o Supabase (Upsert)
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
