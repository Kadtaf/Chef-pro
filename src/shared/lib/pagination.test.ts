import { describe, expect, it } from 'vitest';
import { pageItems } from './pagination';

describe('pageItems', () => {
  it('lists every page when there are few', () => {
    expect(pageItems(0, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it('collapses distant pages into ellipses around the current one', () => {
    expect(pageItems(5, 12)).toEqual([0, null, 4, 5, 6, null, 11]);
  });

  it('never shows an ellipsis next to the first or last page', () => {
    expect(pageItems(0, 12)).toEqual([0, 1, null, 11]);
    expect(pageItems(1, 12)).toEqual([0, 1, 2, null, 11]);
    expect(pageItems(11, 12)).toEqual([0, null, 10, 11]);
  });
});
