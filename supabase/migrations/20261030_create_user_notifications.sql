CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'sistema',
  href TEXT,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notificacoes_user_created_idx
  ON public.notificacoes (user_id, criada_em DESC);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios leem as proprias notificacoes" ON public.notificacoes;
CREATE POLICY "Usuarios leem as proprias notificacoes"
  ON public.notificacoes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios atualizam as proprias notificacoes" ON public.notificacoes;
CREATE POLICY "Usuarios atualizam as proprias notificacoes"
  ON public.notificacoes FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios removem as proprias notificacoes" ON public.notificacoes;
CREATE POLICY "Usuarios removem as proprias notificacoes"
  ON public.notificacoes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, UPDATE, DELETE ON public.notificacoes TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notificacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
