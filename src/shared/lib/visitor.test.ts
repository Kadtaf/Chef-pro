import { getFavorites, rememberRating, getRatings, toggleFavorite, visitorId } from './visitor';

describe('visitor state', () => {
  beforeEach(() => localStorage.clear());

  it('keeps a stable anonymous id', () => {
    const id = visitorId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(visitorId()).toBe(id);
  });

  it('toggles favourites, most recent first', () => {
    expect(toggleFavorite('a')).toBe(true);
    expect(toggleFavorite('b')).toBe(true);
    expect(getFavorites()).toEqual(['b', 'a']);
    expect(toggleFavorite('a')).toBe(false);
    expect(getFavorites()).toEqual(['b']);
    expect(JSON.parse(localStorage.getItem('cp:favorites') ?? '[]')).toEqual(['b']);
  });

  it('remembers ratings', () => {
    rememberRating('r1', 4);
    expect(getRatings()).toMatchObject({ r1: 4 });
  });
});
