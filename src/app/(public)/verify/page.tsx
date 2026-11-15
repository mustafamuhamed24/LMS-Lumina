import Link from 'next/link';
import { Award, BadgeCheck, Download, Search, ShieldCheck, XCircle } from 'lucide-react';
import { verifyCertificate } from '@/features/student/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Verify a certificate' };

export default async function VerifyCertificatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.code === 'string' ? params.code.trim() : '';
  const certificate = code ? await verifyCertificate(code) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Verify a Lumina certificate</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Enter the credential code printed on a certificate to confirm its authenticity and view the achievement details.
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Credential lookup</CardTitle>
          <CardDescription>Codes look like LUM-AB12CD34EF56.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="code">Credential code</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="code" name="code" defaultValue={code} placeholder="LUM-…" className="pl-9 font-mono" required />
              </div>
            </div>
            <Button type="submit">
              <ShieldCheck /> Verify
            </Button>
          </form>
        </CardContent>
      </Card>

      {code && certificate ? (
        <Card className="mt-6 overflow-hidden border-emerald-500/25">
          <CardHeader className="border-b bg-emerald-500/[0.05]">
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <BadgeCheck className="size-5" /> Certificate verified
            </CardTitle>
            <CardDescription>The credential below is authentic and was issued by Lumina LMS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 py-6">
            <div className="text-center">
              <Award className="mx-auto size-8 text-amber-600" />
              <p className="mt-3 text-sm text-muted-foreground">This certifies that</p>
              <p className="mt-1 text-2xl font-semibold">{certificate.student_name}</p>
              <p className="mt-3 text-sm text-muted-foreground">successfully completed</p>
              <p className="mt-1 text-lg font-semibold">{certificate.course_title}</p>
            </div>
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Organization</p>
                <p className="mt-0.5 font-medium">{certificate.org_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Instructor</p>
                <p className="mt-0.5 font-medium">{certificate.instructor_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Issued</p>
                <p className="mt-0.5 font-medium">{formatDate(certificate.issued_at, 'd MMMM yyyy')}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Credential code</p>
                <p className="mt-0.5 font-mono font-medium">{certificate.code}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <a href={`/api/certificates/${encodeURIComponent(certificate.code)}/pdf`} target="_blank" rel="noreferrer">
                  <Download /> Download PDF
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/courses">Explore courses</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : code ? (
        <Card className="mt-6 border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="size-5" /> Certificate not found
            </CardTitle>
            <CardDescription>
              We could not find a certificate with the code “{code}”. Check the code and try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Credential codes are case-insensitive but must match exactly otherwise. Contact the issuing organization if the
              problem continues.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
