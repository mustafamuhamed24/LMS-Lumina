import { describe, expect, it } from 'vitest';
import { sanitizeRichText } from '@/lib/sanitize';
import { editorContent, escapeHtml, isRichText, plainTextToHtml } from '@/lib/rich-text';

describe('isRichText', () => {
  it('detects supported HTML blocks', () => {
    expect(isRichText('<p>Hello</p>')).toBe(true);
    expect(isRichText('<h2>Title</h2><ul><li>One</li></ul>')).toBe(true);
    expect(isRichText('Plain < text')).toBe(false);
    expect(isRichText('')).toBe(false);
    expect(isRichText(null)).toBe(false);
  });
});

describe('plainTextToHtml', () => {
  it('escapes HTML and preserves line breaks', () => {
    expect(plainTextToHtml('One\nTwo')).toBe('<p>One<br>Two</p>');
    expect(plainTextToHtml('a & b <script>')).toBe('<p>a &amp; b &lt;script&gt;</p>');
  });

  it('splits paragraphs on blank lines', () => {
    expect(plainTextToHtml('First\n\nSecond')).toBe('<p>First</p><p>Second</p>');
  });
});

describe('editorContent', () => {
  it('passes HTML through and converts plain text', () => {
    expect(editorContent('<p>Hi</p>')).toBe('<p>Hi</p>');
    expect(editorContent('Hi\nthere')).toBe('<p>Hi<br>there</p>');
    expect(editorContent(null)).toBe('');
  });

  it('escapes html entities', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});

describe('sanitizeRichText', () => {
  it('keeps allowed formatting', () => {
    const html = '<h2>Title</h2><p><strong>Bold</strong> and <em>italic</em></p><ul><li>One</li></ul>';
    expect(sanitizeRichText(html)).toBe(html);
  });

  it('removes scripts, styles, event handlers and javascript URLs', () => {
    const clean = sanitizeRichText(
      '<p onclick="steal()">Safe</p><script>alert(1)</script><a href="javascript:alert(1)">link</a><img src=x onerror=alert(1)>',
    );
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('Safe');
  });

  it('adds safe rel and target attributes to links', () => {
    const clean = sanitizeRichText('<p><a href="https://example.com">Example</a></p>');
    expect(clean).toContain('rel="noopener noreferrer nofollow"');
    expect(clean).toContain('target="_blank"');
  });

  it('leaves plain text untouched and returns null for empty input', () => {
    expect(sanitizeRichText('  Plain < notes  ')).toBe('Plain < notes');
    expect(sanitizeRichText('')).toBeNull();
    expect(sanitizeRichText(null)).toBeNull();
  });
});
