import Link from 'next/link';
import { GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[oklch(0.2_0.05_277)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 surface-grid opacity-[0.08]" />
        <Link href="/" className="relative flex items-center gap-3 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
            <GraduationCap className="size-5" />
          </span>
          Lumina LMS
        </Link>
        <div className="relative space-y-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="size-3.5" /> Start learning today
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-balance">
              Structured learning that moves with you.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              Join your organization&apos;s learning space, work through guided courses, submit assessments and earn verified
              certificates.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-emerald-300" /> Private, organization-scoped learning
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-emerald-300" /> Progress, quiz results and feedback in one place
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-emerald-300" /> Verifiable, downloadable certificates
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Lumina LMS</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground lg:hidden">
            <GraduationCap className="size-5 text-primary" /> Lumina LMS
          </Link>
          <div className="mb-7">
            <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Create a student account or request teaching access. Instructor requests are reviewed by your
              organization administrator before instructor tools unlock.
            </p>
          </div>
          <RegisterForm />
        </div>
      </main>
    </div>
  );
}
