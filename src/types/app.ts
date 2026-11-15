import type { Database } from '@/types/database';

export type Role = Database['public']['Enums']['user_role'];
export type AccountStatus = Database['public']['Enums']['account_status'];
export type CourseStatus = Database['public']['Enums']['course_status'];
export type Difficulty = Database['public']['Enums']['difficulty_level'];
export type LessonType = Database['public']['Enums']['lesson_type'];
export type EnrollmentStatus = Database['public']['Enums']['enrollment_status'];
export type QuestionType = Database['public']['Enums']['question_type'];
export type SubmissionStatus = Database['public']['Enums']['submission_status'];
export type NotificationType = Database['public']['Enums']['notification_type'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
export type CourseRow = Database['public']['Tables']['courses']['Row'];
export type SectionRow = Database['public']['Tables']['course_sections']['Row'];
export type LessonRow = Database['public']['Tables']['lessons']['Row'];
export type ResourceRow = Database['public']['Tables']['lesson_resources']['Row'];
export type EnrollmentRow = Database['public']['Tables']['enrollments']['Row'];
export type QuizRow = Database['public']['Tables']['quizzes']['Row'];
export type QuestionRow = Database['public']['Tables']['questions']['Row'];
export type QuizOptionRow = Database['public']['Tables']['quiz_options']['Row'];
export type QuizAttemptRow = Database['public']['Tables']['quiz_attempts']['Row'];
export type QuizAnswerRow = Database['public']['Tables']['quiz_answers']['Row'];
export type AssignmentRow = Database['public']['Tables']['assignments']['Row'];
export type SubmissionRow = Database['public']['Tables']['assignment_submissions']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type CertificateRow = Database['public']['Tables']['certificates']['Row'];
export type ActivityRow = Database['public']['Tables']['activity_logs']['Row'];
export type PlatformSettingsRow = Database['public']['Tables']['platform_settings']['Row'];

export type OrganizationMembership = {
  orgId: string;
  role: Role;
  status: Database['public']['Enums']['member_status'];
  organization: OrganizationRow;
};

export type SessionProfile = ProfileRow & {
  memberships: OrganizationMembership[];
};

export type SessionUser = {
  id: string;
  email: string;
  profile: SessionProfile;
  activeOrg: OrganizationRow | null;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CourseCardData = CourseRow & {
  category: { id: string; name: string; color: string; slug: string } | null;
  instructor: { id: string; full_name: string; avatar_url: string | null };
  organization: { id: string; name: string; slug: string } | null;
  lesson_count: number;
  student_count: number;
};

export type EnrollmentWithCourse = EnrollmentRow & {
  course: CourseCardData;
};
