const ngrok = require('ngrok');

(async function() {
  try {
    const url = await ngrok.connect({
      addr: 3000,
      authtoken: process.env.NGROK_AUTH_TOKEN || '3J3jMs1wAHTnK5sNCZyiuHJLA3M_26LsLPrWm8ZyifbKbwCx4'
    });
    console.log('==================================================');
    console.log('✅ NGROK TUNNEL ABERTO COM SUCESSO!');
    console.log('🔗 URL:', url);
    console.log('📋 COPIE ISSO NA META:', url + '/api/webhooks/meta');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ Erro ao abrir o ngrok:', err);
  }
})();
