import { describe, expect, it } from 'vitest';
import { parseModelJson } from '../functions/_shared/json-repair.ts';

describe('parseModelJson', () => {
  it('parses clean JSON', () => {
    expect(parseModelJson('{"title":"Beurre blanc"}')).toEqual({ title: 'Beurre blanc' });
  });

  it('removes markdown fences and surrounding sentences', () => {
    expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseModelJson('Voici l’article :\n{"a":1}\nBonne lecture !')).toEqual({ a: 1 });
  });

  it('repairs raw line breaks inside strings (multi-paragraph bodies)', () => {
    const raw = '{"title":"Beurre blanc","body":"## Principe\n\nUne émulsion.\n- Réduire\n- Monter"}';
    expect(parseModelJson(raw)).toEqual({
      title: 'Beurre blanc',
      body: '## Principe\n\nUne émulsion.\n- Réduire\n- Monter',
    });
  });

  it('keeps already escaped sequences and quotes intact', () => {
    expect(parseModelJson('{"body":"Ligne 1\\nLigne \\"2\\""}')).toEqual({ body: 'Ligne 1\nLigne "2"' });
  });

  it('removes trailing commas', () => {
    expect(parseModelJson('{"tags":["sauce","émulsion",],}')).toEqual({ tags: ['sauce', 'émulsion'] });
  });

  it('still fails on a truncated answer', () => {
    expect(() => parseModelJson('{"title":"Beurre blanc","body":"Une émul')).toThrow();
  });
});
