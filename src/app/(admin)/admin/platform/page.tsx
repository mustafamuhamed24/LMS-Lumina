import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  XCircle,
} from 'lucide-react';
import { requireSuperAdmin } from '@/lib/auth/session';
import { getAdminScope } from '@/lib/data/scope';
import { getPlatformOverview } from '@/features/platform/queries';
import { listInstructorRequests } from '@/features/admin/queries';
import { reviewInstructorRequestAction } from '@/features/admin/actions';
import { UserDialog } from '@/features/admin/components/user-dialog';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PlatformGrowthChart } from '@/components/charts/charts';
import { ConfirmButton } from '@/components/forms/confirm-button';
import { EmptyState } from '@/components/shared/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatDate, formatNumber, initials, initialsColor, percent } from '@/lib/utils';

export const metadata = { title: 'Platform overview' };

const CAPABILITIES: { label: string; roles: string[] }[] = [
  { label: 'All tenants, platform settings and role changes', roles: ['super_admin'] },
  { label: 'Organization users, branding, courses and enrollments', roles: ['super_admin', 'org_admin'] },
  { label: 'Course builder, quizzes, assignments and grading', roles: ['super_admin', 'org_admin', 'instructor'] },
  { label: 'Instructor request approvals', roles: ['super_admin', 'org_admin'] },
  { label: 'Learning, submissions and certificates', roles: ['super_admin', 'org_admin', 'instructor', 'student'] },
];

const ROLE_COLUMNS = [
  { key: 'super_admin', label: 'Platform' },
  { key: 'org_admin', label: 'Org admin' },
  { key: 'instructor', label: 'Instructor' },
  { key: 'student', label: 'Student' },
];

export default async function PlatformPage() {
  const user = await requireSuperAdmin();
  const scope = await getAdminScope(user);
  const orgs = scope.organizations.map((organization) => ({ id: organization.id, name: organization.name }));
  const [overview, pendingRequests] = await Promise.all([
    getPlatformOverview(),
    listInstructorRequests(scope, { status: 'pending', limit: 6 }),
  ]);

  const completionRate = overview.totals.enrollments
    ? (overview.totals.completedEnrollments / overview.totals.enrollments) * 100
    : 0;
  const gradingRate = overview.totals.submissions
    ? (overview.totals.gradedSubmissions / overview.totals.submissions) * 100
    : 0;
  const roleData = [
    { name: 'Students', value: overview.totals.students },
    { name: 'Instructors', value: overview.totals.instructors },
    { name: 'Org admins', value: overview.totals.orgAdmins },
    { name: 'Platform admins', value: overview.totals.superAdmins },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform control"
        description="Cross-tenant insights, instructor approvals and access management for the whole platform."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/organizations">
                <Building2 /> Organizations
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/users">
                <UserCog /> Access management
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Organizations"
          value={formatNumber(overview.totals.organizations)}
          hint={`${formatNumber(overview.totals.activeOrganizations)} active`}
          icon={Building2}
        />
        <StatCard
          label="People"
          value={formatNumber(overview.totals.users)}
          hint={`${formatNumber(overview.totals.instructors)} instructors · ${formatNumber(overview.totals.students)} learners`}
          icon={Users}
        />
        <StatCard
          label="Published courses"
          value={formatNumber(overview.totals.publishedCourses)}
          hint={`${formatNumber(overview.totals.draftCourses)} drafts`}
          icon={BookOpen}
        />
        <StatCard
          label="Completion rate"
          value={percent(completionRate)}
          hint={`${formatNumber(overview.totals.completedEnrollments)} completions`}
          icon={Award}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Platform growth</CardTitle>
              <CardDescription>New accounts and enrollments over the last six months.</CardDescription>
            </div>
            <Badge variant="muted">6 months</Badge>
          </CardHeader>
          <CardContent>
            {overview.growth.some((point) => point.users > 0 || point.enrollments > 0) ? (
              <PlatformGrowthChart data={overview.growth} />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No platform activity yet"
                description="New accounts and enrollments will appear here as organizations start using Learnova."
                className="border-0 bg-transparent py-10"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>People by role</CardTitle>
            <CardDescription>Access distribution across every tenant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roleData.map((role) => {
              const width = overview.totals.users ? (role.value / overview.totals.users) * 100 : 0;
              return (
                <div key={role.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{role.name}</span>
                    <span className="font-semibold">{formatNumber(role.value)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(width, role.value ? 2 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="grid grid-cols-2 gap-3 border-t pt-4">
              <div className="rounded-lg border bg-muted/25 p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <ClipboardCheck className="size-3" /> Graded work
                </div>
                <p className="mt-1.5 text-xl font-semibold">{percent(gradingRate)}</p>
              </div>
              <div className="rounded-lg border bg-muted/25 p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Award className="size-3" /> Certificates
                </div>
                <p className="mt-1.5 text-xl font-semibold">{formatNumber(overview.totals.certificates)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Tenants</CardTitle>
              <CardDescription>Members, catalog size and learning activity per organization.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/organizations">
                Manage <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {overview.organizations.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Organization</TableHead>
                    <TableHead>People</TableHead>
                    <TableHead className="hidden sm:table-cell">Courses</TableHead>
                    <TableHead className="hidden md:table-cell">Enrollments</TableHead>
                    <TableHead className="hidden lg:table-cell">Completion</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.organizations.map((organization) => {
                    const rate = organization.enrollments
                      ? (organization.completions / organization.enrollments) * 100
                      : 0;
                    return (
                      <TableRow key={organization.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: organization.primaryColor }}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{organization.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {organization.slug} · since {formatDate(organization.createdAt)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatNumber(organization.members)}</span>
                            {organization.isActive ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="muted">Inactive</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm">{formatNumber(organization.courses)}</span>
                          <span className="ml-1 text-xs text-muted-foreground">({organization.publishedCourses} live)</span>
                        </TableCell>
                        <TableCell className="hidden text-sm md:table-cell">{formatNumber(organization.enrollments)}</TableCell>
                        <TableCell className="hidden text-sm lg:table-cell">{percent(rate)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/users?org=${organization.id}`}>People</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={Building2}
                title="No organizations yet"
                description="Create the first tenant to start onboarding people."
                className="m-4 border-0 bg-transparent"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Access management
            </CardTitle>
            <CardDescription>
              Change a person&apos;s role, organization or status. Updates are audited and protected by database policies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {overview.recentUsers.length ? (
              overview.recentUsers.map((person) => (
                <div key={person.id} className="flex items-center gap-3 border-b py-2.5 last:border-0 last:pb-0">
                  <Avatar className="size-8">
                    {person.avatar_url ? <AvatarImage src={person.avatar_url} alt="" /> : null}
                    <AvatarFallback className={cn('text-[10px] font-semibold', initialsColor(person.id))}>
                      {initials(person.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{person.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {person.organization?.name ?? 'No organization'}
                    </p>
                  </div>
                  <StatusBadge status={person.role} />
                  <UserDialog
                    orgs={orgs}
                    allowSuperAdmin
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
                </div>
              ))
            ) : (
              <EmptyState icon={Users} title="No people yet" className="border-0 bg-transparent py-8" />
            )}
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href="/admin/users">
                Search every account <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Permission model
            </CardTitle>
            <CardDescription>A simple reference for who can do what. Roles are enforced server-side and in Postgres.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Capability</TableHead>
                  {ROLE_COLUMNS.map((role) => (
                    <TableHead key={role.key} className="text-center">
                      {role.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {CAPABILITIES.map((capability) => (
                  <TableRow key={capability.label}>
                    <TableCell className="pl-6 text-sm">{capability.label}</TableCell>
                    {ROLE_COLUMNS.map((role) => (
                      <TableCell key={role.key} className="text-center">
                        {capability.roles.includes(role.key) ? (
                          <CheckCircle2 className="mx-auto size-4 text-emerald-600" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" /> Instructor requests
              </CardTitle>
              <CardDescription>Pending teaching access across all tenants.</CardDescription>
            </div>
            <Badge variant={overview.totals.pendingInstructorRequests ? 'warning' : 'muted'}>
              {overview.totals.pendingInstructorRequests} pending
            </Badge>
          </CardHeader>
          <CardContent>
            {pendingRequests.length ? (
              <div className="divide-y">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{request.person?.full_name ?? 'Applicant'}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {request.organization?.name ?? 'Organization'} · {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                    {request.message ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">“{request.message}”</p>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <form action={reviewInstructorRequestAction}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <ConfirmButton message={`Approve instructor access for ${request.person?.full_name ?? 'this person'}?`} variant="default">
                          <CheckCircle2 /> Approve
                        </ConfirmButton>
                      </form>
                      <form action={reviewInstructorRequestAction}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <ConfirmButton message="Reject this instructor request?" variant="ghost">
                          <XCircle /> Reject
                        </ConfirmButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No pending requests"
                description="New teaching requests appear here for review."
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
