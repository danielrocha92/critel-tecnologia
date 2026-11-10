ALTER TABLE public.financeiro
  DROP COLUMN IF EXISTS status_conciliacao;

NOTIFY pgrst, 'reload schema';
