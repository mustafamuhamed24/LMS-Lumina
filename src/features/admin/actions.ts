'use server';

import 'server-only';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, requireSuperAdmin } from '@/lib/auth/session';
import { getAdminScope } from '@/lib/data/scope';
import { actionError, zodFieldErrors } from '@/lib/action-result';
import {
  adminUserCreateSchema,
  adminUserStatusSchema,
  adminUserUpdateSchema,
  categorySchema,
  categoryUpdateSchema,
  courseDeleteSchema,
  courseSchema,
  courseStatusSchema,
  courseUpdateSchema,
  instructorRequestDecisionSchema,
  organizationSchema,
  organizationUpdateSchema,
  platformSettingsSchema,
} from '@/lib/validations';
import { slugify } from '@/lib/utils';
import type { FormState } from '@/lib/form-state';
import type { Role } from '@/types/app';

function failure(message: string, fieldErrors?: Record<string, string[]>): FormState {
  return { status: 'error', message, fieldErrors };
}

async function assertOrgAccess(orgId: string) {
  const user = await requireAdmin();
  const scope = await getAdminScope(user);
  if (!scope.orgIds.includes(orgId)) throw new Error('You do not have access to that organization.');
  return { user, scope };
}

async function uniqueSlug(
  table: 'courses' | 'categories' | 'organizations',
  base: string,
  orgId?: string,
): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const root = slugify(base) || 'item';
  let candidate = root;
    for (let attempt = 1; attempt < 60; attempt += 1) {
    let found = false;
    if (table === 'organizations') {
      const { data } = await supabase.from('organizations').select('id').eq('slug', candidate).maybeSingle();
      found = Boolean(data);
    } else if (table === 'categories') {
      const { data } = await supabase.from('categories').select('id').eq('slug', candidate).eq('org_id', orgId ?? '').maybeSingle();
      found = Boolean(data);
    } else {
      const { data } = await supabase.from('courses').select('id').eq('slug', candidate).eq('org_id', orgId ?? '').maybeSingle();
      found = Boolean(data);
    }
    if (!found) return candidate;
    candidate = `${root}-${attempt + 1}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

async function logActivity(orgId: string | null, action: string, entityType: string, entityId: string | null, metadata = {}) {
  const user = await requireAdmin();
  const supabase = await createServerSupabaseClient();
  await supabase.from('activity_logs').insert({
    org_id: orgId,
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function createUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = adminUserCreateSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    orgId: formData.get('orgId'),
    headline: formData.get('headline'),
  });

  if (!parsed.success) return failure('Please review the account details.', zodFieldErrors(parsed.error));
  if (parsed.data.role === 'super_admin' && user.profile.role !== 'super_admin') {
    return failure('Only platform administrators can create another platform administrator.');
  }

  try {
    await assertOrgAccess(parsed.data.orgId);
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.fullName },
    });
    if (error) throw error;
    if (!data.user) return failure('The account could not be created.');

    const { error: profileError } = await admin
      .from('profiles')
      .update({
        full_name: parsed.data.fullName,
        email: parsed.data.email,
        role: parsed.data.role,
        status: 'active',
        default_org_id: parsed.data.orgId,
        headline: parsed.data.headline,
        email_verified: true,
      })
      .eq('id', data.user.id);
    if (profileError) throw profileError;

    const { error: memberError } = await admin.from('organization_members').upsert(
      {
        org_id: parsed.data.orgId,
        user_id: data.user.id,
        role: parsed.data.role === 'super_admin' ? 'org_admin' : parsed.data.role,
        status: 'active',
      },
      { onConflict: 'org_id,user_id' },
    );
    if (memberError) throw memberError;

    await admin.from('notifications').insert({
      org_id: parsed.data.orgId,
      user_id: data.user.id,
      type: 'system',
      title: 'Welcome to Lumina',
      body: `Your ${parsed.data.role.replace('_', ' ')} account has been created. Sign in to get started.`,
      link: parsed.data.role === 'student' ? '/student' : parsed.data.role === 'instructor' ? '/instructor' : '/admin',
    });

    await logActivity(parsed.data.orgId, 'user.created', 'profile', data.user.id, { role: parsed.data.role });
    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return { status: 'success', message: `${parsed.data.fullName} was added to the organization.` };
  } catch (error) {
    const result = actionError(error, 'createUser');
    return failure(result.ok ? 'Unable to create the account.' : result.error);
  }
}

export async function updateUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = adminUserUpdateSchema.safeParse({
    userId: formData.get('userId'),
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    role: formData.get('role'),
    status: formData.get('status'),
    orgId: formData.get('orgId'),
    headline: formData.get('headline'),
  });

  if (!parsed.success) return failure('Please review the account details.', zodFieldErrors(parsed.error));
  if (parsed.data.role === 'super_admin' && user.profile.role !== 'super_admin') {
    return failure('Only platform administrators can grant that role.');
  }

  try {
    await assertOrgAccess(parsed.data.orgId);
    const supabase = await createServerSupabaseClient();
    const { data: target } = await supabase
      .from('profiles')
      .select('id,role,default_org_id,email')
      .eq('id', parsed.data.userId)
      .maybeSingle();
    if (!target) return failure('That account could not be found.');
    if (target.role === 'super_admin' && user.profile.role !== 'super_admin') {
      return failure('You cannot modify a platform administrator.');
    }
    if (parsed.data.userId === user.id && parsed.data.status === 'suspended') {
      return failure('You cannot suspend your own account.');
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .update({
        full_name: parsed.data.fullName,
        email: parsed.data.email,
        role: parsed.data.role,
        status: parsed.data.status,
        default_org_id: parsed.data.orgId,
        headline: parsed.data.headline,
      })
      .eq('id', parsed.data.userId);
    if (error) throw error;

    const memberRole: Exclude<Role, 'super_admin'> =
      parsed.data.role === 'super_admin' ? 'org_admin' : parsed.data.role;
    const { error: memberError } = await admin.from('organization_members').upsert(
      {
        org_id: parsed.data.orgId,
        user_id: parsed.data.userId,
        role: memberRole,
        status: parsed.data.status === 'suspended' ? 'suspended' : 'active',
      },
      { onConflict: 'org_id,user_id' },
    );
    if (memberError) throw memberError;

    await logActivity(parsed.data.orgId, 'user.updated', 'profile', parsed.data.userId, {
      role: parsed.data.role,
      status: parsed.data.status,
    });
    revalidatePath('/admin/users');
    return { status: 'success', message: 'Account updated.' };
  } catch (error) {
    const result = actionError(error, 'updateUser');
    return failure(result.ok ? 'Unable to update the account.' : result.error);
  }
}

export async function setUserStatusAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const parsed = adminUserStatusSchema.safeParse({
    userId: formData.get('userId'),
    status: formData.get('status'),
  });
  if (!parsed.success) return;
  if (parsed.data.userId === user.id) return;

  const supabase = await createServerSupabaseClient();
  const { data: target } = await supabase
    .from('profiles')
    .select('id,role,default_org_id')
    .eq('id', parsed.data.userId)
    .maybeSingle();
  if (!target) return;
  if (target.role === 'super_admin' && user.profile.role !== 'super_admin') return;
  if (!target.default_org_id) return;

  const scope = await getAdminScope(user);
  if (!scope.orgIds.includes(target.default_org_id)) return;

  const admin = createAdminClient();
  await admin.from('profiles').update({ status: parsed.data.status }).eq('id', parsed.data.userId);
  await admin
    .from('organization_members')
    .update({ status: parsed.data.status === 'suspended' ? 'suspended' : 'active' })
    .eq('user_id', parsed.data.userId)
    .eq('org_id', target.default_org_id);

  revalidatePath('/admin/users');
}

// ── Instructor requests ─────────────────────────────────────────────────────

export async function reviewInstructorRequestAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const parsed = instructorRequestDecisionSchema.safeParse({
    requestId: formData.get('requestId'),
    decision: formData.get('decision'),
  });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  const { data: request } = await supabase
    .from('instructor_requests')
    .select('id,user_id,org_id,status')
    .eq('id', parsed.data.requestId)
    .maybeSingle();
  if (!request || request.status !== 'pending') return;

  const scope = await getAdminScope(user);
  if (!scope.orgIds.includes(request.org_id)) return;

  const { data: target } = await supabase
    .from('profiles')
    .select('id,full_name,email,role,status,default_org_id')
    .eq('id', request.user_id)
    .maybeSingle();
  if (!target) return;

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (parsed.data.decision === 'approved') {
    if (target.role === 'student') {
      const { error: profileError } = await admin
        .from('profiles')
        .update({ role: 'instructor', status: 'active', default_org_id: request.org_id })
        .eq('id', request.user_id);
      if (profileError) return;

      const { error: memberError } = await admin.from('organization_members').upsert(
        {
          org_id: request.org_id,
          user_id: request.user_id,
          role: 'instructor',
          status: 'active',
        },
        { onConflict: 'org_id,user_id' },
      );
      if (memberError) return;
    }

    const { error: requestError } = await admin
      .from('instructor_requests')
      .update({ status: 'approved', reviewed_by: user.id, reviewed_at: now })
      .eq('id', request.id)
      .eq('status', 'pending');
    if (requestError) return;

    await admin.from('notifications').insert({
      org_id: request.org_id,
      user_id: request.user_id,
      type: 'system',
      title: 'Instructor access approved',
      body: 'Your teaching workspace is ready. Start by creating a course.',
      link: '/instructor',
    });
    await logActivity(request.org_id, 'instructor.approved', 'profile', request.user_id, {
      approved_by: user.id,
    });
  } else {
    const { error: requestError } = await admin
      .from('instructor_requests')
      .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: now })
      .eq('id', request.id)
      .eq('status', 'pending');
    if (requestError) return;

    await admin.from('notifications').insert({
      org_id: request.org_id,
      user_id: request.user_id,
      type: 'system',
      title: 'Instructor request reviewed',
      body: 'Your request was not approved. You can update your details and submit another request.',
      link: '/student/become-instructor',
    });
    await logActivity(request.org_id, 'instructor.rejected', 'profile', request.user_id, {
      reviewed_by: user.id,
    });
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin/platform');
  revalidatePath('/admin');
  revalidatePath('/student/become-instructor');
}

// ── Organizations ────────────────────────────────────────────────────────────

export async function createOrganizationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireSuperAdmin();
  const parsed = organizationSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    logoUrl: formData.get('logoUrl'),
    websiteUrl: formData.get('websiteUrl'),
    primaryColor: formData.get('primaryColor'),
    isActive: formData.get('isActive'),
  });
  if (!parsed.success) return failure('Please review the organization details.', zodFieldErrors(parsed.error));

  try {
    const admin = createAdminClient();
    const slug = await uniqueSlug('organizations', parsed.data.slug);
    const { data, error } = await admin
      .from('organizations')
      .insert({
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        logo_url: parsed.data.logoUrl,
        website_url: parsed.data.websiteUrl,
        primary_color: parsed.data.primaryColor,
        is_active: parsed.data.isActive,
        created_by: user.id,
      })
      .select('id')
      .single();
    if (error) throw error;

    await admin.from('organization_members').upsert(
      { org_id: data.id, user_id: user.id, role: 'org_admin', status: 'active' },
      { onConflict: 'org_id,user_id' },
    );
    await logActivity(data.id, 'organization.created', 'organization', data.id, { name: parsed.data.name });
    revalidatePath('/admin/organizations');
    return { status: 'success', message: `${parsed.data.name} was created.` };
  } catch (error) {
    const result = actionError(error, 'createOrganization');
    return failure(result.ok ? 'Unable to create the organization.' : result.error);
  }
}

export async function updateOrganizationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = organizationUpdateSchema.safeParse({
    orgId: formData.get('orgId'),
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    logoUrl: formData.get('logoUrl'),
    websiteUrl: formData.get('websiteUrl'),
    primaryColor: formData.get('primaryColor'),
    isActive: formData.get('isActive'),
  });
  if (!parsed.success) return failure('Please review the organization details.', zodFieldErrors(parsed.error));

  try {
    const scope = await getAdminScope(user);
    if (!scope.orgIds.includes(parsed.data.orgId)) return failure('You do not have access to that organization.');

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('organizations')
      .update({
        name: parsed.data.name,
        description: parsed.data.description,
        logo_url: parsed.data.logoUrl,
        website_url: parsed.data.websiteUrl,
        primary_color: parsed.data.primaryColor,
        is_active: parsed.data.isActive,
      })
      .eq('id', parsed.data.orgId);
    if (error) throw error;

    await logActivity(parsed.data.orgId, 'organization.updated', 'organization', parsed.data.orgId);
    revalidatePath('/admin/organizations');
    revalidatePath('/admin/settings');
    return { status: 'success', message: 'Organization updated.' };
  } catch (error) {
    const result = actionError(error, 'updateOrganization');
    return failure(result.ok ? 'Unable to update the organization.' : result.error);
  }
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const categoryId = formData.get('categoryId');
  const base = {
    orgId: formData.get('orgId'),
    name: formData.get('name'),
    description: formData.get('description'),
    color: formData.get('color'),
  };

  try {
    const supabase = await createServerSupabaseClient();

    if (typeof categoryId === 'string' && categoryId) {
      const parsed = categoryUpdateSchema.safeParse({ ...base, categoryId });
      if (!parsed.success) return failure('Please review the category details.', zodFieldErrors(parsed.error));
      const data = parsed.data;
      await assertOrgAccess(data.orgId);

      const { error } = await supabase
        .from('categories')
        .update({ name: data.name, description: data.description, color: data.color })
        .eq('id', data.categoryId);
      if (error) throw error;
      await logActivity(data.orgId, 'category.updated', 'category', data.categoryId);
      revalidatePath('/admin/categories');
      return { status: 'success', message: 'Category updated.' };
    }

    const parsed = categorySchema.safeParse(base);
    if (!parsed.success) return failure('Please review the category details.', zodFieldErrors(parsed.error));
    const data = parsed.data;
    await assertOrgAccess(data.orgId);
    const slug = await uniqueSlug('categories', data.name, data.orgId);

    const { data: created, error } = await supabase
      .from('categories')
      .insert({
        org_id: data.orgId,
        name: data.name,
        slug,
        description: data.description,
        color: data.color,
      })
      .select('id')
      .single();
    if (error) throw error;
    await logActivity(data.orgId, 'category.created', 'category', created.id);
    revalidatePath('/admin/categories');
    return { status: 'success', message: 'Category created.' };
  } catch (error) {
    const result = actionError(error, 'saveCategory');
    return failure(result.ok ? 'Unable to save the category.' : result.error);
  }
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const categoryId = String(formData.get('categoryId') ?? '');
  if (!categoryId) return;
  const supabase = await createServerSupabaseClient();
  const { data: category } = await supabase.from('categories').select('id,org_id').eq('id', categoryId).maybeSingle();
  if (!category) return;
  try {
    await assertOrgAccess(category.org_id);
  } catch {
    return;
  }
  await supabase.from('categories').delete().eq('id', categoryId);
  await logActivity(category.org_id, 'category.deleted', 'category', categoryId);
  revalidatePath('/admin/categories');
}

// ── Courses ──────────────────────────────────────────────────────────────────

export async function saveCourseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const courseId = formData.get('courseId');
  const base = {
    orgId: formData.get('orgId'),
    instructorId: formData.get('instructorId'),
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
  };

  try {
    const supabase = await createServerSupabaseClient();

    if (typeof courseId === 'string' && courseId) {
      const parsed = courseUpdateSchema.safeParse({ ...base, courseId });
      if (!parsed.success) return failure('Please review the course details.', zodFieldErrors(parsed.error));
      const data = parsed.data;
      await assertOrgAccess(data.orgId);

      const { error } = await supabase
        .from('courses')
        .update({
          instructor_id: data.instructorId,
          category_id: data.categoryId,
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          difficulty: data.difficulty,
          duration_minutes: data.durationMinutes,
          requires_approval: data.requiresApproval,
          is_featured: data.isFeatured,
          learning_objectives: data.learningObjectives,
          requirements: data.requirements,
          thumbnail_url: data.thumbnailUrl,
        })
        .eq('id', data.courseId);
      if (error) throw error;
      await logActivity(data.orgId, 'course.updated', 'course', data.courseId, { title: data.title });
      revalidatePath('/admin/courses');
      revalidatePath('/courses');
      return { status: 'success', message: 'Course updated.' };
    }

    const parsed = courseSchema.safeParse(base);
    if (!parsed.success) return failure('Please review the course details.', zodFieldErrors(parsed.error));
    const data = parsed.data;
    await assertOrgAccess(data.orgId);
    const slug = await uniqueSlug('courses', data.title, data.orgId);

    const { data: created, error } = await supabase
      .from('courses')
      .insert({
        org_id: data.orgId,
        instructor_id: data.instructorId,
        category_id: data.categoryId,
        title: data.title,
        slug,
        subtitle: data.subtitle,
        description: data.description,
        difficulty: data.difficulty,
        duration_minutes: data.durationMinutes,
        requires_approval: data.requiresApproval,
        is_featured: data.isFeatured,
        learning_objectives: data.learningObjectives,
        requirements: data.requirements,
        thumbnail_url: data.thumbnailUrl,
        created_by: user.id,
      })
      .select('id,slug')
      .single();
    if (error) throw error;

    await logActivity(data.orgId, 'course.created', 'course', created.id, { title: data.title });
    revalidatePath('/admin/courses');
    return { status: 'success', message: 'Course created. Add sections and lessons to publish it.' };
  } catch (error) {
    const result = actionError(error, 'saveCourse');
    return failure(result.ok ? 'Unable to save the course.' : result.error);
  }
}

export async function setCourseStatusAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const parsed = courseStatusSchema.safeParse({
    courseId: formData.get('courseId'),
    status: formData.get('status'),
  });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  const { data: course } = await supabase
    .from('courses')
    .select('id,org_id,title,instructor_id,lesson_count')
    .eq('id', parsed.data.courseId)
    .maybeSingle();
  if (!course) return;

  try {
    await assertOrgAccess(course.org_id);
  } catch {
    return;
  }

  if (parsed.data.status === 'published' && course.lesson_count === 0) {
    revalidatePath('/admin/courses');
    return;
  }

  const { error } = await supabase
    .from('courses')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.courseId);
  if (!error) {
    await logActivity(course.org_id, `course.${parsed.data.status}`, 'course', course.id, { title: course.title });
    if (parsed.data.status === 'published') {
      const admin = createAdminClient();
      await admin.from('notifications').insert({
        org_id: course.org_id,
        user_id: course.instructor_id,
        type: 'system',
        title: 'Course published',
        body: `"${course.title}" is now visible in the catalog.`,
        link: `/instructor/courses/${course.id}`,
      });
    }
  }
  revalidatePath('/admin/courses');
  revalidatePath('/courses');
  void user;
}

export async function deleteCourseAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = courseDeleteSchema.safeParse({ courseId: formData.get('courseId') });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  const { data: course } = await supabase.from('courses').select('id,org_id').eq('id', parsed.data.courseId).maybeSingle();
  if (!course) return;
  try {
    await assertOrgAccess(course.org_id);
  } catch {
    return;
  }
  await supabase.from('courses').update({ deleted_at: new Date().toISOString(), status: 'archived' }).eq('id', course.id);
  await logActivity(course.org_id, 'course.deleted', 'course', course.id);
  revalidatePath('/admin/courses');
  revalidatePath('/courses');
}

// ── Platform settings ────────────────────────────────────────────────────────

export async function updatePlatformSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireSuperAdmin();
  const parsed = platformSettingsSchema.safeParse({
    platformName: formData.get('platformName'),
    tagline: formData.get('tagline'),
    supportEmail: formData.get('supportEmail'),
    logoUrl: formData.get('logoUrl'),
    allowSignups: formData.get('allowSignups'),
    requireEnrollmentApproval: formData.get('requireEnrollmentApproval'),
    primaryColor: formData.get('primaryColor'),
  });
  if (!parsed.success) return failure('Please review the platform settings.', zodFieldErrors(parsed.error));

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('platform_settings')
      .update({
        platform_name: parsed.data.platformName,
        tagline: parsed.data.tagline,
        support_email: parsed.data.supportEmail,
        logo_url: parsed.data.logoUrl,
        allow_signups: parsed.data.allowSignups,
        require_enrollment_approval: parsed.data.requireEnrollmentApproval,
        primary_color: parsed.data.primaryColor,
        updated_by: user.id,
      })
      .eq('id', true);
    if (error) throw error;
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { status: 'success', message: 'Platform settings saved.' };
  } catch (error) {
    const result = actionError(error, 'updatePlatformSettings');
    return failure(result.ok ? 'Unable to save the settings.' : result.error);
  }
}
