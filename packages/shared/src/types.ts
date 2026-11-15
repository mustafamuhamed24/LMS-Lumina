import type {
  CourseStatus,
  Difficulty,
  EnrollmentStatus,
  LessonType,
  NotificationType,
  QuestionType,
  Role,
  SubmissionStatus,
} from './constants.js';

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  headline: string | null;
  role: Role;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ProfileUser extends PublicUser {
  courseCount?: number;
  studentCount?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  courseCount: number;
  createdAt: string;
}

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  thumbnailUrl: string | null;
  status: CourseStatus;
  difficulty: Difficulty;
  durationMinutes: number;
  requiresApproval: boolean;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string; color: string } | null;
  instructor: { id: string; fullName: string; avatarUrl: string | null };
  lessonCount: number;
  studentCount: number;
  rating: number | null;
  publishedAt: string | null;
  createdAt: string;
  enrollment: { id: string; status: EnrollmentStatus; progressPercent: number } | null;
}

export interface LessonSummary {
  id: string;
  sectionId: string;
  title: string;
  type: LessonType;
  position: number;
  estimatedMinutes: number;
  isPreview: boolean;
  completed: boolean;
  quizId: string | null;
  assignmentId: string | null;
}

export interface CourseSection {
  id: string;
  title: string;
  position: number;
  lessons: LessonSummary[];
}

export interface LessonDetail {
  id: string;
  courseId: string;
  sectionId: string;
  title: string;
  type: LessonType;
  content: string | null;
  videoUrl: string | null;
  estimatedMinutes: number;
  position: number;
  isPreview: boolean;
  resources: LessonResource[];
  quiz: QuizForStudent | null;
  assignment: Assignment | null;
  completed: boolean;
}

export interface LessonResource {
  id: string;
  title: string;
  fileId: string | null;
  externalUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
}

export interface EnrollmentSummary {
  id: string;
  status: EnrollmentStatus;
  progressPercent: number;
  enrolledAt: string;
  completedAt: string | null;
  lastAccessedAt: string | null;
  course: CourseListItem;
}

export interface CourseDetail extends CourseListItem {
  learningObjectives: string[];
  requirements: string[];
  sections: CourseSection[];
  instructorBio: string | null;
  enrollmentCount: number;
  certificate: { id: string; code: string; issuedAt: string } | null;
  nextLessonId: string | null;
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuestionForStudent {
  id: string;
  prompt: string;
  type: QuestionType;
  points: number;
  position: number;
  options: QuizOption[];
}

export interface QuizForStudent {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  timeLimitMinutes: number | null;
  passingScore: number;
  maxAttempts: number;
  questionCount: number;
  attemptsUsed: number;
  bestScore: number | null;
  questions?: QuestionForStudent[];
}

export interface QuizAttemptResult {
  id: string;
  quizId: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  submittedAt: string;
  questions: QuizQuestionResult[];
}

export interface QuizQuestionResult {
  questionId: string;
  prompt: string;
  type: QuestionType;
  points: number;
  pointsAwarded: number;
  isCorrect: boolean;
  yourAnswer: string | null;
  correctAnswer: string | null;
  explanation: string | null;
}

export interface QuizAttemptSummary {
  id: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  submittedAt: string;
}

export interface Assignment {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  instructions: string;
  dueAt: string | null;
  maxPoints: number;
  gradingCriteria: string | null;
  submission: Submission | null;
}

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  studentName?: string;
  studentEmail?: string;
  contentText: string | null;
  fileId: string | null;
  fileName: string | null;
  submittedAt: string;
  status: SubmissionStatus;
  grade: number | null;
  feedback: string | null;
  gradedAt: string | null;
  maxPoints?: number;
  assignmentTitle?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Certificate {
  id: string;
  code: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issuedAt: string;
  verificationUrl: string;
}

export interface PlatformSettings {
  platformName: string;
  tagline: string;
  logoUrl: string | null;
  supportEmail: string;
  allowSignups: boolean;
  requireEnrollmentApproval: boolean;
  primaryColor: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; fullName: string; avatarUrl: string | null; role: Role } | null;
}

export interface DashboardStats {
  students: number;
  instructors: number;
  courses: number;
  publishedCourses: number;
  activeEnrollments: number;
  completedEnrollments: number;
  pendingEnrollments: number;
  completionRate: number;
  averageProgress: number;
}

export interface OverviewResponse {
  stats: DashboardStats;
  enrollmentsByMonth: { month: string; enrollments: number; completions: number }[];
  topCourses: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    instructorName: string;
    enrollments: number;
    completions: number;
    completionRate: number;
  }[];
  recentActivity: ActivityItem[];
  recentRegistrations: ProfileUser[];
  categoryBreakdown: { name: string; color: string; count: number }[];
}

export interface InstructorCourseRow {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  thumbnailUrl: string | null;
  students: number;
  completions: number;
  completionRate: number;
  lessons: number;
  averageProgress: number;
  updatedAt: string;
}

export interface InstructorOverview {
  stats: {
    courses: number;
    publishedCourses: number;
    students: number;
    completions: number;
    averageCompletionRate: number;
    pendingSubmissions: number;
  };
  courses: InstructorCourseRow[];
  enrollmentsByMonth: { month: string; enrollments: number; completions: number }[];
  recentActivity: ActivityItem[];
  studentProgress: { name: string; progress: number; course: string }[];
  pendingSubmissions: (Submission & { assignmentTitle: string; courseTitle: string })[];
}

export interface StudentOverview {
  stats: {
    enrolled: number;
    completed: number;
    inProgress: number;
    lessonsCompleted: number;
    averageProgress: number;
    certificates: number;
  };
  continueLearning: {
    courseId: string;
    slug: string;
    title: string;
    thumbnailUrl: string | null;
    instructorName: string;
    progressPercent: number;
    nextLessonId: string | null;
    nextLessonTitle: string | null;
    lastAccessedAt: string | null;
  }[];
  recentLessons: { lessonId: string; courseId: string; courseTitle: string; lessonTitle: string; viewedAt: string }[];
  upcomingAssignments: {
    id: string;
    title: string;
    courseTitle: string;
    courseId: string;
    dueAt: string | null;
    submitted: boolean;
  }[];
  recentGrades: {
    id: string;
    title: string;
    courseTitle: string;
    grade: number;
    maxPoints: number;
    gradedAt: string | null;
    kind: 'assignment' | 'quiz';
  }[];
  achievements: { id: string; code: string; courseTitle: string; issuedAt: string; type: 'certificate' }[];
  weeklyActivity: { day: string; lessons: number }[];
}

export interface AdminUserRow extends PublicUser {
  enrollments: number;
  coursesOwned: number;
}

export interface EnrollmentRow {
  id: string;
  status: EnrollmentStatus;
  progressPercent: number;
  enrolledAt: string;
  completedAt: string | null;
  lastAccessedAt: string | null;
  student: { id: string; fullName: string; email: string; avatarUrl: string | null };
  course: { id: string; title: string; slug: string; thumbnailUrl: string | null; instructorName: string };
}

export interface ManagedCourse extends CourseListItem {
  learningObjectives: string[];
  requirements: string[];
  sections: (CourseSection & {
    lessons: ManagedLesson[];
  })[];
  sectionsCount: number;
  quizCount: number;
  assignmentCount: number;
}

export interface ManagedLesson extends LessonSummary {
  content: string | null;
  videoUrl: string | null;
  resources: LessonResource[];
  quiz: InstructorQuiz | null;
  assignment: Assignment | null;
}

export interface InstructorQuiz {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  timeLimitMinutes: number | null;
  passingScore: number;
  maxAttempts: number;
  randomizeQuestions: boolean;
  questions: InstructorQuestion[];
  attemptCount: number;
  averageScore: number | null;
}

export interface InstructorQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  points: number;
  position: number;
  explanation: string | null;
  acceptedAnswers: string[];
  options: { id: string; label: string; isCorrect: boolean; position: number }[];
}

export interface CourseProgressRow {
  enrollmentId: string;
  student: { id: string; fullName: string; email: string; avatarUrl: string | null };
  progressPercent: number;
  status: EnrollmentStatus;
  lessonsCompleted: number;
  totalLessons: number;
  lastAccessedAt: string | null;
  enrolledAt: string;
}

export interface ReportData {
  courseEnrollments: { course: string; instructor: string; enrollments: number; completions: number; rate: number }[];
  completionByCategory: { category: string; color: string; enrollments: number; completions: number; rate: number }[];
  instructorPerformance: {
    instructor: string;
    courses: number;
    students: number;
    completions: number;
    avgProgress: number;
    avgSubmissionGrade: number | null;
  }[];
  engagement: { month: string; activeLearners: number; lessonsCompleted: number; quizAttempts: number }[];
  progressBuckets: { bucket: string; students: number }[];
}

export interface FileRecord {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface AuthResponse {
  user: PublicUser;
  redirectTo: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
