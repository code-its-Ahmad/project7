DROP POLICY IF EXISTS "Owner reads portfolio media" ON storage.objects;
CREATE POLICY "Owner reads portfolio media" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'portfolio-media' AND public.is_admin());

DROP POLICY IF EXISTS "Owner uploads portfolio media" ON storage.objects;
CREATE POLICY "Owner uploads portfolio media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'portfolio-media' AND public.is_admin());

DROP POLICY IF EXISTS "Owner updates portfolio media" ON storage.objects;
CREATE POLICY "Owner updates portfolio media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'portfolio-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'portfolio-media' AND public.is_admin());

DROP POLICY IF EXISTS "Owner deletes portfolio media" ON storage.objects;
CREATE POLICY "Owner deletes portfolio media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'portfolio-media' AND public.is_admin());