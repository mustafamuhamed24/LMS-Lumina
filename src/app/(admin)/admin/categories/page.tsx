import Link from 'next/link';
import { BookOpen, FolderTree } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { getAdminScope } from '@/lib/data/scope';
import { getAdminCategories } from '@/features/admin/queries';
import { deleteCategoryAction } from '@/features/admin/actions';
import { CategoryDialog } from '@/features/admin/components/category-dialog';
import { PageHeader } from '@/components/dashboard/page-header';
import { ConfirmButton } from '@/components/forms/confirm-button';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Categories' };

export default async function AdminCategoriesPage() {
  const user = await requireAdmin();
  const scope = await getAdminScope(user);
  const categories = await getAdminCategories(scope);
  const orgs = scope.organizations.map((organization) => ({ id: organization.id, name: organization.name }));
  const orgMap = new Map(orgs.map((org) => [org.id, org.name]));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        description="Organize the course catalog with consistent taxonomy and colour coding."
        actions={<CategoryDialog orgs={orgs} defaultOrgId={scope.orgIds[0]} />}
      />

      {categories.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const count = category.courses?.[0]?.count ?? 0;
            return (
              <Card key={category.id} className="gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{category.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{orgMap.get(category.org_id) ?? 'Organization'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <CategoryDialog
                      orgs={orgs}
                      category={{
                        id: category.id,
                        org_id: category.org_id,
                        name: category.name,
                        description: category.description,
                        color: category.color,
                      }}
                    />
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <ConfirmButton
                        message={`Delete the "${category.name}" category? Courses will become uncategorised.`}
                        variant="ghost"
                      >
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
                <p className="line-clamp-2 min-h-9 text-sm text-muted-foreground">
                  {category.description ?? 'No description provided.'}
                </p>
                <div className="flex items-center justify-between border-t pt-3">
                  <Badge variant="muted">
                    <BookOpen className="size-3" /> {count} {count === 1 ? 'course' : 'courses'}
                  </Badge>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/courses?category=${category.slug}`}>View in catalog</Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create categories so learners can browse the catalog by subject."
          action={<CategoryDialog orgs={orgs} defaultOrgId={scope.orgIds[0]} />}
        />
      )}
    </div>
  );
}
