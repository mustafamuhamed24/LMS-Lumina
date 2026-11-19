import Link from 'next/link';
import { GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[oklch(0.2_0.05_277)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 surface-grid opacity-[0.08]" />
        <Link href="/" className="relative flex items-center gap-3 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
            <GraduationCap className="size-5" />
          </span>
          Learnova LMS
        </Link>
        <div className="relative space-y-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="size-3.5" /> Knowledge, structured.
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-balance">
              One calm place for learning, teaching and progress.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              Learnova brings courses, assessments, feedback and certification together for modern learning organizations.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-emerald-300" /> Organization-scoped, role-aware access
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-emerald-300" /> Assessments graded securely server-side
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-emerald-300" /> Verifiable completion certificates
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Learnova LMS</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground lg:hidden">
            <GraduationCap className="size-5 text-primary" /> Learnova LMS
          </Link>
          <div className="mb-7">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
