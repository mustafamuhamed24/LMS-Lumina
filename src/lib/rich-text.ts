/**
 * Small, dependency-free helpers for deciding how lesson content should be
 * interpreted. Rich text is stored as sanitized HTML; legacy lessons contain
 * plain text and keep their line breaks.
 */

const RICH_TEXT_TAG = /<(?:p|h[1-6]|ul|ol|li|blockquote|pre|code|strong|b|em|i|s|strike|a|br|hr)\b[^>]*>/i;

export function isRichText(value: string | null | undefined): value is string {
  return Boolean(value && RICH_TEXT_TAG.test(value));
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Converts legacy plain text into paragraphs so the editor can open it. */
export function plainTextToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function editorContent(value: string | null | undefined) {
  if (!value) return '';
  return isRichText(value) ? value : plainTextToHtml(value);
}
