import { emptyHaccp, parseChecklist, temperatureCompliance, toHaccpRow } from './schema';

describe('temperatureCompliance', () => {
  it.each([
    [3, 0, 4, 'ok'],
    [6, 0, 4, 'ko'],
    [-20, null, -18, 'ok'],
    [-15, null, -18, 'ko'],
    [65, 63, null, 'ok'],
    [60, 63, null, 'ko'],
    [5, null, null, 'unknown'],
  ] as const)('%s °C in [%s, %s] -> %s', (temperature, temperature_min, temperature_max, expected) => {
    expect(temperatureCompliance({ temperature, temperature_min, temperature_max })).toBe(expected);
  });
});

describe('toHaccpRow', () => {
  it('flags an out-of-range reading as non-compliant', () => {
    const row = toHaccpRow({
      ...emptyHaccp('temperature'),
      title: 'Chambre froide',
      temperature: 7,
      temperature_min: 0,
      temperature_max: 4,
      status: 'completed',
    });
    expect(row.status).toBe('failed');
    expect(row.completed_at).not.toBeNull();
  });

  it('drops temperature fields for other record types', () => {
    const row = toHaccpRow({ ...emptyHaccp('cleaning'), title: 'Plonge', temperature: 5 });
    expect(row.temperature).toBeNull();
    expect(row.completed_at).toBeNull();
  });
});

describe('parseChecklist', () => {
  it('normalises legacy and AI shaped items and ignores garbage', () => {
    expect(
      parseChecklist([
        { item: 'Laver les mains', completed: true },
        { check: 'Relever la chambre froide', critical: true },
        'invalid',
        { item: '' },
      ]),
    ).toEqual([
      { item: 'Laver les mains', category: '', frequency: '', critical: false, corrective_action: '', completed: true },
      {
        item: 'Relever la chambre froide',
        category: '',
        frequency: '',
        critical: true,
        corrective_action: '',
        completed: false,
      },
    ]);
  });
});
