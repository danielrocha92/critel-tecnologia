-- Upsert exige leitura para verificar objetos existentes, além de INSERT/UPDATE.
DROP POLICY IF EXISTS "Authenticated users can read ticket attachments" ON storage.objects;
CREATE POLICY "Authenticated users can read ticket attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'anexos');

-- Recria as políticas de escrita de forma idempotente para garantir que o
-- usuário autenticado possa criar ou substituir objetos somente neste bucket.
DROP POLICY IF EXISTS "Authenticated users can upload ticket attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'anexos');

DROP POLICY IF EXISTS "Authenticated users can update ticket attachments" ON storage.objects;
CREATE POLICY "Authenticated users can update ticket attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'anexos')
WITH CHECK (bucket_id = 'anexos');
