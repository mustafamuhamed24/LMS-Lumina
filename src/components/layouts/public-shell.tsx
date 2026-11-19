import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import type { SessionUser } from '@/types/app';
import { Badge } from '@/components/ui/badge';
import { roleHome } from '@/lib/roles';

export function Brand({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-3">
        <GraduationCap className="size-4.5" />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">Learnova</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Learning platform</span>
        </span>
      ) : null}
    </Link>
  );
}

export function PublicHeader({ user, platformName }: { user: SessionUser | null; platformName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Brand />
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/courses" className="text-muted-foreground transition-colors hover:text-foreground">
              Courses
            </Link>
            <Link href="/#for-organizations" className="text-muted-foreground transition-colors hover:text-foreground">
              For organizations
            </Link>
            <Link href="/verify" className="text-muted-foreground transition-colors hover:text-foreground">
              Verify certificate
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href={roleHome(user.profile.role)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <span className="hidden sm:inline">{user.profile.full_name.split(' ')[0]}&apos;s dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="border-t bg-muted/30 px-4 py-1.5 text-center text-[11px] text-muted-foreground md:hidden">
        {platformName} · Learn without limits
      </div>
    </header>
  );
}

export function PublicFooter({ platformName }: { platformName: string }) {
  return (
    <footer className="border-t bg-muted/25">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <Brand />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {platformName} unifies course delivery, assessment, progress tracking and certification for modern learning
            organizations.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/courses" className="text-muted-foreground hover:text-foreground">
                Course catalog
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-muted-foreground hover:text-foreground">
                Create an account
              </Link>
            </li>
            <li>
              <Link href="/verify" className="text-muted-foreground hover:text-foreground">
                Certificate verification
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Student sign in
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Instructor sign in
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Administrator sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} {platformName}. All rights reserved.</span>
          <Badge variant="outline" className="font-normal">
            Multi-organization · RLS secured
          </Badge>
        </div>
      </div>
    </footer>
  );
}
