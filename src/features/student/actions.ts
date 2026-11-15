'use server';

import 'server-only';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStudent } from '@/lib/auth/session';
import { actionError, zodFieldErrors } from '@/lib/action-result';
import {
  instructorRequestSchema,
  lessonProgressSchema,
  quizStartSchema,
  quizSubmitSchema,
  submissionSchema,
} from '@/lib/validations';
import type { FormState } from '@/lib/form-state';
import type { QuizSubmitState } from '@/features/student/quiz-state';

const MAX_SUBMISSION_BYTES = 25 * 1024 * 1024;

function failure(message: string, fieldErrors?: Record<string, string[]>): FormState {
  return { status: 'error', message, fieldErrors };
}

export async function markLessonCompleteAction(formData: FormData): Promise<void> {
  const parsed = lessonProgressSchema.safeParse({ lessonId: formData.get('lessonId') });
  if (!parsed.success) return;
  const user = await requireStudent();

  try {
    const supabase = await createServerSupabaseClient();
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id,course_id,course:courses!lessons_course_id_fkey(slug)')
      .eq('id', parsed.data.lessonId)
      .maybeSingle();

    const { error } = await supabase.rpc('record_lesson_progress', {
      p_lesson_id: parsed.data.lessonId,
      p_completed: true,
    });
    if (error) throw error;

    if (lesson) {
      const course = lesson.course as unknown as { slug: string } | null;
      revalidatePath(`/learn/${course?.slug ?? ''}`);
      revalidatePath(`/learn/${course?.slug ?? ''}/${lesson.id}`);
      revalidatePath('/student/my-courses');
      revalidatePath('/student');
      revalidatePath('/student/certificates');
      await createAdminClient().from('activity_logs').insert({
        user_id: user.id,
        action: 'lesson.completed',
        entity_type: 'lesson',
        entity_id: lesson.id,
        metadata: { course_id: lesson.course_id },
      });
    }
  } catch (error) {
    actionError(error, 'markLessonComplete');
  }
}

export async function startQuizAttemptAction(formData: FormData): Promise<void> {
  const parsed = quizStartSchema.safeParse({ quizId: formData.get('quizId') });
  if (!parsed.success) return;
  await requireStudent();

  let destination: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id,lesson_id,course_id,lesson:lessons!quizzes_lesson_id_fkey(id,title),course:courses!quizzes_course_id_fkey(slug)')
      .eq('id', parsed.data.quizId)
      .maybeSingle();
    if (!quiz) return;

    const { data, error } = await supabase.rpc('start_quiz_attempt', { p_quiz_id: quiz.id });
    if (error) throw error;
    const attempt = Array.isArray(data) ? data[0] : data;
    if (!attempt) return;

    const course = quiz.course as unknown as { slug: string } | null;
    if (course?.slug) {
      destination = `/learn/${course.slug}/${quiz.lesson_id}?attempt=${attempt.attempt_id}`;
    }
  } catch (error) {
    actionError(error, 'startQuizAttempt');
    return;
  }

  if (destination) redirect(destination);
}

export async function submitQuizAttemptAction(_prev: QuizSubmitState, formData: FormData): Promise<QuizSubmitState> {
  let answers: unknown;
  try {
    answers = JSON.parse(String(formData.get('answers') ?? '[]'));
  } catch {
    return { status: 'error', message: 'The quiz answers could not be read.' };
  }

  const parsed = quizSubmitSchema.safeParse({
    attemptId: formData.get('attemptId'),
    answers,
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Please answer the questions before submitting.', fieldErrors: zodFieldErrors(parsed.error) };
  }

  await requireStudent();

  try {
    const supabase = await createServerSupabaseClient();
    const { data: attemptRow } = await supabase
      .from('quiz_attempts')
      .select('id,quiz_id,quiz:quizzes!quiz_attempts_quiz_id_fkey(id,lesson_id,course_id,title,passing_score,course:courses!quizzes_course_id_fkey(slug))')
      .eq('id', parsed.data.attemptId)
      .maybeSingle();
    if (!attemptRow) return { status: 'error', message: 'This quiz attempt could not be found.' };

    const payload = parsed.data.answers.map((answer) => ({
      question_id: answer.questionId,
      selected_option_ids: answer.optionIds,
      answer_text: answer.text ?? null,
    }));

    const { data, error } = await supabase.rpc('submit_quiz_attempt', {
      p_attempt_id: parsed.data.attemptId,
      p_answers: payload,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) return { status: 'error', message: 'The quiz could not be graded.' };

    const quiz = attemptRow.quiz as unknown as {
      lesson_id: string;
      title: string;
      passing_score: number;
      course: { slug: string } | null;
    } | null;

    if (result.passed && quiz) {
      await supabase.rpc('record_lesson_progress', { p_lesson_id: quiz.lesson_id, p_completed: true });
    }

    if (quiz?.course?.slug) {
      revalidatePath(`/learn/${quiz.course.slug}/${quiz.lesson_id}`);
      revalidatePath(`/learn/${quiz.course.slug}`);
    }
    revalidatePath('/student');
    revalidatePath('/student/my-courses');
    revalidatePath('/student/certificates');

    return {
      status: 'success',
      message: result.passed
        ? `You passed with ${result.score}%.`
        : `You scored ${result.score}%. The passing score is ${quiz?.passing_score ?? 70}%.`,
      result: {
        score: Number(result.score),
        passed: result.passed,
        correct: result.correct_answers,
        total: result.total_questions,
        attemptsUsed: result.attempts_used,
        maxAttempts: result.max_attempts,
      },
    };
  } catch (error) {
    const result = actionError(error, 'submitQuizAttempt');
    return { status: 'error', message: result.ok ? 'Unable to submit the quiz.' : result.error };
  }
}

export async function requestInstructorAccessAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = instructorRequestSchema.safeParse({ message: formData.get('message') });
  if (!parsed.success) return failure('Please review your request.', zodFieldErrors(parsed.error));

  const user = await requireStudent();
  const orgId = user.activeOrg?.id ?? user.profile.default_org_id;
  if (!orgId) return failure('No organization is available for your request. Please contact support.');

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('instructor_requests').insert({
      user_id: user.id,
      org_id: orgId,
      status: 'pending',
      message: parsed.data.message,
    });

    if (error) {
      if (error.code === '23505') return { status: 'success', message: 'You already have a pending instructor request.' };
      throw error;
    }

    const admin = createAdminClient();
    const { data: admins } = await admin
      .from('profiles')
      .select('id')
      .eq('default_org_id', orgId)
      .eq('role', 'org_admin')
      .eq('status', 'active');

    if (admins?.length) {
      await admin.from('notifications').insert(
        admins.map((adminUser) => ({
          org_id: orgId,
          user_id: adminUser.id,
          type: 'system' as const,
          title: 'New instructor request',
          body: `${user.profile.full_name} asked to teach on Lumina.`,
          link: '/admin/users',
        })),
      );
    }

    await admin.from('activity_logs').insert({
      org_id: orgId,
      user_id: user.id,
      action: 'instructor.requested',
      entity_type: 'profile',
      entity_id: user.id,
      metadata: { email: user.email },
    });

    revalidatePath('/student/become-instructor');
    revalidatePath('/admin/users');
    return { status: 'success', message: 'Request submitted. An organization administrator will review it.' };
  } catch (error) {
    const result = actionError(error, 'requestInstructorAccess');
    return failure(result.ok ? 'Unable to submit your request.' : result.error);
  }
}

export async function submitAssignmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = submissionSchema.safeParse({
    assignmentId: formData.get('assignmentId'),
    contentText: formData.get('contentText'),
  });
  if (!parsed.success) return failure('Please review your submission.', zodFieldErrors(parsed.error));

  const user = await requireStudent();
  const file = formData.get('file');

  try {
    const supabase = await createServerSupabaseClient();
    const { data: assignment } = await supabase
      .from('assignments')
      .select(
        'id,org_id,course_id,lesson_id,title,max_points,grading_criteria,due_at,course:courses!assignments_course_id_fkey(id,title,slug),lesson:lessons!assignments_lesson_id_fkey(id,title)',
      )
      .eq('id', parsed.data.assignmentId)
      .maybeSingle();
    if (!assignment) return failure('Assignment not found.');

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id,status')
      .eq('course_id', assignment.course_id)
      .eq('student_id', user.id)
      .maybeSingle();
    if (!enrollment || !['active', 'completed'].includes(enrollment.status)) {
      return failure('You must be enrolled in this course to submit the assignment.');
    }

    const { data: existing } = await supabase
      .from('assignment_submissions')
      .select('id,status,grade,storage_path')
      .eq('assignment_id', assignment.id)
      .eq('student_id', user.id)
      .maybeSingle();

    if (existing?.status === 'graded') {
      return failure('This assignment has already been graded and can no longer be changed.');
    }

    let storagePath = existing?.storage_path ?? null;
    let fileName: string | null = null;
    let mimeType: string | null = null;
    let sizeBytes: number | null = null;
    let uploadedPath: string | null = null;

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_SUBMISSION_BYTES) return failure('Files must be 25 MB or smaller.');
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
      uploadedPath = `${assignment.course_id}/${assignment.id}/${user.id}/${randomUUID()}.${extension}`;
      const admin = createAdminClient();
      const { error: uploadError } = await admin.storage.from('submissions').upload(uploadedPath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
      if (uploadError) throw uploadError;
      storagePath = uploadedPath;
      fileName = file.name.slice(0, 200);
      mimeType = file.type || 'application/octet-stream';
      sizeBytes = file.size;
    } else if (existing) {
      const { data: previous } = await supabase
        .from('assignment_submissions')
        .select('file_name,mime_type,size_bytes')
        .eq('id', existing.id)
        .maybeSingle();
      fileName = previous?.file_name ?? null;
      mimeType = previous?.mime_type ?? null;
      sizeBytes = previous?.size_bytes ?? null;
    }

    if (!parsed.data.contentText && !storagePath) {
      return failure('Add a written response or attach a file.');
    }

    const values = {
      content_text: parsed.data.contentText,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      status: 'submitted' as const,
      submitted_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase.from('assignment_submissions').update(values).eq('id', existing.id)
      : await supabase.from('assignment_submissions').insert({
          org_id: assignment.org_id,
          assignment_id: assignment.id,
          student_id: user.id,
          ...values,
        });
    if (error) {
      if (uploadedPath) await createAdminClient().storage.from('submissions').remove([uploadedPath]);
      throw error;
    }

    if (uploadedPath && existing?.storage_path) {
      await createAdminClient().storage.from('submissions').remove([existing.storage_path]);
    }

    const admin = createAdminClient();
    await supabase.rpc('record_lesson_progress', { p_lesson_id: assignment.lesson_id, p_completed: true });
    await admin.from('notifications').insert({
      org_id: assignment.org_id,
      user_id: user.id,
      type: 'assignment',
      title: 'Submission received',
      body: `Your submission for "${assignment.title}" was received and is awaiting review.`,
      link: '/student/assignments',
    });
    await admin.from('activity_logs').insert({
      org_id: assignment.org_id,
      user_id: user.id,
      action: 'submission.created',
      entity_type: 'assignment_submission',
      entity_id: assignment.id,
      metadata: { course_id: assignment.course_id },
    });

    const course = assignment.course as unknown as { slug: string } | null;
    if (course?.slug) revalidatePath(`/learn/${course.slug}/${assignment.lesson_id}`);
    revalidatePath('/student/assignments');
    revalidatePath('/student');
    revalidatePath('/instructor/assignments');

    return { status: 'success', message: 'Submission received. Your instructor will review it shortly.' };
  } catch (error) {
    const result = actionError(error, 'submitAssignment');
    return failure(result.ok ? 'Unable to submit the assignment.' : result.error);
  }
}
