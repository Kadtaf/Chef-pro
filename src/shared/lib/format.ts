const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

export const formatCurrency = (amount: number | null | undefined) => currency.format(Number(amount ?? 0));
export const formatNumber = (value: number | null | undefined) => number.format(Number(value ?? 0));

const toDate = (value: string | Date) => (typeof value === 'string' ? new Date(value) : value);
export const formatDate = (value: string | Date) => longDate.format(toDate(value));
export const formatShortDate = (value: string | Date) => shortDate.format(toDate(value));
export const formatDateTime = (value: string | Date) => dateTime.format(toDate(value));
/** "2026-03" -> "mars" */
export const formatMonth = (yearMonth: string) => monthLabel.format(new Date(`${yearMonth}-01T00:00:00`));

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\u0153/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
