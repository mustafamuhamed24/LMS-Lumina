-- =============================================================================
-- Lumina LMS — safe aggregate read functions for public/marketing surfaces.
-- Aggregates must not leak unpublished or cross-tenant rows.
-- =============================================================================

create or replace function public.get_course_metrics(p_course_ids uuid[])
returns table (course_id uuid, lesson_count bigint, student_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    (select count(*) from public.lessons l where l.course_id = c.id and l.is_published),
    (select count(*) from public.enrollments e where e.course_id = c.id and e.status in ('active', 'completed'))
  from public.courses c
  where c.id = any(p_course_ids)
    and c.deleted_at is null
    and (
      c.status = 'published'
      or public.is_course_manager(c.id)
      or public.is_org_admin(c.org_id)
    );
$$;

create or replace function public.get_public_stats()
returns table (courses bigint, learners bigint, organizations bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.courses c where c.status = 'published' and c.deleted_at is null),
    (select count(*) from public.profiles p where p.role = 'student' and p.status = 'active'),
    (select count(*) from public.organizations o where o.is_active and o.deleted_at is null);
$$;

revoke all on function public.get_course_metrics(uuid[]) from public;
revoke all on function public.get_public_stats() from public;
grant execute on function public.get_course_metrics(uuid[]) to anon, authenticated;
grant execute on function public.get_public_stats() to anon, authenticated;
