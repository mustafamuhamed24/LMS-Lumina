import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { CourseCardData } from '@/types/app';
import { cn, formatDuration, initials, initialsColor } from '@/lib/utils';

const DIFFICULTY_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const;

export function CourseCard({
  course,
  enrollment,
  href,
  compact = false,
  className,
}: {
  course: CourseCardData;
  enrollment?: { progress_percent: number; status: string } | null;
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href ?? `/courses/${course.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-elevated)]',
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 via-transparent to-chart-2/15">
            <BookOpen className="size-8 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {course.category ? (
            <span className="rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
              {course.category.name}
            </span>
          ) : (
            <span />
          )}
          {course.is_featured ? (
            <Badge className="border-white/20 bg-white/90 text-[10px] text-slate-900 hover:bg-white">Featured</Badge>
          ) : null}
        </div>
      </div>

      <div className={cn('flex flex-1 flex-col gap-3 p-4', compact && 'gap-2 p-3.5')}>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="font-normal">
            {DIFFICULTY_LABEL[course.difficulty]}
          </Badge>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" /> {formatDuration(course.duration_minutes)}
          </span>
        </div>

        <div>
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
            {course.title}
          </h3>
          {!compact && course.subtitle ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.subtitle}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-6">
              {course.instructor.avatar_url ? <AvatarImage src={course.instructor.avatar_url} alt="" /> : null}
              <AvatarFallback className={cn('text-[10px]', initialsColor(course.instructor.id))}>
                {initials(course.instructor.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">{course.instructor.full_name}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-3" /> {course.lesson_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" /> {course.student_count}
            </span>
          </div>
        </div>

        {enrollment ? (
          <div className="space-y-1.5 border-t pt-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {enrollment.status === 'completed' ? 'Completed' : enrollment.status === 'pending' ? 'Awaiting approval' : 'In progress'}
              </span>
              <span className="font-medium">{Math.round(enrollment.progress_percent)}%</span>
            </div>
            <Progress value={enrollment.progress_percent} className="h-1" />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
