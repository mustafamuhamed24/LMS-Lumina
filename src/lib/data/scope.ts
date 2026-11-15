import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { OrganizationRow, SessionUser } from '@/types/app';

export type AdminScope = {
  isSuperAdmin: boolean;
  orgIds: string[];
  organizations: OrganizationRow[];
};

export async function getAdminScope(user: SessionUser): Promise<AdminScope> {
  const supabase = await createServerSupabaseClient();

  if (user.profile.role === 'super_admin') {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });
    const organizations = data ?? [];
    return { isSuperAdmin: true, orgIds: organizations.map((organization) => organization.id), organizations };
  }

  const organizations = user.profile.memberships
    .filter((membership) => membership.role === 'org_admin')
    .map((membership) => membership.organization);

  return {
    isSuperAdmin: false,
    orgIds: organizations.map((organization) => organization.id),
    organizations,
  };
}

export async function getInstructorCourseIds(userId: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const [{ data: owned }, { data: co }] = await Promise.all([
    supabase.from('courses').select('id').eq('instructor_id', userId).is('deleted_at', null),
    supabase.from('course_instructors').select('course_id').eq('user_id', userId),
  ]);
  return [...new Set([...(owned ?? []).map((row) => row.id), ...(co ?? []).map((row) => row.course_id)])];
}
