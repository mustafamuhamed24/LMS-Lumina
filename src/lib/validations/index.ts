import { z } from 'zod';

export const ROLES = ['super_admin', 'org_admin', 'instructor', 'student'] as const;
export const ORG_ROLES = ['org_admin', 'instructor', 'student'] as const;
export const COURSE_STATUSES = ['draft', 'published', 'archived'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export const LESSON_TYPES = ['video', 'text', 'pdf', 'resource', 'quiz', 'assignment'] as const;
export const QUESTION_TYPES = ['single', 'multiple', 'true_false', 'short_answer'] as const;
export const ENROLLMENT_STATUSES = ['pending', 'active', 'completed', 'rejected', 'cancelled'] as const;
export const SUBMISSION_STATUSES = ['submitted', 'graded', 'returned'] as const;
export const ACCOUNT_STATUSES = ['active', 'suspended'] as const;

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');

const text = (min: number, max: number, label = 'Field') =>
  z.string().trim().min(min, `${label} must be at least ${min} characters`).max(max, `${label} must be at most ${max} characters`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const hexColor = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour such as #4f46e5');
const whatsappNumber = z
  .string()
  .trim()
  .max(24)
  .refine(
    (value) => value === '' || /^\+?[0-9][0-9\s()-]{6,22}$/.test(value),
    'Enter a phone number in international format, such as +201090861914',
  )
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));
export const checkbox = z.preprocess((value) => value === 'on' || value === 'true' || value === true, z.boolean());

const multilineList = (maxItems: number, maxLength: number) =>
  z
    .string()
    .max(4000)
    .optional()
    .transform((value) =>
      (value ?? '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, maxItems)
        .map((item) => item.slice(0, maxLength)),
    );

const uuid = z.string().uuid('Select a valid option');

// ── Auth ─────────────────────────────────────────────────────────────────────
export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(72),
  next: z.string().optional(),
});

export const signUpSchema = z.object({
  fullName: text(2, 80, 'Full name'),
  email,
  password,
  accountType: z.enum(['student', 'instructor']).default('student'),
  instructorNote: optionalText(500),
  acceptTerms: checkbox.refine(Boolean, 'You must accept the terms to create an account'),
});

export const instructorRequestSchema = z.object({
  message: optionalText(500),
});

export const instructorRequestDecisionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ── Profile ──────────────────────────────────────────────────────────────────
export const profileSchema = z.object({
  fullName: text(2, 80, 'Full name'),
  headline: optionalText(160),
  bio: optionalText(1000),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(72),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ── Users (admin) ────────────────────────────────────────────────────────────
export const adminUserCreateSchema = z.object({
  fullName: text(2, 80, 'Full name'),
  email,
  password,
  role: z.enum(ROLES),
  orgId: uuid,
  headline: optionalText(160),
});

export const adminUserUpdateSchema = z.object({
  userId: z.string().uuid(),
  fullName: text(2, 80, 'Full name'),
  email,
  role: z.enum(ROLES),
  status: z.enum(ACCOUNT_STATUSES),
  orgId: uuid,
  headline: optionalText(160),
});

export const adminUserStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(ACCOUNT_STATUSES),
});

// ── Organizations & settings ─────────────────────────────────────────────────
export const organizationSchema = z.object({
  name: text(2, 120, 'Organization name'),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens'),
  description: optionalText(500),
  logoUrl: optionalText(500),
  websiteUrl: optionalText(500),
  primaryColor: hexColor,
  isActive: checkbox,
});

export const organizationUpdateSchema = organizationSchema.extend({ orgId: z.string().uuid() });

export const platformSettingsSchema = z.object({
  platformName: text(2, 80, 'Platform name'),
  tagline: text(2, 160, 'Tagline'),
  supportEmail: email,
  supportWhatsapp: whatsappNumber,
  logoUrl: optionalText(500),
  allowSignups: checkbox,
  requireEnrollmentApproval: checkbox,
  primaryColor: hexColor,
});

// ── Categories ───────────────────────────────────────────────────────────────
export const categorySchema = z.object({
  orgId: uuid,
  name: text(2, 80, 'Category name'),
  description: optionalText(300),
  color: hexColor,
});

export const categoryUpdateSchema = categorySchema.extend({ categoryId: z.string().uuid() });

// ── Courses ──────────────────────────────────────────────────────────────────
export const courseSchema = z.object({
  orgId: uuid,
  instructorId: uuid,
  categoryId: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  title: text(4, 140, 'Title'),
  subtitle: optionalText(200),
  description: text(20, 20000, 'Description'),
  difficulty: z.enum(DIFFICULTIES),
  durationMinutes: z.coerce.number().int().min(5, 'Duration must be at least 5 minutes').max(20000),
  requiresApproval: checkbox,
  isFeatured: checkbox,
  learningObjectives: multilineList(12, 200),
  requirements: multilineList(12, 200),
  thumbnailUrl: optionalText(500),
});

export const courseUpdateSchema = courseSchema.extend({ courseId: z.string().uuid() });

export const courseStatusSchema = z.object({
  courseId: z.string().uuid(),
  status: z.enum(COURSE_STATUSES),
});

export const courseDeleteSchema = z.object({ courseId: z.string().uuid() });

// ── Sections & lessons ───────────────────────────────────────────────────────
export const sectionSchema = z.object({
  courseId: z.string().uuid(),
  title: text(2, 160, 'Section title'),
});

export const sectionUpdateSchema = sectionSchema.extend({ sectionId: z.string().uuid() });

export const lessonSchema = z
  .object({
    courseId: z.string().uuid(),
    sectionId: z.string().uuid(),
    title: text(2, 180, 'Lesson title'),
    type: z.enum(LESSON_TYPES),
    content: optionalText(50000),
    videoUrl: optionalText(1000),
    estimatedMinutes: z.coerce.number().int().min(1).max(600),
    isPreview: checkbox,
    isPublished: checkbox,
  })
  .superRefine((value, ctx) => {
    if (value.type === 'video' && !value.videoUrl) {
      ctx.addIssue({ code: 'custom', path: ['videoUrl'], message: 'A video URL is required for video lessons' });
    }
    if (value.type === 'text' && !value.content) {
      ctx.addIssue({ code: 'custom', path: ['content'], message: 'Lesson content is required for reading lessons' });
    }
    if (value.type === 'pdf' && !value.content && !value.videoUrl) {
      ctx.addIssue({ code: 'custom', path: ['pdfUrl'], message: 'Attach a PDF or provide lesson instructions' });
    }
  });

export const lessonUpdateSchema = lessonSchema.extend({ lessonId: z.string().uuid() });

export const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), position: z.coerce.number().int().min(0) })).min(1),
});

export const resourceSchema = z.object({
  lessonId: z.string().uuid(),
  title: text(2, 180, 'Resource title'),
  externalUrl: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export const resourceDeleteSchema = z.object({ resourceId: z.string().uuid() });

// ── Quizzes ──────────────────────────────────────────────────────────────────
export const quizSchema = z.object({
  lessonId: z.string().uuid(),
  title: text(3, 180, 'Quiz title'),
  instructions: optionalText(5000),
  timeLimitMinutes: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? Number(value) : null))
    .pipe(z.number().int().min(1).max(480).nullable()),
  passingScore: z.coerce.number().int().min(1).max(100),
  maxAttempts: z.coerce.number().int().min(1).max(20),
  randomizeQuestions: checkbox,
  randomizeAnswers: checkbox,
  showResults: checkbox,
});

export const questionOptionSchema = z.object({
  id: z.string().uuid().optional(),
  label: text(1, 500, 'Option'),
  isCorrect: checkbox,
});

export const questionPayloadSchema = z
  .object({
    prompt: text(3, 2000, 'Question'),
    type: z.enum(QUESTION_TYPES),
    points: z.coerce.number().int().min(1).max(100),
    explanation: optionalText(2000),
    acceptedAnswers: z.array(z.string().trim().min(1).max(500)).max(10).default([]),
    options: z.array(questionOptionSchema).max(10).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'short_answer') {
      if (value.acceptedAnswers.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['acceptedAnswers'], message: 'Add at least one accepted answer' });
      }
      return;
    }
    if (value.options.length < 2) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Add at least two options' });
      return;
    }
    const correct = value.options.filter((option) => option.isCorrect).length;
    if (value.type === 'multiple' && correct < 1) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Mark at least one correct option' });
    }
    if (value.type !== 'multiple' && correct !== 1) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Mark exactly one correct option' });
    }
  });

export const questionSaveSchema = z.object({
  quizId: z.string().uuid(),
  questionId: z.string().uuid().optional(),
  payload: questionPayloadSchema,
});

export const questionDeleteSchema = z.object({ questionId: z.string().uuid() });

export const quizSubmitSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        optionIds: z.array(z.string().uuid()).default([]),
        text: z.string().trim().max(2000).optional().nullable(),
      }),
    )
    .min(1),
});

export const quizStartSchema = z.object({ quizId: z.string().uuid() });

// ── Assignments ──────────────────────────────────────────────────────────────
export const assignmentSchema = z.object({
  lessonId: z.string().uuid(),
  title: text(3, 180, 'Title'),
  instructions: text(10, 20000, 'Instructions'),
  dueAt: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  maxPoints: z.coerce.number().int().min(1).max(1000),
  gradingCriteria: optionalText(5000),
});

export const submissionSchema = z.object({
  assignmentId: z.string().uuid(),
  contentText: optionalText(50000),
});

export const lessonProgressSchema = z.object({
  lessonId: z.string().uuid(),
});

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  grade: z.coerce.number().min(0).max(1000),
  feedback: optionalText(20000),
  status: z.enum(['graded', 'returned']),
});

// ── Enrollment ───────────────────────────────────────────────────────────────
export const enrollSchema = z.object({ courseId: z.string().uuid() });

export const enrollmentDecisionSchema = z.object({
  enrollmentId: z.string().uuid(),
  status: z.enum(['active', 'rejected', 'cancelled', 'completed']),
});

export const manualEnrollSchema = z.object({
  courseId: z.string().uuid(),
  studentId: z.string().uuid(),
});

// ── Notifications ────────────────────────────────────────────────────────────
export const notificationReadSchema = z.object({ notificationId: z.string().uuid() });

// ── Queries ──────────────────────────────────────────────────────────────────
export const courseQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  status: z.enum(COURSE_STATUSES).optional(),
  org: z.string().uuid().optional(),
  sort: z.enum(['newest', 'popular', 'title']).default('newest'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).catch(9).default(9),
});

export const adminUserQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(ACCOUNT_STATUSES).optional(),
  org: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
});

export const enrollmentQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(ENROLLMENT_STATUSES).optional(),
  courseId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type QuestionPayload = z.infer<typeof questionPayloadSchema>;
export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;
