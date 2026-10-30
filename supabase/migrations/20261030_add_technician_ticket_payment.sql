ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS modalidade_pagamento VARCHAR(20)
    CHECK (modalidade_pagamento IS NULL OR modalidade_pagamento IN ('diaria', 'chamado')),
  ADD COLUMN IF NOT EXISTS valor_pagamento NUMERIC(12, 2)
    CHECK (valor_pagamento IS NULL OR valor_pagamento > 0);

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS modalidade_pagamento VARCHAR(20)
    CHECK (modalidade_pagamento IS NULL OR modalidade_pagamento IN ('diaria', 'chamado')),
  ADD COLUMN IF NOT EXISTS valor_pagamento NUMERIC(12, 2)
    CHECK (valor_pagamento IS NULL OR valor_pagamento > 0);

NOTIFY pgrst, 'reload schema';
