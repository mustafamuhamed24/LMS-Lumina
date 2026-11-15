import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Award, BadgeCheck, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { requireStudent } from '@/lib/auth/session';
import { getStudentCertificate } from '@/features/student/queries';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Certificate' };

export default async function CertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStudent();
  const certificate = await getStudentCertificate(user, id);
  if (!certificate) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Certificate of completion"
        description="Your achievement is publicly verifiable using the credential code below."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/verify?code=${certificate.code}`} target="_blank">
                <ExternalLink /> Verify
              </Link>
            </Button>
            <Button asChild>
              <a href={`/api/certificates/${certificate.code}/pdf`} target="_blank" rel="noreferrer">
                <Download /> Download PDF
              </a>
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="relative border-b bg-gradient-to-br from-amber-50 via-background to-primary/[0.05] px-6 py-10 text-center dark:from-amber-500/10">
          <div className="pointer-events-none absolute inset-4 rounded-lg border border-amber-500/20" />
          <div className="relative">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
              <Award className="size-7" />
            </span>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Certificate of completion</p>
            <p className="mt-4 text-sm text-muted-foreground">This certifies that</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{certificate.student_name}</h1>
            <p className="mt-4 text-sm text-muted-foreground">has successfully completed</p>
            <p className="mx-auto mt-1 max-w-xl text-xl font-semibold">{certificate.course_title}</p>
            <div className="mx-auto mt-6 grid max-w-xl gap-3 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <p className="uppercase tracking-wide">Instructor</p>
                <p className="mt-0.5 font-medium text-foreground">{certificate.instructor_name}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide">Issued</p>
                <p className="mt-0.5 font-medium text-foreground">{formatDate(certificate.issued_at, 'd MMMM yyyy')}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide">Organization</p>
                <p className="mt-0.5 font-medium text-foreground">{certificate.org_name}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide">Credential code</p>
                <p className="mt-0.5 font-mono font-medium text-foreground">{certificate.code}</p>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BadgeCheck className="size-4 text-emerald-600" />
            Verified by {certificate.org_name}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/student/certificates">
              <ShieldCheck /> All certificates
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
