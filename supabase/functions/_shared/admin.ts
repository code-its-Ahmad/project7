import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { json } from './cors.ts';

/**
 * Shared owner-gate for privileged edge functions.
 *
 * Functions deploy with `verify_jwt = false`, so every privileged endpoint has
 * to validate the caller itself: the bearer token is resolved against the auth
 * server, and the resulting user id is checked against `user_roles` with the
 * service key (never trusting anything the browser sent about its own role).
 */
export interface AdminContext {
  service: SupabaseClient;
  userId: string;
  email: string;
}

export const serviceClient = (): SupabaseClient =>
  createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

/**
 * Returns the admin context, or a ready-to-send error Response when the caller
 * is anonymous or not the owner.
 */
export const requireAdmin = async (req: Request): Promise<AdminContext | Response> => {
  const token = /^Bearer (.+)$/.exec(req.headers.get('authorization') ?? '')?.[1];
  if (!token) return json({ error: 'Authentication required.' }, 401);

  const service = serviceClient();

  const { data: userData, error: userError } = await service.auth.getUser(token);
  if (userError || !userData.user) return json({ error: 'Invalid or expired session.' }, 401);

  const { data: role, error: roleError } = await service
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) return json({ error: 'Could not verify your access level.' }, 500);
  if (!role) return json({ error: 'Owner access required.' }, 403);

  return { service, userId: userData.user.id, email: userData.user.email ?? '' };
};
