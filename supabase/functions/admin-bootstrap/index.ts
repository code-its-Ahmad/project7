import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { clean, corsHeaders, EMAIL_RE, json } from '../_shared/cors.ts';

/**
 * One-shot owner-account bootstrap.
 *
 * The CMS is single-owner. This endpoint creates the very first admin account
 * and then permanently locks itself: as soon as one row exists in user_roles
 * with role 'admin', every further call is rejected. There is no public signup
 * anywhere else in the app.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { count, error: countError } = await supabase
      .from('user_roles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (countError) {
      console.error('role lookup failed:', countError.message);
      return json({ error: 'Could not verify owner state.' }, 500);
    }

    const payload = await req.json().catch(() => ({}));
    const mode = clean(payload.mode, 20);

    // The login screen asks whether it should offer first-time setup.
    if (mode === 'status') {
      return json({ needsSetup: (count ?? 0) === 0 });
    }

    if ((count ?? 0) > 0) {
      return json({ error: 'An owner account already exists. Please sign in instead.' }, 409);
    }

    const email = clean(payload.email, 255).toLowerCase();
    const password = typeof payload.password === 'string' ? payload.password : '';
    const name = clean(payload.name, 100) || 'Site Owner';

    if (!EMAIL_RE.test(email)) return json({ error: 'Please enter a valid email address.' }, 400);
    if (password.length < 10) {
      return json({ error: 'Choose a password of at least 10 characters.' }, 400);
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError || !created.user) {
      console.error('owner creation failed:', createError?.message);
      return json({ error: createError?.message ?? 'Could not create the owner account.' }, 400);
    }

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: created.user.id, role: 'admin' });

    if (roleError) {
      console.error('role grant failed:', roleError.message);
      // Roll back so bootstrap stays available instead of stranding a roleless user.
      await supabase.auth.admin.deleteUser(created.user.id);
      return json({ error: 'Could not grant the admin role. Please try again.' }, 500);
    }

    return json({ message: 'Owner account created. You can sign in now.' });
  } catch (err) {
    console.error('admin-bootstrap failed:', err);
    return json({ error: 'Unexpected error. Please try again.' }, 500);
  }
});
