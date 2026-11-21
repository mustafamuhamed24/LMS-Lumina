import { Skeleton } from '@/components/ui/skeleton';

export default function LearnLoading() {
  return (
    <div className="min-h-dvh bg-muted/20">
      <div className="border-b bg-background">
        <div className="flex h-14 items-center justify-between gap-3 px-5">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-0.5 w-full rounded-none" />
      </div>
      <div className="mx-auto flex max-w-7xl items-start gap-6 px-6 py-6">
        <Skeleton className="hidden h-[520px] w-72 shrink-0 rounded-xl lg:block" />
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
