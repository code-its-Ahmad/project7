import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { clean, corsHeaders, json } from '../_shared/cors.ts';

/**
 * Public, fire-and-forget analytics writer. Visitors have no INSERT grant on
 * analytics_events, so every event goes through here where the event type is
 * checked against an allow-list and the payload is size-capped.
 */

const ALLOWED_EVENTS = new Set([
  'pageview',
  'project_view',
  'project_like',
  'cv_download',
  'contact_submit',
  'chatbot_interaction',
  'testimonial_submit',
  'section_view',
  'outbound_click',
]);

const ALLOWED_DEVICES = new Set(['mobile', 'tablet', 'desktop']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));

    const eventType = clean(payload.event_type, 60);
    if (!ALLOWED_EVENTS.has(eventType)) {
      return json({ error: 'Unsupported event type.' }, 400);
    }

    const deviceType = clean(payload.device_type, 20);
    const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { error } = await supabase.from('analytics_events').insert({
      event_type: eventType,
      path: clean(payload.path, 300) || '/',
      referrer: clean(payload.referrer, 300),
      user_agent: clean(req.headers.get('user-agent') ?? '', 400),
      device_type: ALLOWED_DEVICES.has(deviceType) ? deviceType : 'desktop',
      metadata: metadata ? JSON.parse(JSON.stringify(metadata).slice(0, 2000)) : null,
    });

    if (error) {
      console.error('analytics insert failed:', error.message);
      return json({ error: 'Could not record event.' }, 500);
    }

    return json({ status: 'ok' });
  } catch (err) {
    console.error('track-event failed:', err);
    return json({ error: 'Unexpected error.' }, 500);
  }
});
