import { z } from 'zod';
import { COURSE_STATUSES, DIFFICULTIES, ENROLLMENT_STATUSES, LESSON_TYPES, QUESTION_TYPES, ROLES } from './constants.js';

const uuid = z.string().uuid('Must be a valid id');
const trimmed = (min: number, max: number, label = 'Field') =>
  z.string().trim().min(min, `${label} must be at least ${min} characters`).max(max, `${label} must be at most ${max} characters`);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');

export const signUpSchema = z.object({
  fullName: trimmed(2, 80, 'Full name'),
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(72),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
  token: z.string().min(20, 'Invalid reset token'),
  password: passwordSchema,
});
export const verifyEmailSchema = z.object({ token: z.string().min(20, 'Invalid verification token') });

export const profileUpdateSchema = z.object({
  fullName: trimmed(2, 80, 'Full name'),
  headline: optionalText(120),
  bio: optionalText(500),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const userCreateSchema = z.object({
  fullName: trimmed(2, 80, 'Full name'),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(ROLES),
  sendInvite: z.boolean().optional().default(true),
});

export const userUpdateSchema = z.object({
  fullName: trimmed(2, 80, 'Full name').optional(),
  email: emailSchema.optional(),
  role: z.enum(ROLES).optional(),
  headline: optionalText(120).optional(),
});

export const userStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

export const categorySchema = z.object({
  name: trimmed(2, 60, 'Name'),
  description: optionalText(240),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #6366f1')
    .default('#6366f1'),
});

export const courseSchema = z.object({
  title: trimmed(4, 120, 'Title'),
  subtitle: optionalText(160),
  description: trimmed(20, 5000, 'Description'),
  categoryId: uuid,
  difficulty: z.enum(DIFFICULTIES),
  durationMinutes: z.coerce.number().int().min(5, 'Duration must be at least 5 minutes').max(10000),
  requiresApproval: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  learningObjectives: z.array(trimmed(3, 200, 'Objective')).max(12).default([]),
  requirements: z.array(trimmed(3, 200, 'Requirement')).max(12).default([]),
  thumbnailUrl: optionalText(500),
});
export type CourseInput = z.infer<typeof courseSchema>;

export const sectionSchema = z.object({ title: trimmed(2, 120, 'Section title') });

export const lessonSchema = z
  .object({
    title: trimmed(2, 140, 'Lesson title'),
    type: z.enum(LESSON_TYPES),
    content: optionalText(50000),
    videoUrl: optionalText(500),
    estimatedMinutes: z.coerce.number().int().min(1).max(600).default(10),
    isPreview: z.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'video' && !val.videoUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['videoUrl'], message: 'A video URL is required for video lessons' });
    }
    if (val.type === 'text' && !val.content) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message: 'Lesson content is required for reading lessons' });
    }
    if (val.type === 'pdf' && !val.content && !val.videoUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message: 'Attach a PDF or provide instructions' });
    }
  });
export type LessonInput = z.infer<typeof lessonSchema>;

const resourceSchema = z
  .object({
    title: trimmed(2, 140, 'Resource title'),
    fileId: uuid.optional().nullable(),
    externalUrl: z.string().url('Enter a valid URL').max(500).optional().nullable(),
  })
  .refine((v) => Boolean(v.fileId) || Boolean(v.externalUrl), {
    message: 'Provide an uploaded file or an external URL',
    path: ['fileId'],
  });

export const resourceCreateSchema = resourceSchema;

export const reorderSchema = z.object({
  items: z.array(z.object({ id: uuid, position: z.number().int().min(0) })).min(1),
});

export const quizSchema = z.object({
  title: trimmed(3, 140, 'Quiz title'),
  instructions: optionalText(2000),
  timeLimitMinutes: z.union([z.coerce.number().int().min(1).max(480), z.null()]).optional(),
  passingScore: z.coerce.number().int().min(1).max(100).default(70),
  maxAttempts: z.coerce.number().int().min(1).max(20).default(3),
  randomizeQuestions: z.boolean().default(false),
});

export const questionOptionSchema = z.object({
  label: trimmed(1, 300, 'Option'),
  isCorrect: z.boolean().default(false),
});

export const questionSchema = z
  .object({
    prompt: trimmed(3, 1000, 'Question'),
    type: z.enum(QUESTION_TYPES),
    points: z.coerce.number().int().min(1).max(100).default(1),
    explanation: optionalText(1000),
    acceptedAnswers: z.array(trimmed(1, 300, 'Answer')).max(10).default([]),
    options: z.array(questionOptionSchema).max(10).default([]),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'short_answer') {
      if (val.acceptedAnswers.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['acceptedAnswers'], message: 'Add at least one accepted answer' });
      }
      return;
    }
    if (val.options.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Add at least two options' });
      return;
    }
    const correct = val.options.filter((o) => o.isCorrect).length;
    if (val.type === 'multiple' && correct < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Mark at least one correct option' });
    }
    if (val.type !== 'multiple' && correct !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Mark exactly one correct option' });
    }
  });
export type QuestionInput = z.infer<typeof questionSchema>;

export const quizSubmissionSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: uuid,
        optionIds: z.array(uuid).default([]),
        text: z.string().trim().max(2000).optional().nullable(),
      }),
    )
    .min(1),
});

export const assignmentSchema = z.object({
  title: trimmed(3, 140, 'Title'),
  instructions: trimmed(10, 5000, 'Instructions'),
  dueAt: z
    .union([z.string().datetime({ offset: true }), z.string().datetime(), z.null()])
    .optional()
    .nullable(),
  maxPoints: z.coerce.number().int().min(1).max(1000).default(100),
  gradingCriteria: optionalText(2000),
});

export const assignmentSubmissionSchema = z
  .object({
    contentText: optionalText(20000),
    fileId: uuid.optional().nullable(),
  })
  .refine((v) => Boolean(v.contentText) || Boolean(v.fileId), {
    message: 'Add a written response or attach a file',
    path: ['contentText'],
  });

export const gradeSubmissionSchema = z.object({
  grade: z.coerce.number().min(0, 'Grade cannot be negative').max(1000),
  feedback: optionalText(5000),
});

export const enrollmentDecisionSchema = z.object({
  status: z.enum(['active', 'rejected', 'cancelled']),
});

export const settingsSchema = z.object({
  platformName: trimmed(2, 80, 'Platform name'),
  tagline: trimmed(2, 160, 'Tagline'),
  supportEmail: emailSchema,
  logoUrl: optionalText(500),
  allowSignups: z.boolean(),
  requireEnrollmentApproval: z.boolean(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #4f46e5'),
});

export const courseQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  status: z.enum(COURSE_STATUSES).optional(),
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(9),
  sort: z.enum(['newest', 'popular', 'title']).default('newest'),
  mine: z.coerce.boolean().optional(),
});

export const userQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const enrollmentQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(ENROLLMENT_STATUSES).optional(),
  courseId: uuid.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().trim().max(120).optional(),
});

export const idParamSchema = z.object({ id: uuid });

export type CategoryInput = z.infer<typeof categorySchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
