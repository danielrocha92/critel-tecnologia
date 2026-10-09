ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS equipe_responsavel VARCHAR(40),
ADD COLUMN IF NOT EXISTS causa_raiz TEXT,
ADD COLUMN IF NOT EXISTS causa_raiz_detalhe TEXT;

NOTIFY pgrst, 'reload schema';
