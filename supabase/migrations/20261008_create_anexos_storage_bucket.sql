-- Bucket usado por anexos de chamados, assinaturas e evidências técnicas.
INSERT INTO storage.buckets (id, name, public)
VALUES ('anexos', 'anexos', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Usuários autenticados podem enviar e substituir arquivos no bucket.
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'anexos');

CREATE POLICY "Authenticated users can update ticket attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'anexos')
WITH CHECK (bucket_id = 'anexos');
