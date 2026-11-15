import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CourseRow, Paginated } from '@/types/app';
import type { CourseCardData } from '@/types/app';

type CategoryEmbed = { id: string; name: string; color: string; slug: string };
type InstructorEmbed = { id: string; full_name: string; avatar_url: string | null };
type OrganizationEmbed = { id: string; name: string; slug: string };

type CourseQueryRow = CourseRow & {
  categories: CategoryEmbed | null;
  profiles: InstructorEmbed | null;
  organizations: OrganizationEmbed | null;
};

export type CourseCard = CourseCardData & { enrollment: { id: string; status: string; progress_percent: number } | null };

function mapCourse(row: CourseQueryRow): CourseCardData {
  return {
    ...row,
    category: row.categories ? { id: row.categories.id, name: row.categories.name, color: row.categories.color, slug: row.categories.slug } : null,
    instructor: {
      id: row.profiles?.id ?? row.instructor_id,
      full_name: row.profiles?.full_name ?? 'Instructor',
      avatar_url: row.profiles?.avatar_url ?? null,
    },
    organization: row.organizations ? { id: row.organizations.id, name: row.organizations.name, slug: row.organizations.slug } : null,
  };
}

function sanitizeSearch(value: string) {
  return value.replace(/[,()%*\\]/g, ' ').trim().slice(0, 120);
}

const COURSE_SELECT =
  '*, categories(id,name,color,slug), profiles!courses_instructor_id_fkey(id,full_name,avatar_url), organizations(id,name,slug)';

export async function listPublicCourses(params: {
  search?: string;
  category?: string;
  difficulty?: string;
  sort?: 'newest' | 'popular' | 'title';
  page?: number;
  pageSize?: number;
}): Promise<Paginated<CourseCardData>> {
  const supabase = await createServerSupabaseClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, params.pageSize ?? 9));

  let categoryId: string | null = null;
  if (params.category) {
    const { data: category } = await supabase.from('categories').select('id').eq('slug', params.category).maybeSingle();
    categoryId = category?.id ?? null;
    if (!categoryId) return { items: [], page, pageSize, total: 0, totalPages: 0 };
  }

  let query = supabase
    .from('courses')
    .select(COURSE_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .is('deleted_at', null);

  if (params.search) {
    const term = sanitizeSearch(params.search);
    if (term) query = query.or(`title.ilike.%${term}%,subtitle.ilike.%${term}%,description.ilike.%${term}%`);
  }
  if (categoryId) query = query.eq('category_id', categoryId);
  if (params.difficulty) query = query.eq('difficulty', params.difficulty as CourseRow['difficulty']);

  switch (params.sort) {
    case 'popular':
      query = query.order('student_count', { ascending: false }).order('published_at', { ascending: false });
      break;
    case 'title':
      query = query.order('title', { ascending: true });
      break;
    default:
      query = query.order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw error;

  const items = (data as unknown as CourseQueryRow[]).map(mapCourse);
  const total = count ?? 0;

  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getFeaturedCourses(limit = 6): Promise<CourseCardData[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('courses')
    .select(COURSE_SELECT)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data as unknown as CourseQueryRow[]).map(mapCourse);
}

export async function getCategories() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('categories').select('*').order('name');
  return data ?? [];
}

export async function getPublicCourseDetail(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('courses')
    .select(
      '*, categories(id,name,color,slug), profiles!courses_instructor_id_fkey(id,full_name,avatar_url,headline,bio), organizations(id,name,slug,primary_color)',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle();

  if (!data) return null;
  const course = mapCourse(data as unknown as CourseQueryRow);

  const { data: curriculum } = await supabase.rpc('get_course_curriculum', { p_course: course.id });
  const { data: related } = await supabase
    .from('courses')
    .select(COURSE_SELECT)
    .eq('status', 'published')
    .is('deleted_at', null)
    .neq('id', course.id)
    .order('student_count', { ascending: false })
    .limit(3);

  const instructor = data.profiles as { id: string; full_name: string; avatar_url: string | null; headline: string | null; bio: string | null } | null;

  return {
    course,
    instructor,
    curriculum: curriculum ?? [],
    related: (related as unknown as CourseQueryRow[]).map(mapCourse),
  };
}

export async function getUserEnrollmentForCourse(courseId: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('enrollments')
    .select('id, status, progress_percent, completed_at')
    .eq('course_id', courseId)
    .eq('student_id', userId)
    .maybeSingle();
  return data;
}

export async function getCourseIdBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('courses').select('id, slug, title').eq('slug', slug).maybeSingle();
  return data;
}
