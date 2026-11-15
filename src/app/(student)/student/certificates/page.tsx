import Link from 'next/link';
import { Award, BadgeCheck, Download, ExternalLink, GraduationCap, ShieldCheck } from 'lucide-react';
import { requireStudent } from '@/lib/auth/session';
import { listStudentCertificates } from '@/features/student/queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Certificates' };

export default async function StudentCertificatesPage() {
  const user = await requireStudent();
  const certificates = await listStudentCertificates(user);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Certificates"
        description="Verifiable proof of the courses you have completed."
        actions={
          <Button asChild variant="outline">
            <Link href="/student/my-courses">
              <GraduationCap /> My courses
            </Link>
          </Button>
        }
      />

      {certificates.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="overflow-hidden">
              <div className="relative overflow-hidden border-b bg-gradient-to-br from-amber-50 via-card to-primary/[0.04] px-4 py-5 dark:from-amber-500/10">
                <div className="flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                    <Award className="size-5" />
                  </span>
                  <BadgeCheck className="size-5 text-emerald-600" />
                </div>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Certificate of completion</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold">{certificate.course_title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{certificate.org_name}</p>
              </div>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Issued</span>
                  <span className="font-medium">{formatDate(certificate.issued_at)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Credential</span>
                  <span className="font-mono text-[11px] font-medium">{certificate.code}</span>
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/student/certificates/${certificate.id}`}>
                      <ShieldCheck /> View
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={`/api/certificates/${certificate.code}/pdf`} target="_blank" rel="noreferrer">
                      <Download />
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/verify?code=${certificate.code}`} target="_blank">
                      <ExternalLink />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete all published lessons in a course to earn a verifiable certificate."
          action={
            <Button asChild>
              <Link href="/student/my-courses">Continue learning</Link>
            </Button>
          }
          className="bg-card"
        />
      )}
    </div>
  );
}
