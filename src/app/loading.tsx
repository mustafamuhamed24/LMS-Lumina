import { Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
