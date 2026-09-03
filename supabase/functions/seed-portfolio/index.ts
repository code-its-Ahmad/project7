import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders, json } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/admin.ts';
import data from './data.json' with { type: 'json' };

/**
 * One-shot content import.
 *
 * Carries the portfolio content that used to live in the local SQLite database
 * into Lovable Cloud. It is idempotent: each table is only filled when it is
 * still empty, so calling it twice never duplicates or overwrites content the
 * owner has since edited in the CMS.
 */

const TABLES = [
  'projects',
  'skills',
  'experiences',
  'services',
  'certificates',
  'testimonials',
  'chatbot_knowledge',
  'contact_messages',
  'analytics_events',
] as const;

const SEQUENCED = TABLES;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  /**
   * Open only during first-run bootstrap (no owner exists yet). Once the owner
   * account has been created the importer is owner-only, so nobody can poke
   * seed content into a live site.
   */
  const { count: ownerCount } = await supabase
    .from('user_roles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');

  if ((ownerCount ?? 0) > 0) {
    const ctx = await requireAdmin(req);
    if (ctx instanceof Response) return ctx;
  }

  const seeded: Record<string, number | string> = {};

  try {
    // Profile is a fixed single row (id = 1) — upsert keeps it authoritative.
    const profileRows = (data as Record<string, unknown[]>).profile ?? [];
    if (profileRows.length) {
      const { error } = await supabase.from('profile').upsert(profileRows[0] as object, { onConflict: 'id' });
      if (error) throw new Error(`profile: ${error.message}`);
      seeded.profile = 1;
    }

    for (const table of TABLES) {
      const rows = ((data as Record<string, unknown[]>)[table] ?? []) as object[];
      if (!rows.length) {
        seeded[table] = 0;
        continue;
      }

      const { count, error: countError } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true });
      if (countError) throw new Error(`${table} count: ${countError.message}`);

      if ((count ?? 0) > 0) {
        seeded[table] = 'skipped (already has content)';
        continue;
      }

      // Chunked so a large analytics history stays inside the request budget.
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase.from(table).insert(rows.slice(i, i + 200));
        if (error) throw new Error(`${table}: ${error.message}`);
      }
      seeded[table] = rows.length;
    }

    // Explicit ids were inserted, so the identity sequences must catch up or the
    // first CMS insert would collide on the primary key.
    for (const table of SEQUENCED) {
      await supabase.rpc('resync_identity', { _table: table }).then(
        () => undefined,
        () => undefined,
      );
    }

    return json({ message: 'Portfolio content imported.', seeded });
  } catch (err) {
    console.error('seed-portfolio failed:', err);
    return json({ error: err instanceof Error ? err.message : 'Unexpected error.', seeded }, 500);
  }
});
