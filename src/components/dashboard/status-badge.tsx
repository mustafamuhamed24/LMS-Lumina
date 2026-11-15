import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const MAP: Record<string, { label: string; variant: React.ComponentProps<typeof Badge>['variant'] }> = {
  active: { label: 'Active', variant: 'success' },
  published: { label: 'Published', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  graded: { label: 'Graded', variant: 'success' },
  passed: { label: 'Passed', variant: 'success' },
  approved: { label: 'Approved', variant: 'success' },
  draft: { label: 'Draft', variant: 'muted' },
  pending: { label: 'Pending', variant: 'warning' },
  submitted: { label: 'Submitted', variant: 'info' },
  returned: { label: 'Returned', variant: 'warning' },
  in_progress: { label: 'In progress', variant: 'info' },
  suspended: { label: 'Suspended', variant: 'danger' },
  rejected: { label: 'Rejected', variant: 'danger' },
  failed: { label: 'Failed', variant: 'danger' },
  archived: { label: 'Archived', variant: 'muted' },
  cancelled: { label: 'Cancelled', variant: 'muted' },
  upcoming: { label: 'Upcoming', variant: 'info' },
  overdue: { label: 'Overdue', variant: 'danger' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = MAP[status] ?? { label: status.replace(/_/g, ' '), variant: 'outline' as const };
  return (
    <Badge variant={config.variant} className={cn('capitalize', className)}>
      {config.label}
    </Badge>
  );
}
