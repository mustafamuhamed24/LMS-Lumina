-- =============================================================================
-- Learnova LMS — core schema
-- Multi-tenant LMS: organizations, users, courses, learning, assessment.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ── Enums ────────────────────────────────────────────────────────────────────
create type public.user_role as enum ('super_admin', 'org_admin', 'instructor', 'student');
create type public.account_status as enum ('active', 'suspended');
create type public.member_status as enum ('active', 'invited', 'suspended');
create type public.course_status as enum ('draft', 'published', 'archived');
create type public.difficulty_level as enum ('beginner', 'intermediate', 'advanced');
create type public.lesson_type as enum ('video', 'text', 'pdf', 'resource', 'quiz', 'assignment');
create type public.enrollment_status as enum ('pending', 'active', 'completed', 'rejected', 'cancelled');
create type public.question_type as enum ('single', 'multiple', 'true_false', 'short_answer');
create type public.submission_status as enum ('submitted', 'graded', 'returned');
create type public.notification_type as enum (
  'enrollment', 'lesson', 'assignment', 'deadline', 'quiz', 'grade', 'feedback', 'completion', 'system'
);

-- ── Organizations ────────────────────────────────────────────────────────────
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  logo_url text,
  website_url text,
  primary_color text not null default '#4f46e5' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index organizations_active_idx on public.organizations (is_active) where deleted_at is null;

-- ── Platform settings (single row) ───────────────────────────────────────────
create table public.platform_settings (
  id boolean primary key default true check (id),
  platform_name text not null default 'Learnova LMS',
  tagline text not null default 'Knowledge, structured.',
  logo_url text,
  support_email text not null default 'support@learnova.test',
  allow_signups boolean not null default true,
  require_enrollment_approval boolean not null default false,
  primary_color text not null default '#4f46e5' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  updated_by uuid,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (true) on conflict do nothing;

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  avatar_url text,
  bio text check (char_length(bio) <= 1000),
  headline text check (char_length(headline) <= 160),
  role public.user_role not null default 'student',
  status public.account_status not null default 'active',
  default_org_id uuid references public.organizations (id) on delete set null,
  email_verified boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_status_idx on public.profiles (status);
create index profiles_email_idx on public.profiles (lower(email));
create index profiles_org_idx on public.profiles (default_org_id);

alter table public.platform_settings
  add constraint platform_settings_updated_by_fkey
  foreign key (updated_by) references public.profiles (id) on delete set null;

-- ── Organization membership ──────────────────────────────────────────────────
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.user_role not null default 'student' check (role in ('org_admin', 'instructor', 'student')),
  status public.member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index organization_members_user_idx on public.organization_members (user_id, status);
create index organization_members_org_idx on public.organization_members (org_id, role);

-- ── Categories ───────────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null,
  description text check (char_length(description) <= 300),
  color text not null default '#6366f1' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);

create index categories_org_idx on public.categories (org_id);

-- ── Courses ──────────────────────────────────────────────────────────────────
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  instructor_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 4 and 140),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  subtitle text check (char_length(subtitle) <= 200),
  description text not null check (char_length(description) between 20 and 20000),
  thumbnail_url text,
  difficulty public.difficulty_level not null default 'beginner',
  duration_minutes integer not null default 60 check (duration_minutes between 5 and 20000),
  learning_objectives text[] not null default '{}',
  requirements text[] not null default '{}',
  status public.course_status not null default 'draft',
  is_featured boolean not null default false,
  requires_approval boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (org_id, slug)
);

create index courses_org_idx on public.courses (org_id, status) where deleted_at is null;
create index courses_instructor_idx on public.courses (instructor_id) where deleted_at is null;
create index courses_category_idx on public.courses (category_id);
create index courses_status_idx on public.courses (status) where deleted_at is null;
create index courses_published_idx on public.courses (published_at desc) where status = 'published' and deleted_at is null;
create index courses_search_idx on public.courses using gin (to_tsvector('english', title || ' ' || coalesce(subtitle, '') || ' ' || description));

create table public.course_instructors (
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

create index course_instructors_user_idx on public.course_instructors (user_id);

-- ── Sections & lessons ───────────────────────────────────────────────────────
create table public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index course_sections_course_idx on public.course_sections (course_id, position);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  section_id uuid not null references public.course_sections (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 180),
  type public.lesson_type not null,
  content text,
  video_url text,
  estimated_minutes integer not null default 10 check (estimated_minutes between 1 and 600),
  position integer not null default 0 check (position >= 0),
  is_preview boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lessons_course_idx on public.lessons (course_id, position);
create index lessons_section_idx on public.lessons (section_id, position);

create table public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 180),
  storage_path text,
  external_url text,
  file_name text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint lesson_resources_target_check check (storage_path is not null or external_url is not null)
);

create index lesson_resources_lesson_idx on public.lesson_resources (lesson_id);

-- ── Enrollment & progress ────────────────────────────────────────────────────
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.enrollment_status not null default 'pending',
  progress_percent numeric(5, 2) not null default 0 check (progress_percent between 0 and 100),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  last_accessed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (course_id, student_id)
);

create index enrollments_student_idx on public.enrollments (student_id, status);
create index enrollments_course_idx on public.enrollments (course_id, status);
create index enrollments_org_idx on public.enrollments (org_id);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz,
  last_viewed_at timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);

create index lesson_progress_student_idx on public.lesson_progress (student_id);
create index lesson_progress_lesson_idx on public.lesson_progress (lesson_id);

-- ── Quizzes ──────────────────────────────────────────────────────────────────
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  lesson_id uuid not null unique references public.lessons (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  instructions text check (char_length(instructions) <= 5000),
  time_limit_minutes integer check (time_limit_minutes is null or time_limit_minutes between 1 and 480),
  passing_score integer not null default 70 check (passing_score between 1 and 100),
  max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  randomize_questions boolean not null default false,
  randomize_answers boolean not null default false,
  show_results boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quizzes_course_idx on public.quizzes (course_id);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  prompt text not null check (char_length(prompt) between 3 and 2000),
  type public.question_type not null,
  points integer not null default 1 check (points between 1 and 100),
  position integer not null default 0 check (position >= 0),
  explanation text check (char_length(explanation) <= 2000),
  accepted_answers text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index questions_quiz_idx on public.questions (quiz_id, position);

create table public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 500),
  is_correct boolean not null default false,
  position integer not null default 0 check (position >= 0)
);

create index quiz_options_question_idx on public.quiz_options (question_id, position);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  attempt_number integer not null check (attempt_number between 1 and 100),
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  submitted_at timestamptz,
  score numeric(5, 2) check (score is null or score between 0 and 100),
  passed boolean,
  unique (quiz_id, student_id, attempt_number)
);

create index quiz_attempts_student_idx on public.quiz_attempts (student_id, quiz_id);
create index quiz_attempts_quiz_idx on public.quiz_attempts (quiz_id);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected_option_ids uuid[] not null default '{}',
  answer_text text,
  is_correct boolean,
  points_awarded numeric(6, 2),
  unique (attempt_id, question_id)
);

create index quiz_answers_attempt_idx on public.quiz_answers (attempt_id);

-- ── Assignments ──────────────────────────────────────────────────────────────
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  lesson_id uuid not null unique references public.lessons (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  instructions text not null check (char_length(instructions) >= 10),
  due_at timestamptz,
  max_points integer not null default 100 check (max_points between 1 and 1000),
  grading_criteria text check (char_length(grading_criteria) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assignments_course_idx on public.assignments (course_id);
create index assignments_due_idx on public.assignments (due_at) where due_at is not null;

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  content_text text check (content_text is null or char_length(content_text) <= 50000),
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status public.submission_status not null default 'submitted',
  grade numeric(6, 2) check (grade is null or grade >= 0),
  feedback text check (feedback is null or char_length(feedback) <= 20000),
  graded_by uuid references public.profiles (id) on delete set null,
  graded_at timestamptz,
  unique (assignment_id, student_id),
  constraint assignment_submissions_content_check check (content_text is not null or storage_path is not null)
);

create index assignment_submissions_assignment_idx on public.assignment_submissions (assignment_id, status);
create index assignment_submissions_student_idx on public.assignment_submissions (student_id);

-- ── Notifications ────────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null default 'system',
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 2000),
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ── Certificates ─────────────────────────────────────────────────────────────
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  enrollment_id uuid not null unique references public.enrollments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  code text not null unique check (char_length(code) between 8 and 64),
  student_name text not null,
  course_title text not null,
  instructor_name text not null,
  org_name text not null,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index certificates_student_idx on public.certificates (student_id);
create index certificates_code_idx on public.certificates (code);

-- ── Activity log ─────────────────────────────────────────────────────────────
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) between 2 and 120),
  entity_type text check (char_length(entity_type) <= 80),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_org_idx on public.activity_logs (org_id, created_at desc);
create index activity_logs_user_idx on public.activity_logs (user_id, created_at desc);

-- ── Generic updated_at trigger ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'organizations', 'profiles', 'organization_members', 'categories', 'courses',
    'course_sections', 'lessons', 'enrollments', 'quizzes', 'assignments',
    'assignment_submissions'
  ]
  loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end;
$$;
