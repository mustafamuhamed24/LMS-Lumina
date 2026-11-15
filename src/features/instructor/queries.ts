import 'server-only';

import { format, startOfMonth, subMonths } from 'date-fns';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getInstructorCourseIds } from '@/lib/data/scope';
import type { SessionUser } from '@/types/app';

export async function getInstructorDashboard(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const courseIds = await getInstructorCourseIds(user.id);

  const empty = {
    courseIds,
    stats: {
      courses: 0,
      publishedCourses: 0,
      students: 0,
      activeStudents: 0,
      completions: 0,
      pendingGrading: 0,
      averageProgress: 0,
      certificates: 0,
    },
    trend: [] as { month: string; enrollments: number; completions: number }[],
    courses: [] as InstructorCourseSummary[],
    recentStudents: [] as { id: string; name: string; email: string; course: string; enrolledAt: string; progress: number }[],
    pendingSubmissions: [] as GradingRow[],
    upcomingDeadlines: [] as { id: string; title: string; course: string; dueAt: string; submissions: number }[],
  };

  if (!courseIds.length) return empty;

  const [coursesResult, enrollmentsResult, submissionsResult, certificatesResult] = await Promise.all([
    supabase
      .from('courses')
      .select('id,title,slug,status,thumbnail_url,student_count,lesson_count,duration_minutes,updated_at,is_featured')
      .in('id', courseIds)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false }),
    supabase
      .from('enrollments')
      .select('id,student_id,course_id,status,progress_percent,enrolled_at,completed_at,profiles!enrollments_student_id_fkey(full_name,email)')
      .in('course_id', courseIds)
      .order('enrolled_at', { ascending: false }),
    supabase
      .from('assignment_submissions')
      .select(
        'id,status,grade,submitted_at,student_id,assignment_id,student:profiles!assignment_submissions_student_id_fkey(full_name,email),assignment:assignments!assignment_submissions_assignment_id_fkey(id,title,max_points,course_id,course:courses(id,title))',
      )
      .in('status', ['submitted', 'returned'])
      .order('submitted_at', { ascending: false })
      .limit(20),
    supabase.from('certificates').select('id', { count: 'exact', head: true }).in('course_id', courseIds),
  ]);

  const courses = (coursesResult.data ?? []) as unknown as InstructorCourseSummary[];
  const enrollments = (enrollmentsResult.data ?? []) as unknown as {
    id: string;
    student_id: string;
    course_id: string;
    status: string;
    progress_percent: number;
    enrolled_at: string;
    completed_at: string | null;
    profiles: { full_name: string; email: string } | null;
  }[];

  const active = enrollments.filter((enrollment) => enrollment.status === 'active');
  const completed = enrollments.filter((enrollment) => enrollment.status === 'completed');
  const averageProgress = enrollments.length
    ? enrollments.reduce((sum, enrollment) => sum + Number(enrollment.progress_percent), 0) / enrollments.length
    : 0;

  const monthMap = new Map<string, { enrollments: number; completions: number }>();
  for (let index = 5; index >= 0; index -= 1) {
    const month = format(subMonths(startOfMonth(new Date()), index), 'yyyy-MM');
    monthMap.set(month, { enrollments: 0, completions: 0 });
  }
  for (const enrollment of enrollments) {
    const enrollmentBucket = monthMap.get(format(new Date(enrollment.enrolled_at), 'yyyy-MM'));
    if (enrollmentBucket) enrollmentBucket.enrollments += 1;
    if (enrollment.completed_at) {
      const completionBucket = monthMap.get(format(new Date(enrollment.completed_at), 'yyyy-MM'));
      if (completionBucket) completionBucket.completions += 1;
    }
  }

  const courseMap = new Map(courses.map((course) => [course.id, course.title]));
  const submissions = (submissionsResult.data ?? []) as unknown as GradingRow[];

  const { data: assignmentRows } = await supabase
    .from('assignments')
    .select('id,title,due_at,course_id')
    .in('course_id', courseIds)
    .not('due_at', 'is', null)
    .gte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })
    .limit(5);

  const assignmentIds = (assignmentRows ?? []).map((assignment) => assignment.id);
  const submissionCounts = new Map<string, number>();
  if (assignmentIds.length) {
    const { data: countRows } = await supabase
      .from('assignment_submissions')
      .select('assignment_id')
      .in('assignment_id', assignmentIds);
    for (const row of countRows ?? []) {
      submissionCounts.set(row.assignment_id, (submissionCounts.get(row.assignment_id) ?? 0) + 1);
    }
  }

  return {
    courseIds,
    stats: {
      courses: courses.length,
      publishedCourses: courses.filter((course) => course.status === 'published').length,
      students: new Set(enrollments.map((enrollment) => enrollment.student_id)).size,
      activeStudents: active.length,
      completions: completed.length,
      pendingGrading: submissions.length,
      averageProgress,
      certificates: certificatesResult.count ?? 0,
    },
    trend: [...monthMap.entries()].map(([month, values]) => ({
      month: format(new Date(`${month}-01T00:00:00`), 'MMM'),
      ...values,
    })),
    courses,
    recentStudents: enrollments.slice(0, 8).map((enrollment) => ({
      id: enrollment.id,
      name: enrollment.profiles?.full_name ?? 'Student',
      email: enrollment.profiles?.email ?? '',
      course: courseMap.get(enrollment.course_id) ?? 'Course',
      enrolledAt: enrollment.enrolled_at,
      progress: Number(enrollment.progress_percent),
    })),
    pendingSubmissions: submissions.slice(0, 6),
    upcomingDeadlines: (assignmentRows ?? []).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      course: courseMap.get(assignment.course_id) ?? 'Course',
      dueAt: assignment.due_at!,
      submissions: submissionCounts.get(assignment.id) ?? 0,
    })),
  };
}

export type InstructorCourseSummary = {
  id: string;
  title: string;
  slug: string;
  status: string;
  thumbnail_url: string | null;
  student_count: number;
  lesson_count: number;
  duration_minutes: number;
  updated_at: string;
  is_featured: boolean;
};

export type GradingRow = {
  id: string;
  status: string;
  grade: number | null;
  submitted_at: string;
  student_id: string;
  assignment_id: string;
  student: { full_name: string; email: string } | null;
  assignment: {
    id: string;
    title: string;
    max_points: number;
    course_id: string;
    course: { id: string; title: string } | null;
  } | null;
};

export async function listInstructorCourses(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const courseIds = await getInstructorCourseIds(user.id);
  if (!courseIds.length) return [];
  const { data } = await supabase
    .from('courses')
    .select('id,title,slug,status,thumbnail_url,student_count,lesson_count,duration_minutes,updated_at,is_featured,organization:organizations(name)')
    .in('id', courseIds)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
  return (data ?? []) as unknown as (InstructorCourseSummary & { organization: { name: string } | null })[];
}

export async function getCourseBuilder(user: SessionUser, courseId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: canManage } = await supabase.rpc('is_course_manager', { p_course: courseId });
  if (!canManage) return null;

  const [{ data: course }, { data: sections }, { data: lessons }, { data: resources }, { data: quizzes }, { data: assignments }] =
    await Promise.all([
      supabase.from('courses').select('*, organization:organizations(id,name)').eq('id', courseId).is('deleted_at', null).maybeSingle(),
      supabase.from('course_sections').select('*').eq('course_id', courseId).order('position'),
      supabase.from('lessons').select('*').eq('course_id', courseId).order('position'),
      supabase.from('lesson_resources').select('*').order('created_at'),
      supabase.from('quizzes').select('*').eq('course_id', courseId),
      supabase.from('assignments').select('*').eq('course_id', courseId),
    ]);

  if (!course) return null;

  const quizzesList = quizzes ?? [];
  const quizIds = quizzesList.map((quiz) => quiz.id);
  const [{ data: questions }, { data: options }] = quizIds.length
    ? await Promise.all([
        supabase.from('questions').select('*').in('quiz_id', quizIds).order('position'),
        supabase.from('quiz_options').select('*').order('position'),
      ])
    : [{ data: [] as import('@/types/app').QuestionRow[] }, { data: [] as import('@/types/app').QuizOptionRow[] }];

  const questionIds = new Set((questions ?? []).map((question) => question.id));
  const optionsByQuestion = new Map<string, import('@/types/app').QuizOptionRow[]>();
  for (const option of options ?? []) {
    if (!questionIds.has(option.question_id)) continue;
    optionsByQuestion.set(option.question_id, [...(optionsByQuestion.get(option.question_id) ?? []), option]);
  }

  return {
    course,
    sections: sections ?? [],
    lessons: lessons ?? [],
    resources: resources ?? [],
    quizzes: quizzesList.map((quiz) => ({
      ...quiz,
      questions: (questions ?? [])
        .filter((question) => question.quiz_id === quiz.id)
        .map((question) => ({ ...question, options: optionsByQuestion.get(question.id) ?? [] })),
    })),
    assignments: assignments ?? [],
  };
}

export type CourseBuilderData = NonNullable<Awaited<ReturnType<typeof getCourseBuilder>>>;

export async function listInstructorStudents(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const courseIds = await getInstructorCourseIds(user.id);
  if (!courseIds.length) return [];
  const { data } = await supabase
    .from('enrollments')
    .select(
      'id,status,progress_percent,enrolled_at,completed_at,student_id,profiles!enrollments_student_id_fkey(id,full_name,email,avatar_url),courses!enrollments_course_id_fkey(id,title,slug)',
    )
    .in('course_id', courseIds)
    .order('enrolled_at', { ascending: false })
    .limit(500);
  return (data ?? []) as unknown as {
    id: string;
    status: string;
    progress_percent: number;
    enrolled_at: string;
    completed_at: string | null;
    student_id: string;
    profiles: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
    courses: { id: string; title: string; slug: string } | null;
  }[];
}

export async function listInstructorGrading(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const courseIds = await getInstructorCourseIds(user.id);
  if (!courseIds.length) return [];
  const { data } = await supabase
    .from('assignment_submissions')
    .select(
      'id,status,grade,feedback,submitted_at,content_text,storage_path,file_name,student_id,student:profiles!assignment_submissions_student_id_fkey(full_name,email),assignment:assignments!assignment_submissions_assignment_id_fkey(id,title,max_points,grading_criteria,course_id,course:courses(id,title,slug))',
    )
    .order('submitted_at', { ascending: false })
    .limit(300);

  return ((data ?? []) as unknown as (GradingRow & {
    feedback: string | null;
    content_text: string | null;
    storage_path: string | null;
    file_name: string | null;
    assignment: {
      id: string;
      title: string;
      max_points: number;
      grading_criteria: string | null;
      course_id: string;
      course: { id: string; title: string; slug: string } | null;
    } | null;
  })[]).filter((row) => row.assignment?.course && courseIds.includes(row.assignment.course_id));
}

export async function listInstructorAssignments(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const courseIds = await getInstructorCourseIds(user.id);
  if (!courseIds.length) return [];
  const { data } = await supabase
    .from('assignments')
    .select('id,title,due_at,max_points,created_at,course_id,lesson_id,course:courses(id,title,slug)')
    .in('course_id', courseIds)
    .order('created_at', { ascending: false });
  const assignmentIds = (data ?? []).map((assignment) => assignment.id);
  const { data: submissions } = assignmentIds.length
    ? await supabase.from('assignment_submissions').select('assignment_id,status').in('assignment_id', assignmentIds)
    : { data: [] };
  const counts = new Map<string, { total: number; pending: number; graded: number }>();
  for (const submission of submissions ?? []) {
    const current = counts.get(submission.assignment_id) ?? { total: 0, pending: 0, graded: 0 };
    current.total += 1;
    if (submission.status === 'submitted' || submission.status === 'returned') current.pending += 1;
    if (submission.status === 'graded') current.graded += 1;
    counts.set(submission.assignment_id, current);
  }
  return (data ?? []).map((assignment) => ({
    ...assignment,
    counts: counts.get(assignment.id) ?? { total: 0, pending: 0, graded: 0 },
  })) as unknown as {
    id: string;
    title: string;
    due_at: string | null;
    max_points: number;
    created_at: string;
    course_id: string;
    lesson_id: string;
    course: { id: string; title: string; slug: string } | null;
    counts: { total: number; pending: number; graded: number };
  }[];
}

export async function getInstructorAnalytics(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const courseIds = await getInstructorCourseIds(user.id);
  if (!courseIds.length) {
    return {
      completionByCourse: [] as { name: string; rate: number; students: number }[],
      gradeBuckets: [] as { name: string; value: number }[],
      monthly: [] as { month: string; enrollments: number; completions: number }[],
    };
  }

  const [{ data: courses }, { data: enrollments }, { data: submissions }] = await Promise.all([
    supabase.from('courses').select('id,title').in('id', courseIds),
    supabase.from('enrollments').select('course_id,status,progress_percent,enrolled_at,completed_at').in('course_id', courseIds),
    supabase.from('assignment_submissions').select('grade,assignment:assignments!assignment_submissions_assignment_id_fkey(course_id,max_points)').limit(1000),
  ]);

  const courseTitles = new Map((courses ?? []).map((course) => [course.id, course.title]));
  const courseStats = new Map<string, { total: number; completed: number }>();
  const monthMap = new Map<string, { enrollments: number; completions: number }>();
  for (let index = 5; index >= 0; index -= 1) {
    const month = format(subMonths(startOfMonth(new Date()), index), 'yyyy-MM');
    monthMap.set(month, { enrollments: 0, completions: 0 });
  }

  for (const enrollment of enrollments ?? []) {
    const current = courseStats.get(enrollment.course_id) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (enrollment.status === 'completed') current.completed += 1;
    courseStats.set(enrollment.course_id, current);
    const enrollmentBucket = monthMap.get(format(new Date(enrollment.enrolled_at), 'yyyy-MM'));
    if (enrollmentBucket) enrollmentBucket.enrollments += 1;
    if (enrollment.completed_at) {
      const completionBucket = monthMap.get(format(new Date(enrollment.completed_at), 'yyyy-MM'));
      if (completionBucket) completionBucket.completions += 1;
    }
  }

  const buckets = [
    { name: '0–59%', value: 0 },
    { name: '60–69%', value: 0 },
    { name: '70–79%', value: 0 },
    { name: '80–89%', value: 0 },
    { name: '90–100%', value: 0 },
  ];
  for (const submission of submissions ?? []) {
    const assignment = submission.assignment as unknown as { course_id: string; max_points: number } | null;
    if (!assignment || !courseIds.includes(assignment.course_id) || submission.grade === null) continue;
    const ratio = (Number(submission.grade) / assignment.max_points) * 100;
    const bucket =
      ratio < 60 ? buckets[0] : ratio < 70 ? buckets[1] : ratio < 80 ? buckets[2] : ratio < 90 ? buckets[3] : buckets[4];
    if (bucket) bucket.value += 1;
  }

  return {
    completionByCourse: [...courseStats.entries()].map(([id, stats]) => ({
      name: courseTitles.get(id) ?? 'Course',
      rate: stats.total ? Math.round((stats.completed / stats.total) * 100) : 0,
      students: stats.total,
    })),
    gradeBuckets: buckets,
    monthly: [...monthMap.entries()].map(([month, values]) => ({
      month: format(new Date(`${month}-01T00:00:00`), 'MMM'),
      ...values,
    })),
  };
}
