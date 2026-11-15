-- =============================================================================
-- Lumina LMS — denormalized course counters for efficient catalog sorting.
-- Maintained by triggers so list queries never scan lessons/enrollments.
-- =============================================================================

alter table public.courses
  add column if not exists lesson_count integer not null default 0 check (lesson_count >= 0),
  add column if not exists student_count integer not null default 0 check (student_count >= 0);

update public.courses c
set lesson_count = (
      select count(*) from public.lessons l where l.course_id = c.id and l.is_published
    ),
    student_count = (
      select count(*) from public.enrollments e where e.course_id = c.id and e.status in ('active', 'completed')
    );

create or replace function public.refresh_course_lesson_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course uuid := coalesce(new.course_id, old.course_id);
begin
  update public.courses c
  set lesson_count = (
    select count(*) from public.lessons l where l.course_id = v_course and l.is_published
  )
  where c.id = v_course;
  return null;
end;
$$;

drop trigger if exists lessons_refresh_count on public.lessons;
create trigger lessons_refresh_count
  after insert or delete or update of course_id, is_published on public.lessons
  for each row execute function public.refresh_course_lesson_count();

create or replace function public.refresh_course_student_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course uuid := coalesce(new.course_id, old.course_id);
begin
  update public.courses c
  set student_count = (
    select count(*) from public.enrollments e
    where e.course_id = v_course and e.status in ('active', 'completed')
  )
  where c.id = v_course;
  return null;
end;
$$;

drop trigger if exists enrollments_refresh_count on public.enrollments;
create trigger enrollments_refresh_count
  after insert or delete or update of course_id, status on public.enrollments
  for each row execute function public.refresh_course_student_count();

create index if not exists courses_popular_idx
  on public.courses (student_count desc)
  where status = 'published' and deleted_at is null;
