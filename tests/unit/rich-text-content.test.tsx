import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichTextContent } from '@/components/shared/rich-text-content';

describe('RichTextContent', () => {
  it('renders plain text with preserved whitespace', () => {
    render(<RichTextContent value={'Line one\nLine two'} />);
    expect(screen.getByText(/Line one/)).toHaveClass('whitespace-pre-wrap');
  });

  it('renders sanitized rich text', () => {
    const { container } = render(
      <RichTextContent value={'<h2>Heading</h2><p>Body</p><script>alert(1)</script>'} />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('renders nothing for empty content', () => {
    const { container } = render(<RichTextContent value={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
