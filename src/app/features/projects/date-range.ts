import { formatDate } from '@angular/common';

const LOCALE = 'en-US';

/** "Oct 1, 2026 – Dec 31, 2026", "Starts Oct 1, 2026", "Ends Dec 31, 2026" or "No dates set". */
export function formatDateRange(start: string | null, end: string | null): string {
  const fmt = (value: string) => formatDate(value, 'mediumDate', LOCALE);

  if (start && end) {
    return `${fmt(start)} – ${fmt(end)}`;
  }
  if (start) {
    return `Starts ${fmt(start)}`;
  }
  if (end) {
    return `Ends ${fmt(end)}`;
  }
  return 'No dates set';
}
