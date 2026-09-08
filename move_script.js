const fs = require('fs');
const path = require('path');
const langDir = path.join(__dirname, 'src', 'app', '[lang]');
const painelDir = path.join(langDir, '(painel)');
const websiteDir = path.join(langDir, '(website)');

if (!fs.existsSync(painelDir)) fs.mkdirSync(painelDir);
if (!fs.existsSync(websiteDir)) fs.mkdirSync(websiteDir);

const atendimentoPath = path.join(langDir, 'atendimento');
if (fs.existsSync(atendimentoPath)) {
  fs.renameSync(atendimentoPath, path.join(painelDir, 'atendimento'));
}

const others = ['certificacoes', 'clientes', 'contato', 'privacidade', 'sobre', 'solucoes', 'termos', 'page.tsx', 'page.module.css'];
others.forEach(item => {
  const p = path.join(langDir, item);
  if (fs.existsSync(p)) {
    fs.renameSync(p, path.join(websiteDir, item));
  }
});

console.log('Arquivos movidos com sucesso!');
