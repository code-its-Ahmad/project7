CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL DEFAULT 'General Inquiry',
  message text NOT NULL,
  project_type text,
  estimated_budget text,
  source text NOT NULL DEFAULT 'contact_form',
  status text NOT NULL DEFAULT 'unread',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: inserts happen through the edge function,
-- which uses the service role. The table is unreadable from the browser.
