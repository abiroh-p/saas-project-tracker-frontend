import { formatDateRange } from './date-range';

describe('formatDateRange', () => {
  it('formats a full range', () => {
    expect(formatDateRange('2026-10-01', '2026-12-31')).toBe('Oct 1, 2026 – Dec 31, 2026');
  });

  it('formats open-ended ranges', () => {
    expect(formatDateRange('2026-10-01', null)).toBe('Starts Oct 1, 2026');
    expect(formatDateRange(null, '2026-12-31')).toBe('Ends Dec 31, 2026');
  });

  it('says so when there are no dates', () => {
    expect(formatDateRange(null, null)).toBe('No dates set');
  });

  it('does not shift the day in any time zone', () => {
    // A date-only value must display as the same calendar day, never the previous one.
    expect(formatDateRange('2026-01-01', '2026-01-01')).toBe('Jan 1, 2026 – Jan 1, 2026');
  });
});
