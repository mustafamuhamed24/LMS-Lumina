import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { roleHome } from '@/lib/roles';
import type { OrganizationMembership, OrganizationRow, Role, SessionUser } from '@/types/app';

export { roleHome };

/**
 * Resolves the authenticated user, their profile and active organization
 * memberships. Cached per request. RLS limits what can be read.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (!profile) return null;

  const { data: membershipRows } = await supabase
    .from('organization_members')
    .select('role, status, organizations(*)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const memberships: OrganizationMembership[] = [];
  for (const row of membershipRows ?? []) {
    const organization = row.organizations as OrganizationRow | null;
    if (!organization) continue;
    memberships.push({
      orgId: organization.id,
      role: row.role,
      status: row.status,
      organization,
    });
  }

  const activeOrg =
    memberships.find((membership) => membership.organization.id === profile.default_org_id)?.organization ??
    memberships[0]?.organization ??
    null;

  return {
    id: user.id,
    email: profile.email || user.email || '',
    profile: { ...profile, memberships },
    activeOrg,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.profile.status === 'suspended') redirect('/suspended');
  return user;
}

export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!allowed.includes(user.profile.role)) {
    redirect(roleHome(user.profile.role));
  }
  return user;
}

export const requireAdmin = () => requireRole(['super_admin', 'org_admin']);
export const requireInstructor = () => requireRole(['instructor']);
export const requireStudent = () => requireRole(['student']);

export async function requireSuperAdmin(): Promise<SessionUser> {
  return requireRole(['super_admin']);
}

export function canAccessAdmin(user: SessionUser) {
  return user.profile.role === 'super_admin' || user.profile.role === 'org_admin';
}

export function isSuperAdmin(user: SessionUser) {
  return user.profile.role === 'super_admin';
}
