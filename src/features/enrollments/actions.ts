'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/session';
import { actionError, zodFieldErrors } from '@/lib/action-result';
import { enrollSchema, manualEnrollSchema, enrollmentDecisionSchema } from '@/lib/validations';
import type { FormState } from '@/lib/form-state';
import { initialFormState } from '@/lib/form-state';

export async function enrollInCourseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = enrollSchema.safeParse({ courseId: formData.get('courseId') });
  if (!parsed.success) {
    return { status: 'error', message: 'Invalid course.', fieldErrors: zodFieldErrors(parsed.error) };
  }

  await requireUser();
  let destination: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: course } = await supabase
      .from('courses')
      .select('id, slug, title, requires_approval')
      .eq('id', parsed.data.courseId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .maybeSingle();

    if (!course) return { status: 'error', message: 'This course is not available for enrollment.' };

    const { data, error } = await supabase.rpc('enroll_in_course', { p_course_id: course.id });
    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    revalidatePath('/courses');
    revalidatePath(`/courses/${course.slug}`);
    revalidatePath('/student/my-courses');
    revalidatePath('/student');

    if (result?.enrollment_status === 'active' || result?.enrollment_status === 'completed') {
      destination = `/learn/${course.slug}`;
    } else {
      destination = '/student/my-courses?enrolled=pending';
    }
  } catch (error) {
    const result = actionError(error, 'enrollInCourse');
    return { status: 'error', message: result.ok ? 'Unable to enroll.' : result.error };
  }

  if (destination) redirect(destination);
  return initialFormState;
}

export async function updateEnrollmentStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = enrollmentDecisionSchema.safeParse({
    enrollmentId: formData.get('enrollmentId'),
    status: formData.get('status'),
  });
  if (!parsed.success) return { status: 'error', message: 'Invalid enrollment action.' };

  try {
    const supabase = await createServerSupabaseClient();
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, course_id, student_id, status, org_id')
      .eq('id', parsed.data.enrollmentId)
      .maybeSingle();

    if (!enrollment) return { status: 'error', message: 'Enrollment not found.' };

    // RLS enforces that only course managers or org admins can update enrollments.
    const { error } = await supabase
      .from('enrollments')
      .update({
        status: parsed.data.status,
        ...(parsed.data.status === 'completed' ? { completed_at: new Date().toISOString(), progress_percent: 100 } : {}),
      })
      .eq('id', parsed.data.enrollmentId);

    if (error) throw error;

    if (parsed.data.status === 'active' || parsed.data.status === 'rejected') {
      const admin = createAdminClient();
      await admin.from('notifications').insert({
        org_id: enrollment.org_id,
        user_id: enrollment.student_id,
        type: 'enrollment',
        title: parsed.data.status === 'active' ? 'Enrollment approved' : 'Enrollment request declined',
        body:
          parsed.data.status === 'active'
            ? 'Your enrollment request was approved. You can start learning now.'
            : 'Your enrollment request was reviewed and was not approved. Contact the course instructor for details.',
        link: '/student/my-courses',
      });
    }

    revalidatePath('/admin/enrollments');
    revalidatePath('/instructor/students');
    revalidatePath('/student/my-courses');
    return { status: 'success', message: `Enrollment marked as ${parsed.data.status}.` };
  } catch (error) {
    const result = actionError(error, 'updateEnrollmentStatus');
    return { status: 'error', message: result.ok ? 'Unable to update enrollment.' : result.error };
  }
}

export async function manualEnrollAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = manualEnrollSchema.safeParse({
    courseId: formData.get('courseId'),
    studentId: formData.get('studentId'),
  });
  if (!parsed.success) return { status: 'error', message: 'Select a course and a student.' };

  try {
    const user = await requireUser();
    const supabase = await createServerSupabaseClient();

    const { data: course } = await supabase
      .from('courses')
      .select('id, org_id, title, requires_approval')
      .eq('id', parsed.data.courseId)
      .maybeSingle();

    if (!course) return { status: 'error', message: 'Course not found.' };

    // Verify the caller can manage the course.
    const { data: canManage } = await supabase.rpc('is_course_manager', { p_course: course.id });
    if (!canManage && user.profile.role !== 'super_admin') {
      return { status: 'error', message: 'You do not have permission to enroll students in this course.' };
    }

    const admin = createAdminClient();
    const { error } = await admin.from('enrollments').insert({
      org_id: course.org_id,
      course_id: course.id,
      student_id: parsed.data.studentId,
      status: 'active',
    });

    if (error) throw error;

    await admin.from('notifications').insert({
      org_id: course.org_id,
      user_id: parsed.data.studentId,
      type: 'enrollment',
      title: 'You were enrolled in a course',
      body: `You have been enrolled in "${course.title}".`,
      link: '/student/my-courses',
    });

    revalidatePath('/admin/enrollments');
    revalidatePath('/instructor/students');
    return { status: 'success', message: 'Student enrolled successfully.' };
  } catch (error) {
    const result = actionError(error, 'manualEnroll');
    return { status: 'error', message: result.ok ? 'Unable to enroll student.' : result.error };
  }
}

/** Form-compatible wrapper for enrollment status controls. */
export async function setEnrollmentStatusFormAction(formData: FormData): Promise<void> {
  await updateEnrollmentStatusAction(initialFormState, formData);
}
