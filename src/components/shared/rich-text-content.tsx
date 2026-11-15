import { cn } from '@/lib/utils';
import { isRichText } from '@/lib/rich-text';
import { sanitizeRichText } from '@/lib/sanitize';

/**
 * Renders lesson rich text. HTML is sanitized again at render time as
 * defence-in-depth; legacy plain-text lessons keep whitespace formatting.
 */
export function RichTextContent({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  if (!value) return null;

  if (!isRichText(value)) {
    return <div className={cn('whitespace-pre-wrap text-sm leading-7 text-foreground/90', className)}>{value}</div>;
  }

  const html = sanitizeRichText(value);
  if (!html) return null;

  return (
    <div
      className={cn('prose-lesson text-sm leading-7 text-foreground/90', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
