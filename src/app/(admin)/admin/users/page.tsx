import { CheckCircle2, GraduationCap, Search, Users, XCircle } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminScope } from '@/lib/data/scope';
import { listAdminUsers, listInstructorRequests } from '@/features/admin/queries';
import { reviewInstructorRequestAction, setUserStatusAction } from '@/features/admin/actions';
import { UserDialog } from '@/features/admin/components/user-dialog';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ConfirmButton } from '@/components/forms/confirm-button';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, formatDate, initials, initialsColor } from '@/lib/utils';
import { adminUserQuerySchema } from '@/lib/validations';

export const metadata = { title: 'Users' };

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All roles' },
  { value: 'student', label: 'Students' },
  { value: 'instructor', label: 'Instructors' },
  { value: 'org_admin', label: 'Org admins' },
  { value: 'super_admin', label: 'Platform admins' },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : undefined);
  const query = adminUserQuerySchema.parse({
    search: get('search'),
    role: get('role') || undefined,
    status: get('status') || undefined,
    org: get('org') || undefined,
    page: get('page') ?? 1,
    pageSize: get('pageSize') ?? 10,
  });

  const user = await requireAdmin();
  const scope = await getAdminScope(user);
  const [result, pendingRequests] = await Promise.all([
    listAdminUsers(scope, query),
    listInstructorRequests(scope, { status: 'pending', limit: 12 }),
  ]);
  const orgs = scope.organizations.map((organization) => ({ id: organization.id, name: organization.name }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="Manage learners, instructors and administrators across your organization boundary."
        actions={<UserDialog orgs={orgs} allowSuperAdmin={scope.isSuperAdmin} defaultOrgId={scope.orgIds[0]} />}
      />

      {pendingRequests.length ? (
        <Card className="border-amber-500/30 bg-amber-500/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-4 text-amber-600" /> Instructor requests
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                {pendingRequests.length} pending
              </span>
            </CardTitle>
            <CardDescription>
              Approving unlocks the course builder, student management and grading tools for that person.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <Avatar className="size-9">
                  {request.person?.avatar_url ? <AvatarImage src={request.person.avatar_url} alt="" /> : null}
                  <AvatarFallback className={cn('text-[10px] font-semibold', initialsColor(request.user_id))}>
                    {initials(request.person?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{request.person?.full_name ?? 'Applicant'}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {request.person?.email ?? '—'} · {request.organization?.name ?? 'Organization'} ·{' '}
                    {formatDate(request.created_at)}
                  </p>
                  {request.message ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">“{request.message}”</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <form action={reviewInstructorRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <ConfirmButton
                      message={`Approve instructor access for ${request.person?.full_name ?? 'this person'}?`}
                      variant="default"
                    >
                      <CheckCircle2 /> Approve
                    </ConfirmButton>
                  </form>
                  <form action={reviewInstructorRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <ConfirmButton message={`Reject this instructor request?`} variant="ghost">
                      <XCircle /> Reject
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="gap-0 overflow-hidden py-0">
        <form className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="search" defaultValue={query.search} placeholder="Search by name or email…" className="pl-9" />
          </div>
          <select
            name="role"
            defaultValue={query.role ?? ''}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          >
            {ROLE_FILTERS.filter((role) => scope.isSuperAdmin || role.value !== 'super_admin').map((role) => (
              <option key={role.value || 'all'} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={query.status ?? ''}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          {scope.organizations.length > 1 ? (
            <select
              name="org"
              defaultValue={query.org ?? ''}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            >
              <option value="">All organizations</option>
              {scope.organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          ) : null}
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {result.items.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {person.avatar_url ? <AvatarImage src={person.avatar_url} alt="" /> : null}
                          <AvatarFallback className={cn('text-[10px] font-semibold', initialsColor(person.id))}>
                            {initials(person.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{person.full_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{person.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={person.role} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {person.organization?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={person.status} />
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {formatDate(person.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <UserDialog
                          orgs={orgs}
                          allowSuperAdmin={scope.isSuperAdmin}
                          defaultOrgId={person.default_org_id ?? scope.orgIds[0]}
                          user={{
                            id: person.id,
                            full_name: person.full_name,
                            email: person.email,
                            role: person.role,
                            status: person.status,
                            default_org_id: person.default_org_id,
                            headline: person.headline,
                          }}
                        />
                        {person.id !== user.id ? (
                          <form action={setUserStatusAction}>
                            <input type="hidden" name="userId" value={person.id} />
                            <input type="hidden" name="status" value={person.status === 'active' ? 'suspended' : 'active'} />
                            <ConfirmButton
                              message={
                                person.status === 'active'
                                  ? `Suspend ${person.full_name}? They will lose access immediately.`
                                  : `Reactivate ${person.full_name}?`
                              }
                              variant={person.status === 'active' ? 'ghost' : 'outline'}
                            >
                              {person.status === 'active' ? 'Suspend' : 'Activate'}
                            </ConfirmButton>
                          </form>
                        ) : (
                          <span className="pr-2 text-[10px] uppercase tracking-wider text-muted-foreground">You</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-3">
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                basePath="/admin/users"
                searchParams={{
                  search: query.search,
                  role: query.role,
                  status: query.status,
                  org: query.org,
                }}
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={Users}
            title="No people match those filters"
            description="Adjust the search, role or status filters, or add a new person to the organization."
            className="m-4 border-0 bg-transparent"
          />
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {result.items.length} of {result.total} people. Role changes are audited and protected by database policies.
      </p>
    </div>
  );
}
