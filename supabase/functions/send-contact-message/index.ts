import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Trim, coerce to string and hard-cap length — never trust the browser. */
const clean = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const payload = await req.json().catch(() => ({}));

    const name = clean(payload.name, 100);
    const email = clean(payload.email, 255).toLowerCase();
    const message = clean(payload.message, 5000);
    const phone = clean(payload.phone, 40);
    const subject = clean(payload.subject, 150) || 'General Inquiry';
    const projectType = clean(payload.project_type, 100);
    const estimatedBudget = clean(payload.estimated_budget, 100);
    const source = clean(payload.source, 50) || 'contact_form';

    if (!name || !email || !message) {
      return json({ error: 'Name, email, and message are required.' }, 400);
    }
    if (!EMAIL_RE.test(email)) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        phone,
        subject,
        message,
        project_type: projectType,
        estimated_budget: estimatedBudget,
        source,
      })
      .select('id')
      .single();

    if (error) {
      console.error('contact_messages insert failed:', error.message);
      return json({ error: 'Could not save your message. Please try again.' }, 500);
    }

    return json({
      id: data.id,
      message:
        'Thank you for reaching out! Your message has been received and Muhammad Ahmad will respond shortly.',
    });
  } catch (err) {
    console.error('send-contact-message failed:', err);
    return json({ error: 'Unexpected error. Please try again or reach out on WhatsApp.' }, 500);
  }
});
