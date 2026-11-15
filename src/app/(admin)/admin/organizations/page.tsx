import Link from 'next/link';
import { Building2, ExternalLink, Users } from 'lucide-react';
import { requireSuperAdmin } from '@/lib/auth/session';
import { getAdminScope } from '@/lib/data/scope';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { OrganizationDialog } from '@/features/admin/components/organization-dialog';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Organizations' };

export default async function AdminOrganizationsPage() {
  const user = await requireSuperAdmin();
  const scope = await getAdminScope(user);
  const supabase = await createServerSupabaseClient();

  const [{ data: courses }, { data: members }] = await Promise.all([
    supabase.from('courses').select('org_id').is('deleted_at', null),
    supabase.from('organization_members').select('org_id').eq('status', 'active'),
  ]);

  const courseCounts = new Map<string, number>();
  for (const course of courses ?? []) courseCounts.set(course.org_id, (courseCounts.get(course.org_id) ?? 0) + 1);
  const memberCounts = new Map<string, number>();
  for (const member of members ?? []) memberCounts.set(member.org_id, (memberCounts.get(member.org_id) ?? 0) + 1);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Organizations"
        description="Tenant workspaces with isolated users, courses, enrollments and reporting."
        actions={<OrganizationDialog />}
      />

      {scope.organizations.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scope.organizations.map((organization) => (
            <Card key={organization.id} className="overflow-hidden">
              <div className="h-1.5 w-full" style={{ backgroundColor: organization.primary_color }} />
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: organization.primary_color }}
                    >
                      {organization.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{organization.name}</p>
                      <p className="truncate text-xs text-muted-foreground">/{organization.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <OrganizationDialog
                      organization={{
                        id: organization.id,
                        name: organization.name,
                        slug: organization.slug,
                        description: organization.description,
                        logo_url: organization.logo_url,
                        website_url: organization.website_url,
                        primary_color: organization.primary_color,
                        is_active: organization.is_active,
                      }}
                    />
                  </div>
                </div>

                <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {organization.description ?? 'No description provided.'}
                </p>

                <div className="flex items-center justify-between border-t pt-3 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" /> {memberCounts.get(organization.id) ?? 0} people
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="size-3" /> {courseCounts.get(organization.id) ?? 0} courses
                    </span>
                  </div>
                  <StatusBadge status={organization.is_active ? 'active' : 'suspended'} />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Created {formatDate(organization.created_at)}
                  </span>
                  <div className="flex gap-1">
                    {organization.website_url ? (
                      <Button asChild variant="ghost" size="icon-sm">
                        <Link href={organization.website_url} target="_blank" rel="noreferrer" aria-label="Website">
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/courses?org=${organization.slug}`}>View catalog</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create the first organization to begin onboarding instructors and learners."
          action={<OrganizationDialog />}
        />
      )}
    </div>
  );
}
