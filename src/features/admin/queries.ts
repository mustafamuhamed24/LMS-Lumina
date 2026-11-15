import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminScope } from '@/lib/data/scope';
import type { ProfileRow, Role } from '@/types/app';

function sanitizeSearch(value?: string) {
  return (value ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 120);
}

export type AdminUserRow = ProfileRow & {
  organization: { id: string; name: string; slug: string } | null;
};

export async function listAdminUsers(
  scope: AdminScope,
  params: { search?: string; role?: Role; status?: 'active' | 'suspended'; org?: string; page?: number; pageSize?: number },
) {
  const supabase = await createServerSupabaseClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));

  let query = supabase
    .from('profiles')
    .select('*, organization:organizations!profiles_default_org_id_fkey(id,name,slug)', { count: 'exact' })
    .order('created_at', { ascending: false });

  const scopeOrgIds = params.org && scope.orgIds.includes(params.org) ? [params.org] : scope.orgIds;
  if (scopeOrgIds.length) query = query.in('default_org_id', scopeOrgIds);
  else query = query.eq('id', '00000000-0000-0000-0000-000000000000');

  const term = sanitizeSearch(params.search);
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  if (params.role) query = query.eq('role', params.role);
  if (params.status) query = query.eq('status', params.status);

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw error;

  return {
    items: (data ?? []) as unknown as AdminUserRow[],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export type InstructorRequestRecord = {
  id: string;
  user_id: string;
  org_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  created_at: string;
  reviewed_at: string | null;
  person: { id: string; full_name: string; email: string; avatar_url: string | null; role: Role } | null;
  organization: { id: string; name: string } | null;
};

export async function listInstructorRequests(
  scope: AdminScope,
  params: { status?: 'pending' | 'approved' | 'rejected'; limit?: number } = {},
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('instructor_requests')
    .select(
      'id,user_id,org_id,status,message,created_at,reviewed_at,person:profiles!instructor_requests_user_id_fkey(id,full_name,email,avatar_url,role),organization:organizations!instructor_requests_org_id_fkey(id,name)',
    )
    .in('org_id', scope.orgIds.length ? scope.orgIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 10);

  if (params.status) query = query.eq('status', params.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as InstructorRequestRecord[];
}

export type AdminCourseRow = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  learning_objectives: string[];
  requirements: string[];
  thumbnail_url: string | null;
  status: 'draft' | 'published' | 'archived';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_featured: boolean;
  requires_approval: boolean;
  student_count: number;
  lesson_count: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  org_id: string;
  instructor_id: string;
  category_id: string | null;
  organization: { id: string; name: string } | null;
  category: { id: string; name: string; color: string } | null;
  instructor: { id: string; full_name: string; email: string } | null;
};

export async function listAdminCourses(
  scope: AdminScope,
  params: { search?: string; status?: string; org?: string; page?: number; pageSize?: number },
) {
  const supabase = await createServerSupabaseClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, params.pageSize ?? 10));

  let query = supabase
    .from('courses')
    .select(
      'id,title,slug,subtitle,description,learning_objectives,requirements,thumbnail_url,status,difficulty,is_featured,requires_approval,student_count,lesson_count,duration_minutes,created_at,updated_at,published_at,org_id,instructor_id,category_id,organization:organizations(id,name),category:categories(id,name,color),instructor:profiles!courses_instructor_id_fkey(id,full_name,email)',
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  const scopeOrgIds = params.org && scope.orgIds.includes(params.org) ? [params.org] : scope.orgIds;
  if (scopeOrgIds.length) query = query.in('org_id', scopeOrgIds);
  else query = query.eq('id', '00000000-0000-0000-0000-000000000000');

  const term = sanitizeSearch(params.search);
  if (term) query = query.or(`title.ilike.%${term}%,subtitle.ilike.%${term}%`);
  if (params.status && ['draft', 'published', 'archived'].includes(params.status)) {
    query = query.eq('status', params.status as 'draft' | 'published' | 'archived');
  }

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw error;

  return {
    items: (data ?? []) as unknown as AdminCourseRow[],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export type AdminEnrollmentRow = {
  id: string;
  status: string;
  progress_percent: number;
  enrolled_at: string;
  completed_at: string | null;
  org_id: string;
  student: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
  course: { id: string; title: string; slug: string } | null;
  student_id: string;
  course_id: string;
};

export async function listAdminEnrollments(
  scope: AdminScope,
  params: { search?: string; status?: string; page?: number; pageSize?: number },
) {
  const supabase = await createServerSupabaseClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));

  let query = supabase
    .from('enrollments')
    .select(
      'id,status,progress_percent,enrolled_at,completed_at,org_id,student_id,course_id,student:profiles!enrollments_student_id_fkey(id,full_name,email,avatar_url),course:courses!enrollments_course_id_fkey(id,title,slug)',
      { count: 'exact' },
    )
    .in('org_id', scope.orgIds.length ? scope.orgIds : ['00000000-0000-0000-0000-000000000000'])
    .order('enrolled_at', { ascending: false });

  if (params.status) query = query.eq('status', params.status as 'pending' | 'active' | 'completed' | 'rejected' | 'cancelled');

  const term = sanitizeSearch(params.search);
  if (term) {
    const { data: courseMatches } = await supabase
      .from('courses')
      .select('id')
      .or(`title.ilike.%${term}%,slug.ilike.%${term}%`)
      .limit(100);
    const ids = (courseMatches ?? []).map((course) => course.id);
    if (ids.length) query = query.in('course_id', ids);
    else query = query.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw error;

  return {
    items: (data ?? []) as unknown as AdminEnrollmentRow[],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function getAdminCategories(scope: AdminScope) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('categories')
    .select('*, courses(count)')
    .order('name', { ascending: true });
  if (scope.orgIds.length) query = query.in('org_id', scope.orgIds);
  else query = query.eq('org_id', '00000000-0000-0000-0000-000000000000');
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as (import('@/types/app').Category & {
    courses: { count: number }[];
  })[];
}

export async function getOrgInstructors(orgIds: string[]) {
  const supabase = await createServerSupabaseClient();
  if (!orgIds.length) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,email,role,status,default_org_id')
    .in('default_org_id', orgIds)
    .in('role', ['instructor', 'org_admin'])
    .eq('status', 'active')
    .order('full_name');
  if (error) throw error;
  return data ?? [];
}

export async function getOrgStudents(orgIds: string[]) {
  const supabase = await createServerSupabaseClient();
  if (!orgIds.length) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,email,default_org_id')
    .in('default_org_id', orgIds)
    .eq('role', 'student')
    .eq('status', 'active')
    .order('full_name')
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function getAdminCourseOptions(scope: AdminScope) {
  const supabase = await createServerSupabaseClient();
  if (!scope.orgIds.length) return [];
  const { data } = await supabase
    .from('courses')
    .select('id,title,org_id,status')
    .in('org_id', scope.orgIds)
    .is('deleted_at', null)
    .order('title');
  return data ?? [];
}

export async function getAdminAnalytics(scope: AdminScope) {
  const supabase = await createServerSupabaseClient();
  const orgIds = scope.orgIds;
  if (!orgIds.length) {
    return {
      statusCounts: [] as { name: string; value: number }[],
      difficultyCounts: [] as { name: string; value: number }[],
      monthly: [] as { month: string; enrollments: number; completions: number }[],
      topStudents: [] as { id: string; name: string; email: string; courses: number; completed: number; progress: number }[],
      certificates: 0,
      assignmentSubmissions: 0,
      gradedSubmissions: 0,
    };
  }

  const [{ data: courses }, { data: enrollments }, { data: certificates }, { data: submissions }] = await Promise.all([
    supabase.from('courses').select('status,difficulty').in('org_id', orgIds).is('deleted_at', null),
    supabase
      .from('enrollments')
      .select('student_id,status,progress_percent,enrolled_at,completed_at')
      .in('org_id', orgIds),
    supabase.from('certificates').select('id', { count: 'exact', head: true }).in('org_id', orgIds),
    supabase.from('assignment_submissions').select('status').in('org_id', orgIds),
  ]);

  const statusMap = new Map<string, number>();
  const difficultyMap = new Map<string, number>();
  for (const course of courses ?? []) {
    statusMap.set(course.status, (statusMap.get(course.status) ?? 0) + 1);
    difficultyMap.set(course.difficulty, (difficultyMap.get(course.difficulty) ?? 0) + 1);
  }

  const monthMap = new Map<string, { enrollments: number; completions: number }>();
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - monthsAgo);
    monthMap.set(date.toISOString().slice(0, 7), { enrollments: 0, completions: 0 });
  }
  for (const enrollment of enrollments ?? []) {
    const key = enrollment.enrolled_at.slice(0, 7);
    const bucket = monthMap.get(key);
    if (bucket) bucket.enrollments += 1;
    if (enrollment.completed_at) {
      const completedBucket = monthMap.get(enrollment.completed_at.slice(0, 7));
      if (completedBucket) completedBucket.completions += 1;
    }
  }

  const studentMap = new Map<string, { courses: number; completed: number; progress: number }>();
  for (const enrollment of enrollments ?? []) {
    const current = studentMap.get(enrollment.student_id) ?? { courses: 0, completed: 0, progress: 0 };
    current.courses += 1;
    if (enrollment.status === 'completed') current.completed += 1;
    current.progress += Number(enrollment.progress_percent);
    studentMap.set(enrollment.student_id, current);
  }

  const topIds = [...studentMap.entries()]
    .sort((a, b) => b[1].completed - a[1].completed || b[1].courses - a[1].courses)
    .slice(0, 8)
    .map(([id]) => id);

  const { data: profiles } = topIds.length
    ? await supabase.from('profiles').select('id,full_name,email').in('id', topIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return {
    statusCounts: [...statusMap.entries()].map(([name, value]) => ({ name, value })),
    difficultyCounts: [...difficultyMap.entries()].map(([name, value]) => ({ name, value })),
    monthly: [...monthMap.entries()].map(([month, values]) => ({
      month: new Date(`${month}-01T00:00:00`).toLocaleString('en-US', { month: 'short' }),
      ...values,
    })),
    topStudents: topIds.map((id) => {
      const stats = studentMap.get(id)!;
      const profile = profileMap.get(id);
      return {
        id,
        name: profile?.full_name ?? 'Student',
        email: profile?.email ?? '',
        courses: stats.courses,
        completed: stats.completed,
        progress: stats.courses ? stats.progress / stats.courses : 0,
      };
    }),
    certificates: certificates?.length ?? 0,
    assignmentSubmissions: submissions?.length ?? 0,
    gradedSubmissions: (submissions ?? []).filter((submission) => submission.status === 'graded').length,
  };
}
