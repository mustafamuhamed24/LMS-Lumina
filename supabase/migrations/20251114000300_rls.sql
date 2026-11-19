-- =============================================================================
-- Learnova LMS — Row Level Security
-- Every table is protected. Tenant isolation is enforced by predicates that are
-- security-definer functions (no recursive policy evaluation).
-- =============================================================================

alter table public.organizations enable row level security;
alter table public.platform_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.course_instructors enable row level security;
alter table public.course_sections enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_resources enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.notifications enable row level security;
alter table public.certificates enable row level security;
alter table public.activity_logs enable row level security;

-- ── Organizations ────────────────────────────────────────────────────────────
create policy "organizations_public_read"
  on public.organizations for select
  to anon, authenticated
  using ((is_active and deleted_at is null) or public.is_org_member(id) or public.is_super_admin());

create policy "organizations_super_admin_insert"
  on public.organizations for insert
  to authenticated
  with check (public.is_super_admin());

create policy "organizations_admin_update"
  on public.organizations for update
  to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

create policy "organizations_super_admin_delete"
  on public.organizations for delete
  to authenticated
  using (public.is_super_admin());

-- ── Platform settings ────────────────────────────────────────────────────────
create policy "platform_settings_public_read"
  on public.platform_settings for select
  to anon, authenticated
  using (true);

create policy "platform_settings_super_admin_write"
  on public.platform_settings for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ── Profiles ─────────────────────────────────────────────────────────────────
create policy "profiles_read_authorized"
  on public.profiles for select
  to authenticated
  using (public.can_view_profile(id));

create policy "profiles_self_update"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or public.is_super_admin())
  with check (id = (select auth.uid()) or public.is_super_admin());

create policy "profiles_super_admin_delete"
  on public.profiles for delete
  to authenticated
  using (public.is_super_admin());

-- ── Organization membership ──────────────────────────────────────────────────
create policy "organization_members_read"
  on public.organization_members for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_org_admin(org_id));

create policy "organization_members_admin_insert"
  on public.organization_members for insert
  to authenticated
  with check (public.is_org_admin(org_id));

create policy "organization_members_admin_update"
  on public.organization_members for update
  to authenticated
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "organization_members_admin_delete"
  on public.organization_members for delete
  to authenticated
  using (public.is_org_admin(org_id) or public.is_super_admin());

-- ── Categories ───────────────────────────────────────────────────────────────
create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "categories_admin_insert"
  on public.categories for insert
  to authenticated
  with check (public.is_org_admin(org_id));

create policy "categories_admin_update"
  on public.categories for update
  to authenticated
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "categories_admin_delete"
  on public.categories for delete
  to authenticated
  using (public.is_org_admin(org_id));

-- ── Courses ──────────────────────────────────────────────────────────────────
create policy "courses_read_visible"
  on public.courses for select
  to anon, authenticated
  using (
    deleted_at is null
    and (
      status = 'published'
      or public.is_course_manager(id)
      or public.is_enrolled(id)
      or public.is_org_admin(org_id)
    )
  );

create policy "courses_authorized_insert"
  on public.courses for insert
  to authenticated
  with check (
    deleted_at is null
    and public.can_author_in_org(org_id)
    and (instructor_id = (select auth.uid()) or public.is_org_admin(org_id))
  );

create policy "courses_manager_update"
  on public.courses for update
  to authenticated
  using (public.is_course_manager(id))
  with check (public.is_course_manager(id));

create policy "courses_admin_delete"
  on public.courses for delete
  to authenticated
  using (public.is_org_admin(org_id));

-- ── Co-instructors ───────────────────────────────────────────────────────────
create policy "course_instructors_read"
  on public.course_instructors for select
  to authenticated
  using (public.is_course_manager(course_id) or public.can_view_course(course_id));

create policy "course_instructors_manager_insert"
  on public.course_instructors for insert
  to authenticated
  with check (public.is_course_manager(course_id));

create policy "course_instructors_manager_delete"
  on public.course_instructors for delete
  to authenticated
  using (public.is_course_manager(course_id));

-- ── Sections ─────────────────────────────────────────────────────────────────
create policy "sections_read"
  on public.course_sections for select
  to anon, authenticated
  using (public.can_view_course(course_id));

create policy "sections_manager_insert"
  on public.course_sections for insert
  to authenticated
  with check (public.is_course_manager(course_id));

create policy "sections_manager_update"
  on public.course_sections for update
  to authenticated
  using (public.is_course_manager(course_id))
  with check (public.is_course_manager(course_id));

create policy "sections_manager_delete"
  on public.course_sections for delete
  to authenticated
  using (public.is_course_manager(course_id));

-- ── Lessons ──────────────────────────────────────────────────────────────────
-- Full lesson rows (including content) require enrollment, management or an
-- explicit free preview. Public curriculum metadata is served by an RPC.
create policy "lessons_read_authorized"
  on public.lessons for select
  to anon, authenticated
  using (
    public.is_course_manager(course_id)
    or public.can_access_lesson_content(id)
    or (is_preview and is_published and public.can_view_course(course_id))
  );

create policy "lessons_manager_insert"
  on public.lessons for insert
  to authenticated
  with check (public.is_course_manager(course_id));

create policy "lessons_manager_update"
  on public.lessons for update
  to authenticated
  using (public.is_course_manager(course_id))
  with check (public.is_course_manager(course_id));

create policy "lessons_manager_delete"
  on public.lessons for delete
  to authenticated
  using (public.is_course_manager(course_id));

-- ── Lesson resources ─────────────────────────────────────────────────────────
create policy "lesson_resources_read"
  on public.lesson_resources for select
  to authenticated
  using (public.can_access_lesson_content(lesson_id));

create policy "lesson_resources_manager_insert"
  on public.lesson_resources for insert
  to authenticated
  with check (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id and public.is_course_manager(l.course_id)
    )
  );

create policy "lesson_resources_manager_update"
  on public.lesson_resources for update
  to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id and public.is_course_manager(l.course_id)
    )
  )
  with check (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id and public.is_course_manager(l.course_id)
    )
  );

create policy "lesson_resources_manager_delete"
  on public.lesson_resources for delete
  to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id and public.is_course_manager(l.course_id)
    )
  );

-- ── Enrollments ──────────────────────────────────────────────────────────────
create policy "enrollments_read"
  on public.enrollments for select
  to authenticated
  using (
    student_id = (select auth.uid())
    or public.is_course_manager(course_id)
    or public.is_org_admin(org_id)
  );

-- Enrollment creation is intentionally RPC-only (enroll_in_course) so approval
-- requirements and tenant checks cannot be bypassed.
create policy "enrollments_manager_update"
  on public.enrollments for update
  to authenticated
  using (public.is_course_manager(course_id) or public.is_org_admin(org_id))
  with check (public.is_course_manager(course_id) or public.is_org_admin(org_id));

create policy "enrollments_admin_delete"
  on public.enrollments for delete
  to authenticated
  using (public.is_org_admin(org_id));

-- ── Lesson progress ──────────────────────────────────────────────────────────
create policy "lesson_progress_read"
  on public.lesson_progress for select
  to authenticated
  using (
    student_id = (select auth.uid())
    or exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and public.is_course_manager(e.course_id)
    )
  );

-- Learners may record views, but completion is only written by the
-- record_lesson_progress RPC after verifying enrollment.
create policy "lesson_progress_student_insert"
  on public.lesson_progress for insert
  to authenticated
  with check (
    student_id = (select auth.uid())
    and completed_at is null
    and exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id
        and e.student_id = (select auth.uid())
        and e.status in ('active', 'completed')
    )
  );

create policy "lesson_progress_student_update"
  on public.lesson_progress for update
  to authenticated
  using (student_id = (select auth.uid()))
  with check (
    student_id = (select auth.uid())
    and completed_at is null
  );

-- ── Quizzes ──────────────────────────────────────────────────────────────────
create policy "quizzes_read"
  on public.quizzes for select
  to authenticated
  using (
    public.is_course_manager(course_id)
    or (public.is_enrolled(course_id) and public.can_access_lesson_content(lesson_id))
  );

create policy "quizzes_manager_insert"
  on public.quizzes for insert
  to authenticated
  with check (public.is_course_manager(course_id));

create policy "quizzes_manager_update"
  on public.quizzes for update
  to authenticated
  using (public.is_course_manager(course_id))
  with check (public.is_course_manager(course_id));

create policy "quizzes_manager_delete"
  on public.quizzes for delete
  to authenticated
  using (public.is_course_manager(course_id));

-- ── Questions & options: managers only ───────────────────────────────────────
-- Students never read answer keys directly; the quiz runner fetches a sanitized
-- payload server-side and grading occurs with a privileged client.
create policy "questions_manager_all"
  on public.questions for all
  to authenticated
  using (public.is_quiz_manager(quiz_id))
  with check (public.is_quiz_manager(quiz_id));

create policy "quiz_options_manager_all"
  on public.quiz_options for all
  to authenticated
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_id and public.is_quiz_manager(q.quiz_id)
    )
  )
  with check (
    exists (
      select 1 from public.questions q
      where q.id = question_id and public.is_quiz_manager(q.quiz_id)
    )
  );

-- ── Attempts & answers ───────────────────────────────────────────────────────
create policy "quiz_attempts_read"
  on public.quiz_attempts for select
  to authenticated
  using (
    student_id = (select auth.uid())
    or exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and public.is_course_manager(q.course_id)
    )
  );

create policy "quiz_answers_read"
  on public.quiz_answers for select
  to authenticated
  using (public.can_view_attempt(attempt_id));

-- Attempts/answers are inserted and graded server-side with a privileged client
-- after explicit authorization. No learner write policies exist by design.

-- ── Assignments ──────────────────────────────────────────────────────────────
create policy "assignments_read"
  on public.assignments for select
  to authenticated
  using (public.is_course_manager(course_id) or public.is_enrolled(course_id));

create policy "assignments_manager_insert"
  on public.assignments for insert
  to authenticated
  with check (public.is_course_manager(course_id));

create policy "assignments_manager_update"
  on public.assignments for update
  to authenticated
  using (public.is_course_manager(course_id))
  with check (public.is_course_manager(course_id));

create policy "assignments_manager_delete"
  on public.assignments for delete
  to authenticated
  using (public.is_course_manager(course_id));

-- ── Assignment submissions ───────────────────────────────────────────────────
create policy "submissions_read"
  on public.assignment_submissions for select
  to authenticated
  using (
    student_id = (select auth.uid())
    or public.is_assignment_manager(assignment_id)
  );

create policy "submissions_student_insert"
  on public.assignment_submissions for insert
  to authenticated
  with check (
    student_id = (select auth.uid())
    and grade is null
    and status = 'submitted'
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id
        and public.is_enrolled(a.course_id)
    )
  );

create policy "submissions_student_update"
  on public.assignment_submissions for update
  to authenticated
  using (student_id = (select auth.uid()) and grade is null)
  with check (
    student_id = (select auth.uid())
    and grade is null
    and status in ('submitted', 'returned')
  );

create policy "submissions_manager_update"
  on public.assignment_submissions for update
  to authenticated
  using (public.is_assignment_manager(assignment_id))
  with check (public.is_assignment_manager(assignment_id));

create policy "submissions_student_delete"
  on public.assignment_submissions for delete
  to authenticated
  using (student_id = (select auth.uid()) and grade is null);

-- ── Notifications ────────────────────────────────────────────────────────────
create policy "notifications_read_own"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Inserted by security-definer functions / trusted server operations only.

-- ── Certificates ─────────────────────────────────────────────────────────────
create policy "certificates_read_authorized"
  on public.certificates for select
  to authenticated
  using (
    student_id = (select auth.uid())
    or public.is_course_manager(course_id)
    or public.is_org_admin(org_id)
  );

-- Public verification goes through verify_certificate(code) only.

-- ── Activity logs ────────────────────────────────────────────────────────────
create policy "activity_logs_admin_read"
  on public.activity_logs for select
  to authenticated
  using (public.is_super_admin() or (org_id is not null and public.is_org_admin(org_id)));
