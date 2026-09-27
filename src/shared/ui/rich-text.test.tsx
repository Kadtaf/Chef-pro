import { render, screen } from '@testing-library/react';
import { parseRichText } from '@/shared/lib/rich-text';
import { RichText } from './rich-text';

describe('parseRichText', () => {
  it('parses headings, paragraphs and lists', () => {
    expect(parseRichText('Intro\nsuite\n\n## Titre\n- a\n- b\n1. un\n2. deux')).toEqual([
      { type: 'p', text: 'Intro suite' },
      { type: 'h2', text: 'Titre' },
      { type: 'ul', items: ['a', 'b'] },
      { type: 'ol', items: ['un', 'deux'] },
    ]);
  });
});

describe('RichText', () => {
  it('never injects HTML', () => {
    const { container } = render(<RichText source={'<img src=x onerror=alert(1)> **gras**'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('gras').tagName).toBe('STRONG');
  });
});
