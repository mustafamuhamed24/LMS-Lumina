import 'server-only';

import { subMonths, format, startOfMonth } from 'date-fns';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAdminScope } from '@/lib/data/scope';
import type { SessionUser } from '@/types/app';

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboard>>;

export async function getAdminDashboard(user: SessionUser) {
  const scope = await getAdminScope(user);
  const supabase = await createServerSupabaseClient();
  const orgIds = scope.orgIds;

  const empty = {
    scope,
    stats: {
      students: 0,
      instructors: 0,
      courses: 0,
      publishedCourses: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
      pendingEnrollments: 0,
      activeOrganizations: 0,
      completionRate: 0,
      averageProgress: 0,
    },
    trend: [] as { month: string; enrollments: number; completions: number }[],
    topCourses: [] as {
      id: string;
      title: string;
      slug: string;
      thumbnailUrl: string | null;
      instructorName: string;
      enrollments: number;
      completions: number;
      completionRate: number;
    }[],
    recentActivity: [] as {
      id: string;
      action: string;
      entityType: string | null;
      createdAt: string;
      userName: string | null;
      userRole: string | null;
    }[],
    recentRegistrations: [] as { id: string; fullName: string; email: string; role: string; createdAt: string }[],
    categoryBreakdown: [] as { name: string; color: string; count: number }[],
  };

  if (!orgIds.length) return empty;

  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString();

  const [
    studentsResult,
    instructorsResult,
    coursesResult,
    publishedResult,
    activeEnrollmentsResult,
    completedEnrollmentsResult,
    pendingResult,
    activeOrgsResult,
    progressResult,
    trendResult,
    topCoursesResult,
    activityResult,
    registrationsResult,
    categoriesResult,
    categoryCoursesResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').in('default_org_id', orgIds),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'instructor').in('default_org_id', orgIds),
    supabase.from('courses').select('id', { count: 'exact', head: true }).in('org_id', orgIds).is('deleted_at', null),
    supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .in('org_id', orgIds)
      .eq('status', 'published')
      .is('deleted_at', null),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('org_id', orgIds).eq('status', 'active'),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('org_id', orgIds).eq('status', 'completed'),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('org_id', orgIds).eq('status', 'pending'),
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .in('id', orgIds)
      .eq('is_active', true)
      .is('deleted_at', null),
    supabase.from('enrollments').select('progress_percent').in('org_id', orgIds).in('status', ['active', 'completed']),
    supabase
      .from('enrollments')
      .select('enrolled_at, completed_at, status')
      .in('org_id', orgIds)
      .gte('enrolled_at', sixMonthsAgo),
    supabase
      .from('courses')
      .select('id, title, slug, thumbnail_url, student_count, profiles!courses_instructor_id_fkey(full_name)')
      .in('org_id', orgIds)
      .is('deleted_at', null)
      .order('student_count', { ascending: false })
      .limit(5),
    supabase
      .from('activity_logs')
      .select('id, action, entity_type, created_at, profiles(full_name, role)')
      .in('org_id', orgIds)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .in('default_org_id', orgIds)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('categories').select('id, name, color').in('org_id', orgIds),
    supabase.from('courses').select('category_id').in('org_id', orgIds).eq('status', 'published').is('deleted_at', null),
  ]);

  const activeEnrollments = activeEnrollmentsResult.count ?? 0;
  const completedEnrollments = completedEnrollmentsResult.count ?? 0;
  const totalForCompletion = activeEnrollments + completedEnrollments;

  const progressRows = progressResult.data ?? [];
  const averageProgress = progressRows.length
    ? progressRows.reduce((sum, row) => sum + Number(row.progress_percent), 0) / progressRows.length
    : 0;

  const monthBuckets = new Map<string, { enrollments: number; completions: number }>();
  for (let index = 5; index >= 0; index -= 1) {
    const date = subMonths(new Date(), index);
    monthBuckets.set(format(date, 'yyyy-MM'), { enrollments: 0, completions: 0 });
  }
  for (const row of trendResult.data ?? []) {
    const enrolledMonth = format(new Date(row.enrolled_at), 'yyyy-MM');
    const bucket = monthBuckets.get(enrolledMonth);
    if (bucket) bucket.enrollments += 1;
    if (row.completed_at) {
      const completedMonth = format(new Date(row.completed_at), 'yyyy-MM');
      const completedBucket = monthBuckets.get(completedMonth);
      if (completedBucket) completedBucket.completions += 1;
    }
  }
  const trend = [...monthBuckets.entries()].map(([month, values]) => ({
    month: format(new Date(`${month}-01T00:00:00`), 'MMM'),
    ...values,
  }));

  const topRows = (topCoursesResult.data ?? []) as unknown as {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    student_count: number;
    profiles: { full_name: string } | null;
  }[];

  const topIds = topRows.map((row) => row.id);
  let completionCounts = new Map<string, number>();
  if (topIds.length) {
    const { data: completedByCourse } = await supabase
      .from('enrollments')
      .select('course_id')
      .in('course_id', topIds)
      .eq('status', 'completed');
    completionCounts = new Map();
    for (const row of completedByCourse ?? []) {
      completionCounts.set(row.course_id, (completionCounts.get(row.course_id) ?? 0) + 1);
    }
  }

  const topCourses = topRows.map((row) => {
    const completions = completionCounts.get(row.id) ?? 0;
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      thumbnailUrl: row.thumbnail_url,
      instructorName: row.profiles?.full_name ?? 'Instructor',
      enrollments: row.student_count,
      completions,
      completionRate: row.student_count > 0 ? (completions / row.student_count) * 100 : 0,
    };
  });

  const categoryCounts = new Map<string, number>();
  for (const row of categoryCoursesResult.data ?? []) {
    if (row.category_id) categoryCounts.set(row.category_id, (categoryCounts.get(row.category_id) ?? 0) + 1);
  }
  const categoryBreakdown = (categoriesResult.data ?? [])
    .filter((category) => categoryCounts.get(category.id))
    .map((category) => ({ name: category.name, color: category.color, count: categoryCounts.get(category.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const activityRows = (activityResult.data ?? []) as unknown as {
    id: string;
    action: string;
    entity_type: string | null;
    created_at: string;
    profiles: { full_name: string; role: string } | null;
  }[];

  return {
    scope,
    stats: {
      students: studentsResult.count ?? 0,
      instructors: instructorsResult.count ?? 0,
      courses: coursesResult.count ?? 0,
      publishedCourses: publishedResult.count ?? 0,
      activeEnrollments,
      completedEnrollments,
      pendingEnrollments: pendingResult.count ?? 0,
      activeOrganizations: activeOrgsResult.count ?? 0,
      completionRate: totalForCompletion ? (completedEnrollments / totalForCompletion) * 100 : 0,
      averageProgress,
    },
    trend,
    topCourses,
    recentActivity: activityRows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      createdAt: row.created_at,
      userName: row.profiles?.full_name ?? null,
      userRole: row.profiles?.role ?? null,
    })),
    recentRegistrations: (registrationsResult.data ?? []).map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
    })),
    categoryBreakdown,
  };
}
