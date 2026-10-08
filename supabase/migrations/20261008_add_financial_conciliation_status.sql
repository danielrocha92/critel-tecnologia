ALTER TABLE public.financeiro
ADD COLUMN IF NOT EXISTS status_conciliacao TEXT NOT NULL DEFAULT 'PENDENTE';

UPDATE public.financeiro
SET status_conciliacao = CASE UPPER(COALESCE(status_faturamento::TEXT, 'PENDENTE'))
  WHEN 'CONCILIADO' THEN 'CONCILIADO'
  WHEN 'DIVERGENTE' THEN 'DIVERGENTE'
  WHEN 'GLOSADO' THEN 'GLOSADO'
  ELSE 'PENDENTE'
END
WHERE status_conciliacao = 'PENDENTE';

NOTIFY pgrst, 'reload schema';
