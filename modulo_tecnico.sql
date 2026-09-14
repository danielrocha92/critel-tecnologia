-- ==========================================
-- GATILHO PARA NOVOS USUÁRIOS (OAuth Google)
-- ==========================================

-- 1. Cria a função que insere o usuário automaticamente na tabela de perfis
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
  -- Define as variáveis padrão
DECLARE
  v_cargo VARCHAR(50) := 'TECNICO';
  v_status VARCHAR(50) := 'PENDENTE';
BEGIN
    -- Se for o e-mail do super admin, dá acesso total
    IF new.email = 'daniel.rocha@criteltecnologia.com.br' THEN
      v_cargo := 'ADMIN';
      v_status := 'ATIVO';
    END IF;

    -- Insere o usuário na tabela de perfis
    INSERT INTO public.perfis (user_id, email, nome, cargo, status)
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
      v_cargo, 
      v_status
    );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Cria o trigger que escuta a tabela auth.users (Tabela nativa do Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
