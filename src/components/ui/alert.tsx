import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('relative flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground',
      destructive: 'border-destructive/30 bg-destructive/5 text-destructive',
      success: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
      warning: 'border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300',
      info: 'border-sky-500/25 bg-sky-500/5 text-sky-700 dark:text-sky-300',
    },
  },
  defaultVariants: { variant: 'default' },
});

function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('font-medium', className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('text-sm leading-relaxed', className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
