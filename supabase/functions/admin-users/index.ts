import { corsHeaders, json } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/admin.ts';

/**
 * Read-only directory of the accounts that exist in this project.
 *
 * `auth.users` is never exposed through the Data API, so the admin "Users"
 * screen reads it here behind the owner gate. Nothing in this function can
 * create, promote or delete an account — the CMS stays single-owner, and the
 * only account that can ever be created is the one-shot bootstrap owner.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  try {
    const { data, error } = await ctx.service.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) throw new Error(error.message);

    const { data: roles, error: rolesError } = await ctx.service
      .from('user_roles')
      .select('user_id, role');
    if (rolesError) throw new Error(rolesError.message);

    const roleByUser = new Map<string, string[]>();
    for (const row of roles ?? []) {
      const list = roleByUser.get(row.user_id) ?? [];
      list.push(row.role);
      roleByUser.set(row.user_id, list);
    }

    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email ?? '',
      name: (user.user_metadata?.name as string) ?? '',
      avatar_url: (user.user_metadata?.avatar_url as string) ?? '',
      roles: roleByUser.get(user.id) ?? [],
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      email_confirmed: Boolean(user.email_confirmed_at),
      is_you: user.id === ctx.userId,
    }));

    return json({ users });
  } catch (err) {
    console.error('admin-users failed:', err);
    return json({ error: err instanceof Error ? err.message : 'Could not load users.' }, 500);
  }
});
