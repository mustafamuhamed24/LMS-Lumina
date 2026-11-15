import sanitizeHtml from 'sanitize-html';
import { isRichText } from '@/lib/rich-text';

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'h1',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'strong',
    'b',
    'em',
    'i',
    's',
    'strike',
    'a',
    'hr',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
  },
};

/**
 * Sanitizes stored rich-text HTML. Plain text is returned untouched so legacy
 * lesson notes keep their formatting. Call this on write and again on render.
 */
export function sanitizeRichText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isRichText(trimmed)) return trimmed;
  const clean = sanitizeHtml(trimmed, RICH_TEXT_OPTIONS).trim();
  return clean.length ? clean : null;
}
