import Link from 'next/link';
import { CheckCircle2, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { requireStudent } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { InstructorRequestForm } from '@/features/student/components/instructor-request-form';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Teach on Lumina' };

export default async function BecomeInstructorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireStudent();
  const supabase = await createServerSupabaseClient();
  const { data: request } = await supabase
    .from('instructor_requests')
    .select('id,status,message,created_at,reviewed_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const justSubmitted = params.requested === '1' || params.submitted === '1';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teach on Lumina"
        description={`Share your expertise with learners at ${user.activeOrg?.name ?? 'your organization'}.`}
        actions={
          <Button asChild variant="outline">
            <Link href="/student/profile">
              <GraduationCap /> Your profile
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Instructor access
              {request ? <StatusBadge status={request.status} /> : null}
            </CardTitle>
            <CardDescription>
              Instructor accounts can build courses, manage sections and lessons, and grade student work. To keep each
              organization safe, teaching access is reviewed by an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {justSubmitted && request?.status === 'pending' ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p>
                  Your request was submitted. You will receive a notification when an administrator reviews it. You can
                  keep learning in the meantime.
                </p>
              </div>
            ) : null}

            {request?.status === 'pending' ? (
              <div className="space-y-3">
                <p className="text-sm">
                  Your request is waiting for review. Submitted {formatDateTime(request.created_at)}.
                </p>
                {request.message ? (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your note</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{request.message}</p>
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  If you need to change your request, contact your organization administrator. You can continue using
                  your student account normally.
                </p>
              </div>
            ) : null}

            {request?.status === 'rejected' && !justSubmitted ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-destructive/30 bg-destructive/[0.04] p-3 text-sm">
                  Your previous request was not approved
                  {request.reviewed_at ? ` (${formatDateTime(request.reviewed_at)})` : ''}. You can submit a new request
                  with more detail below.
                </div>
                <InstructorRequestForm />
              </div>
            ) : null}

            {!request || (request.status === 'rejected' && justSubmitted) ? <InstructorRequestForm /> : null}

            {request?.status === 'approved' ? (
              <div className="space-y-3 text-sm">
                <p>Your instructor access is active. Open your teaching workspace to start building courses.</p>
                <Button asChild>
                  <Link href="/instructor">Go to instructor dashboard</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> How it works
            </CardTitle>
            <CardDescription>A quick, transparent approval process.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <span>Send a request with a short note about what you would like to teach.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <span>An organization administrator reviews your request and your profile.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                <span>Once approved, instructor tools unlock immediately and you receive a notification.</span>
              </li>
            </ol>
            <div className="mt-5 flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              Roles are enforced by database policies and audited activity logs. Public signup can never grant teaching
              or administrator access by itself.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
