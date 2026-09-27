import { emptyMission, missionDays, missionFormSchema, toMissionRow } from './schema';

describe('missionDays', () => {
  it('counts inclusive calendar days', () => {
    expect(missionDays('2026-03-02', '2026-03-08')).toBe(7);
  });
  it('can exclude weekends', () => {
    expect(missionDays('2026-03-02', '2026-03-08', { weekdaysOnly: true })).toBe(5);
  });
  it('returns 0 for invalid ranges', () => {
    expect(missionDays('2026-03-08', '2026-03-02')).toBe(0);
    expect(missionDays('', '2026-03-02')).toBe(0);
  });
});

describe('mission form', () => {
  it('rejects an end date before the start date', () => {
    const result = missionFormSchema.safeParse({
      ...emptyMission(),
      title: 'Remplacement',
      client_name: 'Bistrot',
      start_date: '2026-03-10',
      end_date: '2026-03-01',
    });
    expect(result.success).toBe(false);
  });

  it('turns empty optional fields into nulls', () => {
    expect(toMissionRow({ ...emptyMission(), title: 'x', client_name: 'y' })).toMatchObject({
      client_email: null,
      start_date: null,
      notes: null,
    });
  });
});
