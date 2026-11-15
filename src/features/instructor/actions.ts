'use server';

import 'server-only';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireInstructor } from '@/lib/auth/session';
import { actionError, AuthorizationError, zodFieldErrors } from '@/lib/action-result';
import {
  assignmentSchema,
  courseSchema,
  courseStatusSchema,
  gradeSubmissionSchema,
  lessonSchema,
  questionSaveSchema,
  quizSchema,
  resourceDeleteSchema,
  resourceSchema,
  reorderSchema,
  sectionSchema,
  sectionUpdateSchema,
  lessonUpdateSchema,
} from '@/lib/validations';
import { slugify } from '@/lib/utils';
import { sanitizeRichText } from '@/lib/sanitize';
import type { FormState } from '@/lib/form-state';

function failure(message: string, fieldErrors?: Record<string, string[]>): FormState {
  return { status: 'error', message, fieldErrors };
}

async function managerClient(courseId: string) {
  await requireInstructor();
  const supabase = await createServerSupabaseClient();
  const { data: canManage } = await supabase.rpc('is_course_manager', { p_course: courseId });
  if (!canManage) throw new AuthorizationError('You do not manage this course.');
  return supabase;
}

async function courseForLesson(lessonId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: lesson } = await supabase.from('lessons').select('id,course_id,section_id,title,type').eq('id', lessonId).maybeSingle();
  if (!lesson) throw new AuthorizationError('Lesson not found.');
  const client = await managerClient(lesson.course_id);
  return { supabase: client, lesson };
}

async function courseIdForAssignment(assignmentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('assignments').select('id,course_id,title').eq('id', assignmentId).maybeSingle();
  if (!data) throw new AuthorizationError('Assignment not found.');
  const client = await managerClient(data.course_id);
  return { supabase: client, assignment: data };
}

async function uniqueCourseSlug(orgId: string, title: string) {
  const supabase = await createServerSupabaseClient();
  const root = slugify(title) || 'course';
  let candidate = root;
  for (let attempt = 1; attempt < 60; attempt += 1) {
    const { data } = await supabase.from('courses').select('id').eq('org_id', orgId).eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${root}-${attempt + 1}`;
  }
  return `${root}-${randomUUID().slice(0, 8)}`;
}

// ── Courses ──────────────────────────────────────────────────────────────────

export async function createInstructorCourseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireInstructor();

  try {
    const orgId = String(formData.get('orgId') ?? '');
    const membership = user.profile.memberships.find((item) => item.orgId === orgId);
    if (!membership) return failure('Choose an organization you belong to.');

    const parsed = courseSchema.safeParse({
      orgId,
      instructorId: user.id,
      categoryId: formData.get('categoryId'),
      title: formData.get('title'),
      subtitle: formData.get('subtitle'),
      description: formData.get('description'),
      difficulty: formData.get('difficulty'),
      durationMinutes: formData.get('durationMinutes'),
      requiresApproval: formData.get('requiresApproval'),
      isFeatured: formData.get('isFeatured'),
      learningObjectives: formData.get('learningObjectives'),
      requirements: formData.get('requirements'),
      thumbnailUrl: formData.get('thumbnailUrl'),
    });
    if (!parsed.success) return failure('Please review the course details.', zodFieldErrors(parsed.error));

    const supabase = await createServerSupabaseClient();
    const slug = await uniqueCourseSlug(orgId, parsed.data.title);
    const { data, error } = await supabase
      .from('courses')
      .insert({
        org_id: orgId,
        instructor_id: user.id,
        category_id: parsed.data.categoryId,
        title: parsed.data.title,
        slug,
        subtitle: parsed.data.subtitle,
        description: parsed.data.description,
        difficulty: parsed.data.difficulty,
        duration_minutes: parsed.data.durationMinutes,
        requires_approval: parsed.data.requiresApproval,
        is_featured: parsed.data.isFeatured,
        learning_objectives: parsed.data.learningObjectives,
        requirements: parsed.data.requirements,
        thumbnail_url: parsed.data.thumbnailUrl,
        created_by: user.id,
      })
      .select('id')
      .single();
    if (error) throw error;

    revalidatePath('/instructor/courses');
    redirect(`/instructor/courses/${data.id}`);
  } catch (error) {
    if (error instanceof Error && 'digest' in error) throw error;
    const result = actionError(error, 'createInstructorCourse');
    return failure(result.ok ? 'Unable to create the course.' : result.error);
  }
}

export async function updateInstructorCourseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = String(formData.get('courseId') ?? '');
  try {
    const supabase = await managerClient(courseId);
    const { data: course } = await supabase.from('courses').select('org_id').eq('id', courseId).maybeSingle();
    if (!course) return failure('Course not found.');

    const parsed = courseSchema.safeParse({
      orgId: course.org_id,
      instructorId: String(formData.get('instructorId') ?? ''),
      categoryId: formData.get('categoryId'),
      title: formData.get('title'),
      subtitle: formData.get('subtitle'),
      description: formData.get('description'),
      difficulty: formData.get('difficulty'),
      durationMinutes: formData.get('durationMinutes'),
      requiresApproval: formData.get('requiresApproval'),
      isFeatured: formData.get('isFeatured'),
      learningObjectives: formData.get('learningObjectives'),
      requirements: formData.get('requirements'),
      thumbnailUrl: formData.get('thumbnailUrl'),
    });
    if (!parsed.success) return failure('Please review the course details.', zodFieldErrors(parsed.error));

    const { error } = await supabase
      .from('courses')
      .update({
        category_id: parsed.data.categoryId,
        title: parsed.data.title,
        subtitle: parsed.data.subtitle,
        description: parsed.data.description,
        difficulty: parsed.data.difficulty,
        duration_minutes: parsed.data.durationMinutes,
        requires_approval: parsed.data.requiresApproval,
        is_featured: parsed.data.isFeatured,
        learning_objectives: parsed.data.learningObjectives,
        requirements: parsed.data.requirements,
        thumbnail_url: parsed.data.thumbnailUrl,
      })
      .eq('id', courseId);
    if (error) throw error;
    revalidatePath(`/instructor/courses/${courseId}`);
    revalidatePath('/instructor/courses');
    return { status: 'success', message: 'Course details updated.' };
  } catch (error) {
    const result = actionError(error, 'updateInstructorCourse');
    return failure(result.ok ? 'Unable to update the course.' : result.error);
  }
}

export async function setInstructorCourseStatusAction(formData: FormData): Promise<void> {
  const parsed = courseStatusSchema.safeParse({
    courseId: formData.get('courseId'),
    status: formData.get('status'),
  });
  if (!parsed.success) return;
  try {
    const supabase = await managerClient(parsed.data.courseId);
    if (parsed.data.status === 'published') {
      const { count } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', parsed.data.courseId);
      if (!count) return;
    }
    await supabase.from('courses').update({ status: parsed.data.status }).eq('id', parsed.data.courseId);
    const { data: course } = await supabase
      .from('courses')
      .select('title,org_id,instructor_id')
      .eq('id', parsed.data.courseId)
      .maybeSingle();
    if (course && parsed.data.status === 'published') {
      const admin = createAdminClient();
      await admin.from('activity_logs').insert({
        org_id: course.org_id,
        user_id: course.instructor_id,
        action: 'course.published',
        entity_type: 'course',
        entity_id: parsed.data.courseId,
        metadata: { title: course.title },
      });
    }
    revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
    revalidatePath('/instructor/courses');
    revalidatePath('/courses');
  } catch (error) {
    actionError(error, 'setInstructorCourseStatus');
  }
}

// ── Sections ─────────────────────────────────────────────────────────────────

export async function saveSectionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = String(formData.get('courseId') ?? '');
  const sectionId = formData.get('sectionId');
  try {
    const supabase = await managerClient(courseId);
    if (typeof sectionId === 'string' && sectionId) {
      const parsed = sectionUpdateSchema.safeParse({ courseId, sectionId, title: formData.get('title') });
      if (!parsed.success) return failure('Enter a section title.', zodFieldErrors(parsed.error));
      const { error } = await supabase.from('course_sections').update({ title: parsed.data.title }).eq('id', sectionId);
      if (error) throw error;
      revalidatePath(`/instructor/courses/${courseId}`);
      return { status: 'success', message: 'Section updated.' };
    }

    const parsed = sectionSchema.safeParse({ courseId, title: formData.get('title') });
    if (!parsed.success) return failure('Enter a section title.', zodFieldErrors(parsed.error));
    const { count } = await supabase.from('course_sections').select('id', { count: 'exact', head: true }).eq('course_id', courseId);
    const { error } = await supabase
      .from('course_sections')
      .insert({ course_id: courseId, title: parsed.data.title, position: count ?? 0 });
    if (error) throw error;
    revalidatePath(`/instructor/courses/${courseId}`);
    return { status: 'success', message: 'Section added.' };
  } catch (error) {
    const result = actionError(error, 'saveSection');
    return failure(result.ok ? 'Unable to save the section.' : result.error);
  }
}

export async function deleteSectionAction(formData: FormData): Promise<void> {
  const sectionId = String(formData.get('sectionId') ?? '');
  const courseId = String(formData.get('courseId') ?? '');
  try {
    const supabase = await managerClient(courseId);
    await supabase.from('course_sections').delete().eq('id', sectionId).eq('course_id', courseId);
    revalidatePath(`/instructor/courses/${courseId}`);
  } catch (error) {
    actionError(error, 'deleteSection');
  }
}

export async function moveSectionAction(formData: FormData): Promise<void> {
  const sectionId = String(formData.get('sectionId') ?? '');
  const courseId = String(formData.get('courseId') ?? '');
  const direction = String(formData.get('direction') ?? 'up');
  try {
    const supabase = await managerClient(courseId);
    const { data: sections } = await supabase
      .from('course_sections')
      .select('id,position')
      .eq('course_id', courseId)
      .order('position');
    if (!sections?.length) return;
    const index = sections.findIndex((section) => section.id === sectionId);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= sections.length) return;
    const current = sections[index];
    const neighbour = sections[target];
    if (!current || !neighbour) return;
    await supabase.from('course_sections').update({ position: neighbour.position }).eq('id', current.id);
    await supabase.from('course_sections').update({ position: current.position }).eq('id', neighbour.id);
    revalidatePath(`/instructor/courses/${courseId}`);
  } catch (error) {
    actionError(error, 'moveSection');
  }
}

// ── Lessons ──────────────────────────────────────────────────────────────────

export async function saveLessonAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = String(formData.get('courseId') ?? '');
  const lessonId = formData.get('lessonId');
  try {
    const supabase = await managerClient(courseId);
    const rawContent = formData.get('content');
    const payload = {
      courseId,
      sectionId: formData.get('sectionId'),
      title: formData.get('title'),
      type: formData.get('type'),
      content: typeof rawContent === 'string' ? sanitizeRichText(rawContent) : null,
      videoUrl: formData.get('videoUrl'),
      estimatedMinutes: formData.get('estimatedMinutes'),
      isPreview: formData.get('isPreview'),
      isPublished: formData.get('isPublished'),
    };

    if (typeof lessonId === 'string' && lessonId) {
      const parsed = lessonUpdateSchema.safeParse({ ...payload, lessonId });
      if (!parsed.success) return failure('Please review the lesson details.', zodFieldErrors(parsed.error));
      const { data: existing } = await supabase.from('lessons').select('section_id').eq('id', lessonId).eq('course_id', courseId).maybeSingle();
      if (!existing) return failure('Lesson not found.');
      const position =
        existing.section_id === parsed.data.sectionId
          ? undefined
          : ((await supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('section_id', parsed.data.sectionId)).count ?? 0);
      const { error } = await supabase
        .from('lessons')
        .update({
          section_id: parsed.data.sectionId,
          title: parsed.data.title,
          type: parsed.data.type,
          content: parsed.data.content,
          video_url: parsed.data.videoUrl,
          estimated_minutes: parsed.data.estimatedMinutes,
          is_preview: parsed.data.isPreview,
          is_published: parsed.data.isPublished,
          ...(position === undefined ? {} : { position }),
        })
        .eq('id', lessonId);
      if (error) throw error;
      revalidatePath(`/instructor/courses/${courseId}`);
      return { status: 'success', message: 'Lesson updated.' };
    }

    const parsed = lessonSchema.safeParse(payload);
    if (!parsed.success) return failure('Please review the lesson details.', zodFieldErrors(parsed.error));
    const { data: section } = await supabase
      .from('course_sections')
      .select('id')
      .eq('id', parsed.data.sectionId)
      .eq('course_id', courseId)
      .maybeSingle();
    if (!section) return failure('Choose a section in this course.');

    const { count } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('section_id', parsed.data.sectionId);
    const { error } = await supabase.from('lessons').insert({
      course_id: courseId,
      section_id: parsed.data.sectionId,
      title: parsed.data.title,
      type: parsed.data.type,
      content: parsed.data.content,
      video_url: parsed.data.videoUrl,
      estimated_minutes: parsed.data.estimatedMinutes,
      is_preview: parsed.data.isPreview,
      is_published: parsed.data.isPublished,
      position: count ?? 0,
    });
    if (error) throw error;
    revalidatePath(`/instructor/courses/${courseId}`);
    return { status: 'success', message: 'Lesson added.' };
  } catch (error) {
    const result = actionError(error, 'saveLesson');
    return failure(result.ok ? 'Unable to save the lesson.' : result.error);
  }
}

export async function deleteLessonAction(formData: FormData): Promise<void> {
  const lessonId = String(formData.get('lessonId') ?? '');
  const courseId = String(formData.get('courseId') ?? '');
  try {
    const supabase = await managerClient(courseId);
    await supabase.from('lessons').delete().eq('id', lessonId).eq('course_id', courseId);
    revalidatePath(`/instructor/courses/${courseId}`);
  } catch (error) {
    actionError(error, 'deleteLesson');
  }
}

export async function moveLessonAction(formData: FormData): Promise<void> {
  const lessonId = String(formData.get('lessonId') ?? '');
  const courseId = String(formData.get('courseId') ?? '');
  const sectionId = String(formData.get('sectionId') ?? '');
  const direction = String(formData.get('direction') ?? 'up');
  try {
    const supabase = await managerClient(courseId);
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id,position')
      .eq('section_id', sectionId)
      .order('position');
    if (!lessons?.length) return;
    const index = lessons.findIndex((lesson) => lesson.id === lessonId);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= lessons.length) return;
    const current = lessons[index];
    const neighbour = lessons[target];
    if (!current || !neighbour) return;
    await supabase.from('lessons').update({ position: neighbour.position }).eq('id', current.id);
    await supabase.from('lessons').update({ position: current.position }).eq('id', neighbour.id);
    revalidatePath(`/instructor/courses/${courseId}`);
  } catch (error) {
    actionError(error, 'moveLesson');
  }
}

// ── Resources ────────────────────────────────────────────────────────────────

export async function saveResourceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const lessonId = String(formData.get('lessonId') ?? '');
  try {
    const { supabase, lesson } = await courseForLesson(lessonId);
    const parsed = resourceSchema.safeParse({
      lessonId,
      title: formData.get('title'),
      externalUrl: formData.get('externalUrl'),
    });
    if (!parsed.success) return failure('Please review the resource details.', zodFieldErrors(parsed.error));

    const file = formData.get('file');
    let storagePath: string | null = null;
    let fileName: string | null = null;
    let mimeType: string | null = null;
    let sizeBytes: number | null = null;

    if (file instanceof File && file.size > 0) {
      if (file.size > 25 * 1024 * 1024) return failure('Files must be 25 MB or smaller.');
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
      storagePath = `${lesson.course_id}/${lessonId}/${randomUUID()}.${extension}`;
      const admin = createAdminClient();
      const { error: uploadError } = await admin.storage.from('course-media').upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
      fileName = file.name.slice(0, 200);
      mimeType = file.type || 'application/octet-stream';
      sizeBytes = file.size;
    } else if (!parsed.data.externalUrl) {
      return failure('Attach a file or provide an external URL.');
    }

    const user = await requireInstructor();
    const { data, error } = await supabase
      .from('lesson_resources')
      .insert({
        lesson_id: lessonId,
        title: parsed.data.title,
        external_url: parsed.data.externalUrl,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        uploaded_by: user.id,
      })
      .select('id')
      .single();
    if (error) throw error;
    await supabase.from('activity_logs').insert({
      org_id: (await supabase.from('courses').select('org_id').eq('id', lesson.course_id).maybeSingle()).data?.org_id,
      user_id: user.id,
      action: 'resource.created',
      entity_type: 'lesson_resource',
      entity_id: data.id,
    });
    revalidatePath(`/instructor/courses/${lesson.course_id}`);
    return { status: 'success', message: 'Resource added.' };
  } catch (error) {
    const result = actionError(error, 'saveResource');
    return failure(result.ok ? 'Unable to add the resource.' : result.error);
  }
}

export async function deleteResourceAction(formData: FormData): Promise<void> {
  const parsed = resourceDeleteSchema.safeParse({ resourceId: formData.get('resourceId') });
  if (!parsed.success) return;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: resource } = await supabase
      .from('lesson_resources')
      .select('id,lesson_id,storage_path')
      .eq('id', parsed.data.resourceId)
      .maybeSingle();
    if (!resource) return;
    const { lesson } = await courseForLesson(resource.lesson_id);
    if (resource.storage_path) {
      const admin = createAdminClient();
      await admin.storage.from('course-media').remove([resource.storage_path]);
    }
    await supabase.from('lesson_resources').delete().eq('id', resource.id);
    revalidatePath(`/instructor/courses/${lesson.course_id}`);
  } catch (error) {
    actionError(error, 'deleteResource');
  }
}

// ── Quizzes ──────────────────────────────────────────────────────────────────

export async function saveQuizAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const lessonId = String(formData.get('lessonId') ?? '');
  const quizId = formData.get('quizId');
  try {
    const { supabase, lesson } = await courseForLesson(lessonId);
    const { data: course } = await supabase.from('courses').select('org_id').eq('id', lesson.course_id).maybeSingle();
    if (!course) return failure('Course not found.');

    const parsed = quizSchema.safeParse({
      lessonId,
      title: formData.get('title'),
      instructions: formData.get('instructions'),
      timeLimitMinutes: formData.get('timeLimitMinutes'),
      passingScore: formData.get('passingScore'),
      maxAttempts: formData.get('maxAttempts'),
      randomizeQuestions: formData.get('randomizeQuestions'),
      randomizeAnswers: formData.get('randomizeAnswers'),
      showResults: formData.get('showResults'),
    });
    if (!parsed.success) return failure('Please review the quiz settings.', zodFieldErrors(parsed.error));

    const values = {
      title: parsed.data.title,
      instructions: parsed.data.instructions,
      time_limit_minutes: parsed.data.timeLimitMinutes,
      passing_score: parsed.data.passingScore,
      max_attempts: parsed.data.maxAttempts,
      randomize_questions: parsed.data.randomizeQuestions,
      randomize_answers: parsed.data.randomizeAnswers,
      show_results: parsed.data.showResults,
    };

    if (typeof quizId === 'string' && quizId) {
      const { error } = await supabase.from('quizzes').update(values).eq('id', quizId).eq('lesson_id', lessonId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('quizzes').insert({
        org_id: course.org_id,
        course_id: lesson.course_id,
        lesson_id: lessonId,
        ...values,
      });
      if (error) throw error;
    }

    revalidatePath(`/instructor/courses/${lesson.course_id}`);
    return { status: 'success', message: 'Quiz settings saved.' };
  } catch (error) {
    const result = actionError(error, 'saveQuiz');
    return failure(result.ok ? 'Unable to save the quiz.' : result.error);
  }
}

export async function saveQuestionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const quizId = String(formData.get('quizId') ?? '');
    const questionId = formData.get('questionId');
    const raw = String(formData.get('payload') ?? '{}');
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return failure('The question data could not be read.');
    }

    const parsed = questionSaveSchema.safeParse({
      quizId,
      questionId: typeof questionId === 'string' && questionId ? questionId : undefined,
      payload,
    });
    if (!parsed.success) return failure('Please review the question.', zodFieldErrors(parsed.error));

    const supabase = await createServerSupabaseClient();
    const { data: isManager } = await supabase.rpc('is_quiz_manager', { p_quiz: quizId });
    if (!isManager) return failure('You do not manage this quiz.');
    const { data: quiz } = await supabase.from('quizzes').select('id,course_id').eq('id', quizId).maybeSingle();
    if (!quiz) return failure('Quiz not found.');

    const questionValues = {
      quiz_id: quizId,
      prompt: parsed.data.payload.prompt,
      type: parsed.data.payload.type,
      points: parsed.data.payload.points,
      explanation: parsed.data.payload.explanation,
      accepted_answers: parsed.data.payload.acceptedAnswers,
    };

    let savedId = parsed.data.questionId;
    if (savedId) {
      const { error } = await supabase.from('questions').update(questionValues).eq('id', savedId).eq('quiz_id', quizId);
      if (error) throw error;
      await supabase.from('quiz_options').delete().eq('question_id', savedId);
    } else {
      const { count } = await supabase.from('questions').select('id', { count: 'exact', head: true }).eq('quiz_id', quizId);
      const { data, error } = await supabase
        .from('questions')
        .insert({ ...questionValues, position: count ?? 0 })
        .select('id')
        .single();
      if (error) throw error;
      savedId = data.id;
    }

    if (parsed.data.payload.type !== 'short_answer' && parsed.data.payload.options.length) {
      const { error } = await supabase.from('quiz_options').insert(
        parsed.data.payload.options.map((option, index) => ({
          question_id: savedId,
          label: option.label,
          is_correct: option.isCorrect,
          position: index,
        })),
      );
      if (error) throw error;
    }

    revalidatePath(`/instructor/courses/${quiz.course_id}`);
    return { status: 'success', message: 'Question saved.' };
  } catch (error) {
    const result = actionError(error, 'saveQuestion');
    return failure(result.ok ? 'Unable to save the question.' : result.error);
  }
}

export async function deleteQuestionAction(formData: FormData): Promise<void> {
  const questionId = String(formData.get('questionId') ?? '');
  if (!questionId) return;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: question } = await supabase.from('questions').select('id,quiz_id').eq('id', questionId).maybeSingle();
    if (!question) return;
    const { data: quiz } = await supabase.from('quizzes').select('course_id').eq('id', question.quiz_id).maybeSingle();
    if (!quiz) return;
    const client = await managerClient(quiz.course_id);
    await client.from('questions').delete().eq('id', questionId).eq('quiz_id', question.quiz_id);
    revalidatePath(`/instructor/courses/${quiz.course_id}`);
  } catch (error) {
    actionError(error, 'deleteQuestion');
  }
}

// ── Assignments ──────────────────────────────────────────────────────────────

export async function saveAssignmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const lessonId = String(formData.get('lessonId') ?? '');
  const assignmentId = formData.get('assignmentId');
  try {
    const { supabase, lesson } = await courseForLesson(lessonId);
    const { data: course } = await supabase.from('courses').select('org_id').eq('id', lesson.course_id).maybeSingle();
    if (!course) return failure('Course not found.');

    const parsed = assignmentSchema.safeParse({
      lessonId,
      title: formData.get('title'),
      instructions: formData.get('instructions'),
      dueAt: formData.get('dueAt'),
      maxPoints: formData.get('maxPoints'),
      gradingCriteria: formData.get('gradingCriteria'),
    });
    if (!parsed.success) return failure('Please review the assignment details.', zodFieldErrors(parsed.error));

    const values = {
      title: parsed.data.title,
      instructions: parsed.data.instructions,
      due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
      max_points: parsed.data.maxPoints,
      grading_criteria: parsed.data.gradingCriteria,
    };

    if (typeof assignmentId === 'string' && assignmentId) {
      const { error } = await supabase.from('assignments').update(values).eq('id', assignmentId).eq('lesson_id', lessonId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('assignments').insert({
        org_id: course.org_id,
        course_id: lesson.course_id,
        lesson_id: lessonId,
        ...values,
      });
      if (error) throw error;
    }

    revalidatePath(`/instructor/courses/${lesson.course_id}`);
    return { status: 'success', message: 'Assignment saved.' };
  } catch (error) {
    const result = actionError(error, 'saveAssignment');
    return failure(result.ok ? 'Unable to save the assignment.' : result.error);
  }
}

export async function deleteAssignmentAction(formData: FormData): Promise<void> {
  const assignmentId = String(formData.get('assignmentId') ?? '');
  try {
    const { supabase, assignment } = await courseIdForAssignment(assignmentId);
    await supabase.from('assignments').delete().eq('id', assignment.id);
    revalidatePath(`/instructor/courses/${assignment.course_id}`);
  } catch (error) {
    actionError(error, 'deleteAssignment');
  }
}

// ── Grading ──────────────────────────────────────────────────────────────────

export async function gradeSubmissionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = gradeSubmissionSchema.safeParse({
    submissionId: formData.get('submissionId'),
    grade: formData.get('grade'),
    feedback: formData.get('feedback'),
    status: formData.get('status'),
  });
  if (!parsed.success) return failure('Please review the grade and feedback.', zodFieldErrors(parsed.error));

  try {
    const user = await requireInstructor();
    const supabase = await createServerSupabaseClient();
    const { data: submission } = await supabase
      .from('assignment_submissions')
      .select('id,student_id,org_id,assignment_id,assignment:assignments!assignment_submissions_assignment_id_fkey(id,title,max_points,course_id)')
      .eq('id', parsed.data.submissionId)
      .maybeSingle();
    if (!submission?.assignment) return failure('Submission not found.');

    const { data: canManage } = await supabase.rpc('is_course_manager', { p_course: submission.assignment.course_id });
    if (!canManage) return failure('You do not manage this course.');
    if (parsed.data.grade > submission.assignment.max_points) {
      return failure(`The grade cannot exceed ${submission.assignment.max_points} points.`);
    }

    const { error } = await supabase
      .from('assignment_submissions')
      .update({
        grade: parsed.data.grade,
        feedback: parsed.data.feedback,
        status: parsed.data.status,
        graded_by: user.id,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submission.id);
    if (error) throw error;

    await createAdminClient().from('notifications').insert({
      org_id: submission.org_id,
      user_id: submission.student_id,
      type: 'grade',
      title: 'Assignment graded',
      body: `Your submission for "${submission.assignment.title}" received ${parsed.data.grade} / ${submission.assignment.max_points}.`,
      link: '/student/assignments',
    });

    await supabase.from('activity_logs').insert({
      org_id: submission.org_id,
      user_id: user.id,
      action: 'submission.graded',
      entity_type: 'assignment_submission',
      entity_id: submission.id,
      metadata: { grade: parsed.data.grade, max_points: submission.assignment.max_points },
    });

    revalidatePath('/instructor/assignments');
    revalidatePath(`/instructor/courses/${submission.assignment.course_id}`);
    revalidatePath('/student/assignments');
    return { status: 'success', message: 'Grade saved and the student was notified.' };
  } catch (error) {
    const result = actionError(error, 'gradeSubmission');
    return failure(result.ok ? 'Unable to save the grade.' : result.error);
  }
}

// ── Reorder placeholder (kept for API completeness) ──────────────────────────

export async function reorderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formData.get('items');
  let items: unknown;
  try {
    items = JSON.parse(String(raw ?? '[]'));
  } catch {
    return failure('The ordering data could not be read.');
  }
  const parsed = reorderSchema.safeParse({ items });
  if (!parsed.success) return failure('Invalid ordering data.');
  return { status: 'success', message: 'Order saved.' };
}
