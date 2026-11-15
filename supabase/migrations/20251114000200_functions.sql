-- =============================================================================
-- Lumina LMS — helper predicates, triggers and transactional RPCs
-- All security-definer functions use an empty search_path and qualified names.
-- =============================================================================

-- ── Authorization predicates ─────────────────────────────────────────────────
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
      and p.status = 'active'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.status = 'active'
  );
$$;

create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1 from public.organization_members m
    where m.org_id = p_org
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.is_org_admin(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1 from public.organization_members m
    where m.org_id = p_org
      and m.user_id = (select auth.uid())
      and m.role = 'org_admin'
      and m.status = 'active'
  );
$$;

create or replace function public.is_course_manager(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = p_course
      and c.deleted_at is null
      and (
        public.is_super_admin()
        or c.instructor_id = (select auth.uid())
        or exists (
          select 1 from public.course_instructors ci
          where ci.course_id = c.id and ci.user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.organization_members m
          where m.org_id = c.org_id
            and m.user_id = (select auth.uid())
            and m.role = 'org_admin'
            and m.status = 'active'
        )
      )
  );
$$;

create or replace function public.is_enrolled(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = p_course
      and e.student_id = (select auth.uid())
      and e.status in ('active', 'completed')
  );
$$;

create or replace function public.can_view_course(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course
      and c.deleted_at is null
      and (
        c.status = 'published'
        or public.is_course_manager(c.id)
        or exists (
          select 1 from public.enrollments e
          where e.course_id = c.id
            and e.student_id = (select auth.uid())
            and e.status in ('active', 'completed')
        )
      )
  );
$$;

create or replace function public.can_view_lesson(p_lesson uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where l.id = p_lesson
      and c.deleted_at is null
      and (
        public.is_course_manager(c.id)
        or (l.is_published and public.can_view_course(c.id))
      )
  );
$$;

create or replace function public.is_admin_of_user(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.organization_members target
    join public.organization_members admin
      on admin.org_id = target.org_id
    where target.user_id = p_user
      and admin.user_id = (select auth.uid())
      and admin.role = 'org_admin'
      and admin.status = 'active'
  );
$$;

create or replace function public.is_instructor_of_student(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enrollments e
    where e.student_id = p_student
      and e.status in ('active', 'completed')
      and public.is_course_manager(e.course_id)
  );
$$;

create or replace function public.can_view_profile(p_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_profile = (select auth.uid())
    or public.is_super_admin()
    or public.is_admin_of_user(p_profile)
    or public.is_instructor_of_student(p_profile)
    or exists (
      select 1 from public.courses c
      where c.instructor_id = p_profile
        and c.status = 'published'
        and c.deleted_at is null
    );
$$;

create or replace function public.current_user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.org_id
  from public.organization_members m
  where m.user_id = (select auth.uid()) and m.status = 'active';
$$;

create or replace function public.can_access_lesson_content(p_lesson uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where l.id = p_lesson
      and c.deleted_at is null
      and l.is_published
      and (
        public.is_course_manager(c.id)
        or public.is_enrolled(c.id)
      )
  );
$$;

-- Curriculum metadata is safe to expose for published courses (no lesson content).
create or replace function public.get_course_curriculum(p_course uuid)
returns table (
  section_id uuid,
  section_title text,
  section_position integer,
  lesson_id uuid,
  lesson_title text,
  lesson_type public.lesson_type,
  lesson_position integer,
  is_preview boolean,
  estimated_minutes integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.title, s.position, l.id, l.title, l.type, l.position, l.is_preview, l.estimated_minutes
  from public.course_sections s
  join public.lessons l on l.section_id = s.id
  join public.courses c on c.id = s.course_id
  where c.id = p_course
    and c.deleted_at is null
    and l.is_published
    and (
      c.status = 'published'
      or public.is_course_manager(c.id)
      or public.is_enrolled(c.id)
    )
  order by s.position, l.position;
$$;

create or replace function public.is_quiz_manager(p_quiz uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.quizzes q
    where q.id = p_quiz and public.is_course_manager(q.course_id)
  );
$$;

create or replace function public.is_assignment_manager(p_assignment uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.assignments a
    where a.id = p_assignment and public.is_course_manager(a.course_id)
  );
$$;

create or replace function public.can_view_attempt(p_attempt uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quiz_attempts a
    join public.quizzes q on q.id = a.quiz_id
    where a.id = p_attempt
      and (a.student_id = (select auth.uid()) or public.is_course_manager(q.course_id))
  );
$$;

create or replace function public.can_author_in_org(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1 from public.organization_members m
    where m.org_id = p_org
      and m.user_id = (select auth.uid())
      and m.role in ('org_admin', 'instructor')
      and m.status = 'active'
  );
$$;

create or replace function public.is_active_member_of(p_org uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org
      and m.user_id = p_user
      and m.status = 'active'
  );
$$;

-- ── Auth triggers ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_org uuid;
begin
  v_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, 'Learner'), '@', 1)
  );

  -- Public registration can only ever create students. Role changes require
  -- an authenticated administrator and the service-role client.
  select o.id into v_org
  from public.organizations o
  where o.is_active and o.deleted_at is null
  order by o.created_at
  limit 1;

  insert into public.profiles (id, email, full_name, role, default_org_id, email_verified)
  values (new.id, coalesce(new.email, ''), v_name, 'student', v_org, new.email_confirmed_at is not null)
  on conflict (id) do nothing;

  if v_org is not null then
    insert into public.organization_members (org_id, user_id, role, status)
    values (v_org, new.id, 'student', 'active')
    on conflict (org_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null then
    update public.profiles
      set email_verified = true
      where id = new.id and email_verified = false;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

-- ── Privilege-escalation protection ──────────────────────────────────────────
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.email is distinct from old.email
     or new.email_verified is distinct from old.email_verified
     or new.default_org_id is distinct from old.default_org_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Protected profile fields can only be changed by an administrator'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ── Submission tamper protection ─────────────────────────────────────────────
create or replace function public.protect_submission_grades()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course uuid;
begin
  if auth.role() = 'service_role' or current_setting('lumina.system_update', true) = 'on' then
    return new;
  end if;

  select a.course_id into v_course
  from public.assignments a
  where a.id = old.assignment_id;

  if public.is_course_manager(v_course) then
    return new;
  end if;

  if new.grade is distinct from old.grade
     or new.feedback is distinct from old.feedback
     or new.graded_at is distinct from old.graded_at
     or new.graded_by is distinct from old.graded_by
     or new.status is distinct from old.status then
    raise exception 'You are not allowed to change grades or submission status'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists submissions_protect_grades on public.assignment_submissions;
create trigger submissions_protect_grades
  before update on public.assignment_submissions
  for each row execute function public.protect_submission_grades();

-- ── Tenant consistency validation ────────────────────────────────────────────
create or replace function public.validate_course_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.category_id is not null
     and not exists (
       select 1 from public.categories c
       where c.id = new.category_id and c.org_id = new.org_id
     ) then
    raise exception 'Category does not belong to the selected organization' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.organization_members m
    where m.org_id = new.org_id
      and m.user_id = new.instructor_id
      and m.status = 'active'
      and m.role in ('instructor', 'org_admin')
  ) then
    raise exception 'Instructor must be an active instructor in the organization' using errcode = '23514';
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.published_at := coalesce(new.published_at, now());
    elsif old.status is distinct from 'published' then
      new.published_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists courses_validate_tenant on public.courses;
create trigger courses_validate_tenant
  before insert or update on public.courses
  for each row execute function public.validate_course_tenant();

create or replace function public.validate_lesson_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.course_sections s
    where s.id = new.section_id and s.course_id = new.course_id
  ) then
    raise exception 'Section does not belong to the selected course' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists lessons_validate_tenant on public.lessons;
create trigger lessons_validate_tenant
  before insert or update on public.lessons
  for each row execute function public.validate_lesson_tenant();

create or replace function public.validate_assessment_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.lessons l
    join public.courses c on c.id = l.course_id
    where l.id = new.lesson_id and l.course_id = new.course_id and c.org_id = new.org_id
  ) then
    raise exception 'Assessment must belong to a lesson in the same course and organization' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists quizzes_validate_tenant on public.quizzes;
create trigger quizzes_validate_tenant
  before insert or update on public.quizzes
  for each row execute function public.validate_assessment_tenant();

drop trigger if exists assignments_validate_tenant on public.assignments;
create trigger assignments_validate_tenant
  before insert or update on public.assignments
  for each row execute function public.validate_assessment_tenant();

create or replace function public.validate_course_instructor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.courses c
    join public.organization_members m on m.org_id = c.org_id
    where c.id = new.course_id
      and m.user_id = new.user_id
      and m.status = 'active'
      and m.role in ('instructor', 'org_admin')
  ) then
    raise exception 'Co-instructor must be an active instructor in the course organization' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists course_instructors_validate on public.course_instructors;
create trigger course_instructors_validate
  before insert or update on public.course_instructors
  for each row execute function public.validate_course_instructor();

create or replace function public.validate_enrollment_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.courses c where c.id = new.course_id and c.org_id = new.org_id
  ) then
    raise exception 'Enrollment organization does not match the course' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists enrollments_validate_tenant on public.enrollments;
create trigger enrollments_validate_tenant
  before insert or update on public.enrollments
  for each row execute function public.validate_enrollment_tenant();

create or replace function public.validate_progress_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.enrollments e
    join public.lessons l on l.course_id = e.course_id
    where e.id = new.enrollment_id
      and l.id = new.lesson_id
      and e.student_id = new.student_id
  ) then
    raise exception 'Progress does not match the enrollment and lesson' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists lesson_progress_validate_tenant on public.lesson_progress;
create trigger lesson_progress_validate_tenant
  before insert or update on public.lesson_progress
  for each row execute function public.validate_progress_tenant();

create or replace function public.validate_attempt_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.quizzes q
    join public.enrollments e on e.course_id = q.course_id
    where q.id = new.quiz_id
      and e.id = new.enrollment_id
      and e.student_id = new.student_id
  ) then
    raise exception 'Quiz attempt does not match the enrollment' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists quiz_attempts_validate_tenant on public.quiz_attempts;
create trigger quiz_attempts_validate_tenant
  before insert or update on public.quiz_attempts
  for each row execute function public.validate_attempt_tenant();

create or replace function public.validate_answer_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.questions q
    join public.quiz_attempts a on a.quiz_id = q.quiz_id
    where q.id = new.question_id and a.id = new.attempt_id
  ) then
    raise exception 'Answer question does not belong to the attempt quiz' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists quiz_answers_validate_tenant on public.quiz_answers;
create trigger quiz_answers_validate_tenant
  before insert or update on public.quiz_answers
  for each row execute function public.validate_answer_tenant();

-- ── Enrollment tamper protection ─────────────────────────────────────────────
create or replace function public.protect_enrollment_state()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() = 'service_role'
     or current_setting('lumina.system_update', true) = 'on'
     or public.is_course_manager(old.course_id)
     or public.is_org_admin(old.org_id) then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.progress_percent is distinct from old.progress_percent
     or new.completed_at is distinct from old.completed_at
     or new.course_id is distinct from old.course_id
     or new.student_id is distinct from old.student_id then
    raise exception 'Enrollment state can only be changed through the learning workflow'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists enrollments_protect_state on public.enrollments;
create trigger enrollments_protect_state
  before update on public.enrollments
  for each row execute function public.protect_enrollment_state();

-- ── Enroll in a course ───────────────────────────────────────────────────────
create or replace function public.enroll_in_course(p_course_id uuid)
returns table (
  enrollment_id uuid,
  enrollment_status public.enrollment_status,
  requires_approval boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_course public.courses%rowtype;
  v_existing public.enrollments%rowtype;
  v_status public.enrollment_status;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'You must be signed in to enroll' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = v_uid and p.status = 'active'
  ) then
    raise exception 'Your account is not active' using errcode = '42501';
  end if;

  select * into v_course
  from public.courses c
  where c.id = p_course_id and c.status = 'published' and c.deleted_at is null;

  if not found then
    raise exception 'This course is not open for enrollment' using errcode = 'P0002';
  end if;

  perform set_config('lumina.system_update', 'on', true);

  select * into v_existing
  from public.enrollments e
  where e.course_id = p_course_id and e.student_id = v_uid;

  if found and v_existing.status in ('pending', 'active', 'completed') then
    return query select v_existing.id, v_existing.status, v_course.requires_approval;
    return;
  end if;

  v_status := case when v_course.requires_approval then 'pending'::public.enrollment_status
                   else 'active'::public.enrollment_status end;

  if found then
    update public.enrollments
      set status = v_status,
          progress_percent = 0,
          completed_at = null,
          enrolled_at = now(),
          last_accessed_at = null
      where id = v_existing.id
      returning id into v_id;
  else
    insert into public.enrollments (org_id, course_id, student_id, status)
    values (v_course.org_id, p_course_id, v_uid, v_status)
    returning id into v_id;
  end if;

  insert into public.notifications (org_id, user_id, type, title, body, link)
  values (
    v_course.org_id,
    v_uid,
    'enrollment',
    case when v_status = 'pending' then 'Enrollment request submitted' else 'You are enrolled' end,
    case when v_status = 'pending'
      then 'Your request to join "' || v_course.title || '" is awaiting approval.'
      else 'You are now enrolled in "' || v_course.title || '". Start learning today.'
    end,
    '/student/my-courses'
  );

  insert into public.notifications (org_id, user_id, type, title, body, link)
  values (
    v_course.org_id,
    v_course.instructor_id,
    'enrollment',
    case when v_status = 'pending' then 'New enrollment request' else 'New student enrolled' end,
    'A student joined "' || v_course.title || '".',
    '/instructor/students'
  );

  insert into public.activity_logs (org_id, user_id, action, entity_type, entity_id, metadata)
  values (
    v_course.org_id, v_uid, 'enrollment.created', 'enrollment', v_id,
    jsonb_build_object('course_id', p_course_id, 'status', v_status)
  );

  return query select v_id, v_status, v_course.requires_approval;
end;
$$;

-- ── Lesson progress + course completion + certificate issuance ───────────────
create or replace function public.record_lesson_progress(
  p_lesson_id uuid,
  p_completed boolean default true
)
returns table (
  progress numeric,
  completed_lessons integer,
  total_lessons integer,
  course_completed boolean,
  certificate_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_lesson public.lessons%rowtype;
  v_course public.courses%rowtype;
  v_enrollment public.enrollments%rowtype;
  v_total integer;
  v_done integer;
  v_progress numeric;
  v_completed boolean := false;
  v_code text;
  v_instructor text;
  v_org text;
  v_student text;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select l.* into v_lesson
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where l.id = p_lesson_id
    and l.is_published
    and c.deleted_at is null
    and c.status = 'published';

  if not found then
    raise exception 'Lesson not found' using errcode = 'P0002';
  end if;

  select * into v_course from public.courses where id = v_lesson.course_id;

  select * into v_enrollment
  from public.enrollments e
  where e.course_id = v_course.id and e.student_id = v_uid;

  if not found or v_enrollment.status not in ('active', 'completed') then
    raise exception 'You must be enrolled to track progress' using errcode = '42501';
  end if;

  perform set_config('lumina.system_update', 'on', true);

  insert into public.lesson_progress (org_id, enrollment_id, lesson_id, student_id, completed_at, last_viewed_at)
  values (v_course.org_id, v_enrollment.id, p_lesson_id, v_uid,
          case when p_completed then now() else null end, now())
  on conflict (enrollment_id, lesson_id) do update
    set last_viewed_at = now(),
        completed_at = coalesce(public.lesson_progress.completed_at, excluded.completed_at);

  select count(*) into v_total
  from public.lessons l
  where l.course_id = v_course.id and l.is_published;

  select count(*) into v_done
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  where lp.enrollment_id = v_enrollment.id
    and lp.completed_at is not null
    and l.is_published;

  v_progress := case when v_total > 0 then round((v_done::numeric / v_total::numeric) * 100, 2) else 0 end;

  update public.enrollments
    set progress_percent = v_progress,
        last_accessed_at = now(),
        status = case when v_total > 0 and v_done >= v_total and status = 'active' then 'completed'::public.enrollment_status else status end,
        completed_at = case when v_total > 0 and v_done >= v_total then coalesce(completed_at, now()) else completed_at end
    where id = v_enrollment.id;

  v_completed := v_total > 0 and v_done >= v_total;

  if v_completed then
    select exists (
      select 1 from public.certificates c where c.enrollment_id = v_enrollment.id
    ) into v_completed;

    if not v_completed then
      select p.full_name into v_student from public.profiles p where p.id = v_uid;
      select p.full_name into v_instructor from public.profiles p where p.id = v_course.instructor_id;
      select o.name into v_org from public.organizations o where o.id = v_course.org_id;

      v_code := 'LUM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

      insert into public.certificates (
        org_id, enrollment_id, student_id, course_id, code,
        student_name, course_title, instructor_name, org_name
      ) values (
        v_course.org_id, v_enrollment.id, v_uid, v_course.id, v_code,
        coalesce(v_student, 'Student'), v_course.title, coalesce(v_instructor, 'Instructor'), coalesce(v_org, 'Lumina')
      )
      on conflict (enrollment_id) do nothing
      returning code into v_code;

      if v_code is null then
        select c.code into v_code from public.certificates c where c.enrollment_id = v_enrollment.id;
      end if;

      insert into public.notifications (org_id, user_id, type, title, body, link)
      values (v_course.org_id, v_uid, 'completion', 'Course completed',
              'Congratulations! You completed "' || v_course.title || '" and earned a certificate.',
              '/student/certificates');

      insert into public.activity_logs (org_id, user_id, action, entity_type, entity_id, metadata)
      values (v_course.org_id, v_uid, 'course.completed', 'course', v_course.id,
              jsonb_build_object('enrollment_id', v_enrollment.id, 'certificate_code', v_code));
    else
      select c.code into v_code from public.certificates c where c.enrollment_id = v_enrollment.id;
    end if;
  end if;

  insert into public.activity_logs (org_id, user_id, action, entity_type, entity_id, metadata)
  values (v_course.org_id, v_uid,
          case when p_completed then 'lesson.completed' else 'lesson.viewed' end,
          'lesson', p_lesson_id,
          jsonb_build_object('course_id', v_course.id, 'progress', v_progress))
  on conflict do nothing;

  return query select v_progress, v_done, v_total, (v_total > 0 and v_done >= v_total), v_code;
end;
$$;

-- ── Public certificate verification ──────────────────────────────────────────
create or replace function public.verify_certificate(p_code text)
returns table (
  code text,
  student_name text,
  course_title text,
  instructor_name text,
  org_name text,
  issued_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.code, c.student_name, c.course_title, c.instructor_name, c.org_name, c.issued_at
  from public.certificates c
  where upper(c.code) = upper(btrim(p_code))
  limit 1;
$$;

-- ── Execution grants ─────────────────────────────────────────────────────────
revoke all on function public.enroll_in_course(uuid) from public;
revoke all on function public.record_lesson_progress(uuid, boolean) from public;
revoke all on function public.verify_certificate(text) from public;

grant execute on function public.enroll_in_course(uuid) to authenticated;
grant execute on function public.record_lesson_progress(uuid, boolean) to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;

revoke all on function public.is_super_admin() from public;
revoke all on function public.is_active_user() from public;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_admin(uuid) from public;
revoke all on function public.is_course_manager(uuid) from public;
revoke all on function public.is_enrolled(uuid) from public;
revoke all on function public.can_view_course(uuid) from public;
revoke all on function public.can_view_lesson(uuid) from public;
revoke all on function public.is_admin_of_user(uuid) from public;
revoke all on function public.is_instructor_of_student(uuid) from public;
revoke all on function public.can_view_profile(uuid) from public;
revoke all on function public.current_user_org_ids() from public;

revoke all on function public.is_quiz_manager(uuid) from public;
revoke all on function public.is_assignment_manager(uuid) from public;
revoke all on function public.can_view_attempt(uuid) from public;
revoke all on function public.can_access_lesson_content(uuid) from public;
revoke all on function public.get_course_curriculum(uuid) from public;
revoke all on function public.can_author_in_org(uuid) from public;
revoke all on function public.is_active_member_of(uuid, uuid) from public;

grant execute on function public.is_quiz_manager(uuid) to authenticated;
grant execute on function public.is_assignment_manager(uuid) to authenticated;
grant execute on function public.can_view_attempt(uuid) to authenticated;
grant execute on function public.can_access_lesson_content(uuid) to anon, authenticated;
grant execute on function public.get_course_curriculum(uuid) to anon, authenticated;
grant execute on function public.can_author_in_org(uuid) to authenticated;
grant execute on function public.is_active_member_of(uuid, uuid) to authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.is_active_user() to anon, authenticated;
grant execute on function public.is_org_member(uuid) to anon, authenticated;
grant execute on function public.is_org_admin(uuid) to anon, authenticated;
grant execute on function public.is_course_manager(uuid) to anon, authenticated;
grant execute on function public.is_enrolled(uuid) to anon, authenticated;
grant execute on function public.can_view_course(uuid) to anon, authenticated;
grant execute on function public.can_view_lesson(uuid) to anon, authenticated;
grant execute on function public.is_admin_of_user(uuid) to authenticated;
grant execute on function public.is_instructor_of_student(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.current_user_org_ids() to authenticated;
