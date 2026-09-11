const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve('.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

const usersToCreate = [
  { email: 'Daniel.cascais@criteltecnologia.com.br', password: 'Critel@1267', nome: 'Daniel Cascais', cargo: 'ADMIN' },
  { email: 'bruno.cruz@criteltecnologia.com.br', password: 'Critel@1267', nome: 'Bruno Cruz', cargo: 'TÉCNICO' },
  { email: 'daniel.rocha@criteltecnologia.com.br', password: 'Rocha@1267', nome: 'Daniel Rocha', cargo: 'ADMIN' },
  { email: 'henrique.cunha@criteltecnologia.com.br', password: 'Henrique@1267', nome: 'Henrique Cunha', cargo: 'TÉCNICO' },
  { email: 'jackeline.lima@criteltecnologia.com.br', password: 'Critel@1267', nome: 'Jackeline Lima', cargo: 'TÉCNICO' },
  { email: 'nicolas.duarte@criteltecnologia.com.br', password: 'Critel@2026', nome: 'Nicolas Duarte', cargo: 'TÉCNICO' },
  { email: 'nilma.oliveira@criteltecnologia.com.br', password: 'Critel@1267', nome: 'Nilma Oliveira', cargo: 'TÉCNICO' },
];

async function seedUsers() {
  console.log('Iniciando sync de usuários...');
  
  // Listar todos os usuarios
  const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Erro ao listar auth users", listError);
    return;
  }

  for (const u of usersToCreate) {
    console.log(`Processando: ${u.email}`);
    
    let userId = null;
    let authUser = authUsers.find(user => user.email.toLowerCase() === u.email.toLowerCase());

    if (authUser) {
       console.log(`- Usuário ${u.email} já existe no Auth com ID ${authUser.id}.`);
       userId = authUser.id;
    } else {
       // Cria
       const { data: newAuth, error: authError } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { nome: u.nome }
       });
       
       if (authError) {
         console.error(`- Falha fatal ao criar no Auth: ${authError.message}`);
         continue;
       }
       userId = newAuth.user.id;
       console.log(`- Criado no Auth com ID: ${userId}`);
    }

    // Criar Perfil
    const { data: existingPerfil } = await supabase.from('perfis').select('id').eq('user_id', userId).single();
    if (existingPerfil) {
        console.log(`- Perfil já existe para ${u.email}. Atualizando...`);
        await supabase.from('perfis').update({ nome: u.nome, cargo: u.cargo, status: 'ATIVO' }).eq('user_id', userId);
    } else {
        const { error: perfilError } = await supabase.from('perfis').insert([{
            user_id: userId,
            email: u.email,
            nome: u.nome,
            cargo: u.cargo,
            status: 'ATIVO'
        }]);

        if (perfilError) {
            console.error(`- Erro ao criar perfil para ${u.email}:`, perfilError.message);
        } else {
            console.log(`- Perfil inserido com sucesso.`);
        }
    }
  }
  
  console.log('Sync finalizado!');
}

seedUsers();
