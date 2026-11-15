import 'server-only';

import { format, startOfMonth, subMonths } from 'date-fns';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminUserRow } from '@/features/admin/queries';

export type PlatformOrganizationInsight = {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  isActive: boolean;
  createdAt: string;
  members: number;
  courses: number;
  publishedCourses: number;
  enrollments: number;
  completions: number;
};

export type PlatformOverview = {
  totals: {
    organizations: number;
    activeOrganizations: number;
    users: number;
    superAdmins: number;
    orgAdmins: number;
    instructors: number;
    students: number;
    courses: number;
    publishedCourses: number;
    draftCourses: number;
    enrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    certificates: number;
    submissions: number;
    gradedSubmissions: number;
    pendingInstructorRequests: number;
  };
  growth: { month: string; users: number; enrollments: number }[];
  organizations: PlatformOrganizationInsight[];
  recentUsers: AdminUserRow[];
};

const EMPTY: PlatformOverview = {
  totals: {
    organizations: 0,
    activeOrganizations: 0,
    users: 0,
    superAdmins: 0,
    orgAdmins: 0,
    instructors: 0,
    students: 0,
    courses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    enrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    certificates: 0,
    submissions: 0,
    gradedSubmissions: 0,
    pendingInstructorRequests: 0,
  },
  growth: [],
  organizations: [],
  recentUsers: [],
};

/**
 * Cross-tenant platform metrics for super administrators. RLS grants super
 * admins read access to every organization; aggregation is done in memory so
 * the page stays a single round trip per entity type.
 */
export async function getPlatformOverview(): Promise<PlatformOverview> {
  const supabase = await createServerSupabaseClient();
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString();

  const [
    organizationsResult,
    profilesResult,
    coursesResult,
    enrollmentsResult,
    certificatesResult,
    submissionsResult,
    requestsResult,
    recentUsersResult,
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('id,name,slug,primary_color,is_active,created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('id,role,status,default_org_id,created_at'),
    supabase.from('courses').select('id,org_id,status').is('deleted_at', null),
    supabase.from('enrollments').select('id,org_id,status,enrolled_at,completed_at'),
    supabase.from('certificates').select('id', { count: 'exact', head: true }),
    supabase.from('assignment_submissions').select('status'),
    supabase.from('instructor_requests').select('id').eq('status', 'pending'),
    supabase
      .from('profiles')
      .select('*, organization:organizations!profiles_default_org_id_fkey(id,name,slug)')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  if (organizationsResult.error) throw organizationsResult.error;

  const organizations = organizationsResult.data ?? [];
  const profiles = profilesResult.data ?? [];
  const courses = coursesResult.data ?? [];
  const enrollments = enrollmentsResult.data ?? [];
  const submissions = submissionsResult.data ?? [];
  const requests = requestsResult.data ?? [];

  const profByOrg = new Map<string, number>();
  const roleCounts = { super_admin: 0, org_admin: 0, instructor: 0, student: 0 } as Record<string, number>;

  for (const profile of profiles) {
    roleCounts[profile.role] = (roleCounts[profile.role] ?? 0) + 1;
    if (profile.default_org_id) {
      profByOrg.set(profile.default_org_id, (profByOrg.get(profile.default_org_id) ?? 0) + 1);
    }
  }

  const courseCounts = new Map<string, { total: number; published: number }>();
  for (const course of courses) {
    const current = courseCounts.get(course.org_id) ?? { total: 0, published: 0 };
    current.total += 1;
    if (course.status === 'published') current.published += 1;
    courseCounts.set(course.org_id, current);
  }

  const enrollmentCounts = new Map<string, { total: number; completed: number }>();
  for (const enrollment of enrollments) {
    const current = enrollmentCounts.get(enrollment.org_id) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (enrollment.status === 'completed') current.completed += 1;
    enrollmentCounts.set(enrollment.org_id, current);
  }

  const organizationInsights: PlatformOrganizationInsight[] = organizations.map((organization) => {
    const courseStats = courseCounts.get(organization.id) ?? { total: 0, published: 0 };
    const enrollmentStats = enrollmentCounts.get(organization.id) ?? { total: 0, completed: 0 };
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      primaryColor: organization.primary_color,
      isActive: organization.is_active,
      createdAt: organization.created_at,
      members: profByOrg.get(organization.id) ?? 0,
      courses: courseStats.total,
      publishedCourses: courseStats.published,
      enrollments: enrollmentStats.total,
      completions: enrollmentStats.completed,
    };
  });

  const monthBuckets = new Map<string, { users: number; enrollments: number }>();
  for (let index = 5; index >= 0; index -= 1) {
    monthBuckets.set(format(subMonths(new Date(), index), 'yyyy-MM'), { users: 0, enrollments: 0 });
  }
  for (const profile of profiles) {
    if (profile.created_at < sixMonthsAgo) continue;
    const bucket = monthBuckets.get(format(new Date(profile.created_at), 'yyyy-MM'));
    if (bucket) bucket.users += 1;
  }
  for (const enrollment of enrollments) {
    if (enrollment.enrolled_at < sixMonthsAgo) continue;
    const bucket = monthBuckets.get(format(new Date(enrollment.enrolled_at), 'yyyy-MM'));
    if (bucket) bucket.enrollments += 1;
  }

  return {
    totals: {
      organizations: organizations.length,
      activeOrganizations: organizations.filter((organization) => organization.is_active).length,
      users: profiles.length,
      superAdmins: roleCounts.super_admin ?? 0,
      orgAdmins: roleCounts.org_admin ?? 0,
      instructors: roleCounts.instructor ?? 0,
      students: roleCounts.student ?? 0,
      courses: courses.length,
      publishedCourses: courses.filter((course) => course.status === 'published').length,
      draftCourses: courses.filter((course) => course.status === 'draft').length,
      enrollments: enrollments.length,
      activeEnrollments: enrollments.filter((enrollment) => enrollment.status === 'active').length,
      completedEnrollments: enrollments.filter((enrollment) => enrollment.status === 'completed').length,
      certificates: certificatesResult.count ?? 0,
      submissions: submissions.length,
      gradedSubmissions: submissions.filter((submission) => submission.status === 'graded').length,
      pendingInstructorRequests: requests.length,
    },
    growth: [...monthBuckets.entries()].map(([month, values]) => ({
      month: format(new Date(`${month}-01T00:00:00`), 'MMM'),
      ...values,
    })),
    organizations: organizationInsights.sort((a, b) => b.members - a.members),
    recentUsers: (recentUsersResult.data ?? []) as unknown as AdminUserRow[],
  };
}

export const emptyPlatformOverview = EMPTY;
