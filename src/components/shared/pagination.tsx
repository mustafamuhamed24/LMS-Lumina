import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
  className,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (target > 1) params.set('page', String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const pages: (number | 'ellipsis')[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) pages.push(1);
  if (start > 2) pages.push('ellipsis');
  for (let index = start; index <= end; index += 1) pages.push(index);
  if (end < totalPages - 1) pages.push('ellipsis');
  if (end < totalPages) pages.push(totalPages);

  return (
    <nav className={cn('flex items-center justify-between gap-3', className)} aria-label="Pagination">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page === 1}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent',
            page === 1 && 'pointer-events-none opacity-40',
          )}
        >
          <ChevronLeft className="size-4" />
        </Link>
        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={buildHref(item)}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-md border text-xs font-medium transition-colors',
                item === page ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {item}
            </Link>
          ),
        )}
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page === totalPages}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent',
            page === totalPages && 'pointer-events-none opacity-40',
          )}
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </nav>
  );
}
