const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());

// Esta variável global vai guardar o cookie de sessão para TODAS as conexões
let sharedMilvusCookie = '';

// Proxy reverso
const milvusProxy = createProxyMiddleware({
  target: 'https://app.milvus.com.br',
  changeOrigin: true,
  ws: true, // Habilita proxy de WebSockets para o acesso remoto
  secure: false, // Ignorar falhas de certificado se houver
  
  onProxyReq: (proxyReq, req, res) => {
    // Se nós já temos um cookie salvo, injeta em TODAS as requisições
    if (sharedMilvusCookie) {
      proxyReq.setHeader('Cookie', sharedMilvusCookie);
    }
  },
  
  onProxyRes: (proxyRes, req, res) => {
    // 1. Interceptar Set-Cookie vindo do Milvus para capturar o Login
    const setCookieHeader = proxyRes.headers['set-cookie'];
    if (setCookieHeader) {
      sharedMilvusCookie = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;
      console.log('✅ Novo Cookie Capturado e Compartilhado para todos os analistas!');
    }

    // 2. Remover cabeçalhos de segurança que impedem iFrame
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];

    // Para evitar problemas de cors no iframe
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },

  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    // Injetar o cookie também nas conexões WebSocket (Acesso Remoto)
    if (sharedMilvusCookie) {
      proxyReq.setHeader('Cookie', sharedMilvusCookie);
    }
  }
});

app.use('/', milvusProxy);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Milvus Proxy Server rodando na porta ${PORT}`);
  console.log(`➡️  Acesse http://localhost:${PORT} para abrir o painel compartilhado.`);
});
