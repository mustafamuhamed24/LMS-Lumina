-- =============================================================================
-- Instructor access requests
--
-- Public self-registration can only create student profiles. People who want to
-- teach submit a request for their organization, and an organization or platform
-- administrator approves it. Approval is performed by trusted server code with
-- the service-role client after an explicit permission check, because it changes
-- profiles.role and organization_members.role.
-- =============================================================================

create table if not exists public.instructor_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  message text check (message is null or char_length(message) <= 500),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists instructor_requests_one_pending_per_user
  on public.instructor_requests (user_id)
  where status = 'pending';

create index if not exists instructor_requests_org_status_idx
  on public.instructor_requests (org_id, status, created_at desc);

drop trigger if exists instructor_requests_updated_at on public.instructor_requests;
create trigger instructor_requests_updated_at
  before update on public.instructor_requests
  for each row execute function public.set_updated_at();

alter table public.instructor_requests enable row level security;

-- Applicants can see their own request; organization and platform admins can
-- review requests in their scope.
create policy "instructor_requests_select"
  on public.instructor_requests for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_org_admin(org_id)
    or public.is_super_admin()
  );

-- A student may request instructor access only for an organization they belong
-- to, and only while they are still a student. The request starts pending; the
-- status is not user-writable.
create policy "instructor_requests_insert_own"
  on public.instructor_requests for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and public.is_org_member(org_id)
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'student'
        and p.status = 'active'
    )
  );

-- No update/delete policies: approvals and rejections run through server
-- actions using the service-role client after authorization, so a user can
-- never approve their own request.

grant select, insert on public.instructor_requests to authenticated;
grant all on public.instructor_requests to service_role;
