import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { clean, corsHeaders, json } from '../_shared/cors.ts';

/**
 * Public testimonial submission. Visitors cannot INSERT into testimonials
 * directly, which guarantees every submission lands as `pending` and can never
 * self-publish or set is_featured.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));

    const name = clean(payload.name, 100);
    const text = clean(payload.text, 2000);
    const role = clean(payload.role, 100);
    const company = clean(payload.company, 120);
    const projectName = clean(payload.project_name, 150);
    const ratingRaw = Number(payload.rating);
    const rating = Number.isFinite(ratingRaw) ? Math.min(5, Math.max(1, Math.round(ratingRaw))) : 5;

    if (!name || !text) {
      return json({ error: 'Name and testimonial text are required.' }, 400);
    }
    if (text.length < 10) {
      return json({ error: 'Please write at least 10 characters.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        name,
        role,
        company,
        text,
        rating,
        project_name: projectName || null,
        status: 'pending',
        is_featured: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('testimonial insert failed:', error.message);
      return json({ error: 'Could not save your testimonial. Please try again.' }, 500);
    }

    await supabase.from('analytics_events').insert({
      event_type: 'testimonial_submit',
      path: '/#testimonials',
      metadata: { name },
    });

    return json({
      id: data.id,
      message: 'Thank you! Your testimonial was submitted and will appear once reviewed.',
    });
  } catch (err) {
    console.error('submit-testimonial failed:', err);
    return json({ error: 'Unexpected error. Please try again.' }, 500);
  }
});
