export const ROLES = ['admin', 'instructor', 'student'] as const;
export type Role = (typeof ROLES)[number];

export const COURSE_STATUSES = ['draft', 'published', 'archived'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const LESSON_TYPES = ['video', 'text', 'pdf', 'resource', 'quiz', 'assignment'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export const ENROLLMENT_STATUSES = ['pending', 'active', 'completed', 'rejected', 'cancelled'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const QUESTION_TYPES = ['single', 'multiple', 'true_false', 'short_answer'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SUBMISSION_STATUSES = ['submitted', 'graded', 'returned'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export type NotificationType =
  | 'enrollment'
  | 'lesson'
  | 'assignment'
  | 'deadline'
  | 'quiz'
  | 'grade'
  | 'feedback'
  | 'completion'
  | 'system';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  instructor: 'Instructor',
  student: 'Student',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  video: 'Video',
  text: 'Reading',
  pdf: 'PDF',
  resource: 'Resource',
  quiz: 'Quiz',
  assignment: 'Assignment',
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending: 'Pending approval',
  active: 'Active',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};
