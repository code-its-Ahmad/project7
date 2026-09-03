CREATE OR REPLACE FUNCTION public.resync_identity(_table text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE seq text;
BEGIN
  IF _table NOT IN ('projects','skills','experiences','services','certificates','testimonials','chatbot_knowledge','contact_messages','analytics_events') THEN
    RAISE EXCEPTION 'Unsupported table %', _table;
  END IF;
  seq := pg_get_serial_sequence('public.' || quote_ident(_table), 'id');
  IF seq IS NOT NULL THEN
    EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(id) FROM public.%I), 1))', seq, _table);
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.resync_identity(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resync_identity(text) TO service_role;