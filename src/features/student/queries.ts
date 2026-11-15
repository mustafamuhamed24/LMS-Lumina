import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SessionUser } from '@/types/app';
import type { CourseRow, EnrollmentRow, LessonRow, SectionRow, AssignmentRow, SubmissionRow, CertificateRow, QuizAttemptRow, QuizRow, ResourceRow, QuestionRow, QuizOptionRow } from '@/types/app';

type StudentCourse = CourseRow & {
  instructor: { full_name: string; avatar_url: string | null; headline?: string | null } | null;
  category: { name: string; color: string } | null;
  organization: { name: string } | null;
};

export type StudentEnrollment = {
  id: string;
  status: string;
  progress_percent: number;
  enrolled_at: string;
  completed_at: string | null;
  last_accessed_at: string | null;
  course: StudentCourse;
};

export type StudentAssignmentRow = AssignmentRow & {
  course: { id: string; title: string; slug: string } | null;
  lesson: { id: string; title: string } | null;
  submission: Pick<SubmissionRow, 'id' | 'status' | 'grade' | 'feedback' | 'submitted_at' | 'graded_at'> | null;
};

export async function getStudentDashboard(user: SessionUser) {
  const supabase = await createServerSupabaseClient();

  const [{ data: enrollmentRows }, { data: certificates }, { data: notifications }, { count: unreadNotifications }] = await Promise.all([
    supabase
      .from('enrollments')
      .select(
        'id,status,progress_percent,enrolled_at,completed_at,last_accessed_at,course:courses!enrollments_course_id_fkey(id,title,slug,thumbnail_url,duration_minutes,difficulty,lesson_count,is_featured,instructor:profiles!courses_instructor_id_fkey(full_name,avatar_url),category:categories(name,color))',
      )
      .eq('student_id', user.id)
      .order('enrolled_at', { ascending: false }),
    supabase.from('certificates').select('*').eq('student_id', user.id).order('issued_at', { ascending: false }).limit(5),
    supabase
      .from('notifications')
      .select('id,title,body,link,type,read_at,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null),
  ]);

  const enrollments = (enrollmentRows ?? []) as unknown as StudentEnrollment[];
  const learning = enrollments.filter((enrollment) => enrollment.status === 'active' || enrollment.status === 'completed');
  const active = enrollments.filter((enrollment) => enrollment.status === 'active');
  const completed = enrollments.filter((enrollment) => enrollment.status === 'completed');
  const courseIds = [...new Set(learning.map((enrollment) => enrollment.course.id))];

  const [{ data: assignmentRows }, { data: submissionRows }] = courseIds.length
    ? await Promise.all([
        supabase
          .from('assignments')
          .select('id,title,due_at,max_points,course_id,lesson_id,course:courses!assignments_course_id_fkey(id,title,slug),lesson:lessons!assignments_lesson_id_fkey(id,title)')
          .in('course_id', courseIds)
          .order('due_at', { ascending: true }),
        supabase
          .from('assignment_submissions')
          .select('id,assignment_id,status,grade,feedback,submitted_at,graded_at')
          .eq('student_id', user.id),
      ])
    : [{ data: [] }, { data: [] }];

  const submissionMap = new Map((submissionRows ?? []).map((submission) => [submission.assignment_id, submission]));
  const assignments = (assignmentRows ?? []) as unknown as Omit<StudentAssignmentRow, 'submission'>[];
  const upcomingAssignments = assignments
    .filter((assignment) => assignment.due_at && new Date(assignment.due_at).getTime() > Date.now())
    .slice(0, 5)
    .map((assignment) => ({ ...assignment, submission: submissionMap.get(assignment.id) ?? null }));
  const pendingAssignments = assignments.filter((assignment) => {
    const submission = submissionMap.get(assignment.id);
    return !submission || submission.status === 'returned';
  });

  const continueLearning =
    active
      .slice()
      .sort((a, b) => new Date(b.last_accessed_at ?? b.enrolled_at).getTime() - new Date(a.last_accessed_at ?? a.enrolled_at).getTime())[0] ?? null;

  return {
    enrollments,
    learning,
    active,
    completed,
    certificates: (certificates ?? []) as CertificateRow[],
    notifications: notifications ?? [],
    unreadNotifications: unreadNotifications ?? 0,
    assignments,
    pendingAssignments,
    upcomingAssignments,
    continueLearning,
    stats: {
      activeCourses: active.length,
      completedCourses: completed.length,
      certificates: (certificates ?? []).length,
      pendingAssignments: pendingAssignments.length,
      averageProgress: learning.length
        ? learning.reduce((sum, enrollment) => sum + Number(enrollment.progress_percent), 0) / learning.length
        : 0,
    },
  };
}

export async function listStudentCourses(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('enrollments')
    .select(
      'id,status,progress_percent,enrolled_at,completed_at,last_accessed_at,course:courses!enrollments_course_id_fkey(id,title,slug,subtitle,description,thumbnail_url,duration_minutes,difficulty,lesson_count,student_count,status,instructor:profiles!courses_instructor_id_fkey(full_name,avatar_url),category:categories(name,color),organization:organizations(name))',
    )
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false });
  return (data ?? []) as unknown as StudentEnrollment[];
}

export async function listStudentAssignments(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', user.id)
    .in('status', ['active', 'completed']);
  const courseIds = [...new Set((enrollments ?? []).map((enrollment) => enrollment.course_id))];
  if (!courseIds.length) return { assignments: [] as StudentAssignmentRow[], courseIds };

  const [{ data: assignments }, { data: submissions }] = await Promise.all([
    supabase
      .from('assignments')
      .select(
        'id,org_id,course_id,lesson_id,title,instructions,due_at,max_points,grading_criteria,created_at,updated_at,course:courses!assignments_course_id_fkey(id,title,slug),lesson:lessons!assignments_lesson_id_fkey(id,title)',
      )
      .in('course_id', courseIds)
      .order('due_at', { ascending: true }),
    supabase
      .from('assignment_submissions')
      .select('id,assignment_id,status,grade,feedback,submitted_at,graded_at')
      .eq('student_id', user.id),
  ]);

  const submissionMap = new Map((submissions ?? []).map((submission) => [submission.assignment_id, submission]));
  return {
    courseIds,
    assignments: ((assignments ?? []) as unknown as Omit<StudentAssignmentRow, 'submission'>[]).map((assignment) => ({
      ...assignment,
      submission: submissionMap.get(assignment.id) ?? null,
    })),
  };
}

export async function listStudentCertificates(user: SessionUser) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false });
  return (data ?? []) as CertificateRow[];
}

export async function getStudentCertificate(user: SessionUser, certificateId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', certificateId)
    .eq('student_id', user.id)
    .maybeSingle();
  return (data ?? null) as CertificateRow | null;
}

export type LearnQuizAttempt = Pick<QuizAttemptRow, 'id' | 'attempt_number' | 'status' | 'score' | 'passed' | 'started_at' | 'submitted_at' | 'expires_at'>;

export type LearnQuizPayload = {
  id: string;
  quiz_id: string;
  status: string;
  attempt_number: number;
  expires_at: string | null;
  started_at: string;
  score: number | null;
  passed: boolean | null;
  lesson_id: string;
  course_id: string;
  quiz_title: string;
  instructions: string | null;
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number;
  show_results: boolean;
  questions: (Pick<QuestionRow, 'id' | 'prompt' | 'type' | 'points' | 'position'> & {
    options: Pick<QuizOptionRow, 'id' | 'label'>[];
  })[];
};

export type LearnDataLocked = {
  locked: true;
  course: StudentCourse;
  enrollment: Pick<EnrollmentRow, 'id' | 'status' | 'progress_percent'> | null;
};

export type LearnData = {
  locked: false;
  course: StudentCourse;
  enrollment: Pick<EnrollmentRow, 'id' | 'status' | 'progress_percent' | 'completed_at'>;
  sections: SectionRow[];
  lessons: LessonRow[];
  currentLesson: LessonRow;
  completedLessonIds: string[];
  resources: ResourceRow[];
  quiz: QuizRow | null;
  quizAttempts: LearnQuizAttempt[];
  quizAttempt: LearnQuizPayload | null;
  activeAttemptId: string | null;
  assignment: AssignmentRow | null;
  submission: SubmissionRow | null;
  previousLesson: LessonRow | null;
  nextLesson: LessonRow | null;
  position: { index: number; total: number };
};

export async function getLearnData(
  user: SessionUser,
  slug: string,
  lessonId?: string,
  attemptId?: string,
): Promise<LearnData | LearnDataLocked | null> {
  const supabase = await createServerSupabaseClient();

  const { data: courseRow } = await supabase
    .from('courses')
    .select(
      '*,instructor:profiles!courses_instructor_id_fkey(full_name,avatar_url,headline),category:categories(name,color),organization:organizations(name)',
    )
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();
  if (!courseRow) return null;
  const course = courseRow as unknown as StudentCourse;

  const { data: enrollmentRow } = await supabase
    .from('enrollments')
    .select('id,status,progress_percent,completed_at')
    .eq('course_id', course.id)
    .eq('student_id', user.id)
    .maybeSingle();

  if (!enrollmentRow || !['active', 'completed'].includes(enrollmentRow.status)) {
    return { locked: true, course, enrollment: enrollmentRow };
  }
  const enrollment = enrollmentRow as Pick<EnrollmentRow, 'id' | 'status' | 'progress_percent' | 'completed_at'>;

  const [{ data: sections }, { data: lessonRows }, { data: progressRows }] = await Promise.all([
    supabase.from('course_sections').select('*').eq('course_id', course.id).order('position'),
    supabase.from('lessons').select('*').eq('course_id', course.id).eq('is_published', true).order('position'),
    supabase.from('lesson_progress').select('lesson_id,completed_at').eq('enrollment_id', enrollment.id),
  ]);

  const lessons = (lessonRows ?? []) as LessonRow[];
  if (!lessons.length) return null;

  const requested = lessonId ? lessons.find((lesson) => lesson.id === lessonId) : undefined;
  const completedLessonIds = (progressRows ?? []).filter((row) => row.completed_at).map((row) => row.lesson_id);
  const currentLesson = requested ?? lessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ?? lessons[0]!;
  const completedSet = new Set(completedLessonIds);
  const index = lessons.findIndex((lesson) => lesson.id === currentLesson.id);
  const previousLesson = index > 0 ? lessons[index - 1] ?? null : null;
  const nextLesson = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] ?? null : null;

  const [{ data: resourceRows }, { data: quizRow }, { data: assignmentRow }] = await Promise.all([
    supabase.from('lesson_resources').select('*').eq('lesson_id', currentLesson.id).order('created_at'),
    currentLesson.type === 'quiz' ? supabase.from('quizzes').select('*').eq('lesson_id', currentLesson.id).maybeSingle() : Promise.resolve({ data: null }),
    currentLesson.type === 'assignment'
      ? supabase.from('assignments').select('*').eq('lesson_id', currentLesson.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const quiz = (quizRow ?? null) as QuizRow | null;
  let quizAttempts: LearnQuizAttempt[] = [];
  let quizAttempt: LearnQuizPayload | null = null;
  let activeAttemptId: string | null = null;

  if (quiz) {
    const { data: attemptRows } = await supabase
      .from('quiz_attempts')
      .select('id,attempt_number,status,score,passed,started_at,submitted_at,expires_at')
      .eq('quiz_id', quiz.id)
      .eq('student_id', user.id)
      .order('attempt_number', { ascending: false });
    quizAttempts = (attemptRows ?? []) as LearnQuizAttempt[];
    const inProgress = quizAttempts.find(
      (attempt) => attempt.status === 'in_progress' && (!attempt.expires_at || new Date(attempt.expires_at).getTime() > Date.now()),
    );
    activeAttemptId = inProgress?.id ?? null;
    const selectedAttemptId = attemptId && quizAttempts.some((attempt) => attempt.id === attemptId) ? attemptId : activeAttemptId;
    if (selectedAttemptId) {
      const { data: payload } = await supabase.rpc('get_quiz_attempt', { p_attempt_id: selectedAttemptId });
      quizAttempt = (payload ?? null) as LearnQuizPayload | null;
    }
  }

  let submission: SubmissionRow | null = null;
  if (assignmentRow) {
    const { data } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentRow.id)
      .eq('student_id', user.id)
      .maybeSingle();
    submission = data as SubmissionRow | null;
  }

  return {
    locked: false,
    course,
    enrollment,
    sections: (sections ?? []) as SectionRow[],
    lessons,
    currentLesson,
    completedLessonIds: completedLessonIds.filter((id) => completedSet.has(id)),
    resources: (resourceRows ?? []) as ResourceRow[],
    quiz,
    quizAttempts,
    quizAttempt,
    activeAttemptId,
    assignment: (assignmentRow ?? null) as AssignmentRow | null,
    submission,
    previousLesson,
    nextLesson,
    position: { index: index + 1, total: lessons.length },
  };
}

export async function verifyCertificate(code: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.rpc('verify_certificate', { p_code: code });
  const result = Array.isArray(data) ? data[0] : data;
  return result ?? null;
}
