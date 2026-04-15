-- Restrict storage policies so users can only write to their own folder.
-- Paths are now {user_id}/{wine_id}.{ext}. Public read stays open (CDN use case).

DROP POLICY IF EXISTS "Users can upload wine images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update wine images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete wine images" ON storage.objects;

CREATE POLICY "Users can upload own wine images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wine-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own wine images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wine-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own wine images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wine-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
