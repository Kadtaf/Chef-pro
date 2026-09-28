import { aiArticleSchema } from '@ai-contract';
import { describe, expect, it } from 'vitest';

const paragraph = 'Le beurre blanc est une émulsion instable qui demande une température maîtrisée. '.repeat(3);
const base = { title: 'Réussir un beurre blanc', excerpt: 'Une émulsion reine.', tags: ['sauce'] };

describe('aiArticleSchema body', () => {
  it('accepts the rich-text string as is', () => {
    const parsed = aiArticleSchema.parse({ ...base, body: `## Principe\n\n${paragraph}` });
    expect(parsed.body.startsWith('## Principe')).toBe(true);
  });

  it('joins a list of paragraphs', () => {
    const parsed = aiArticleSchema.parse({ ...base, body: [paragraph, paragraph] });
    expect(parsed.body).toBe(`${paragraph}\n\n${paragraph}`.trim());
  });

  it('turns sections into headings and paragraphs', () => {
    const parsed = aiArticleSchema.parse({
      ...base,
      body: [
        { heading: 'Principe', content: paragraph },
        { title: 'Étapes', items: ['1. Réduire.', '2. Monter au beurre.'] },
      ],
    });
    expect(parsed.body).toContain('## Principe');
    expect(parsed.body).toContain('## Étapes\n\n1. Réduire.\n\n2. Monter au beurre.');
  });

  it('still rejects an article that is too short', () => {
    expect(aiArticleSchema.safeParse({ ...base, body: 'Trop court.' }).success).toBe(false);
  });
});
