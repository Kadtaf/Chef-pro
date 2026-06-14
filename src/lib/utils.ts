export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(d);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function calculateNutriScore(
  calories: number,
  lipides: number,
  glucides: number,
  proteines: number,
  fibres: number,
  sel: number
): 'A' | 'B' | 'C' | 'D' | 'E' {
  let score = 0;

  // Negative nutrients
  score += Math.min(lipides / 100, 10);
  score += Math.min(glucides / 100, 10);
  score += Math.min(sel / 5, 10);

  // Positive nutrients
  score -= Math.min(fibres / 10, 5);
  score -= Math.min(proteines / 50, 5);

  if (score <= -2) return 'A';
  if (score <= 1) return 'B';
  if (score <= 4) return 'C';
  if (score <= 7) return 'D';
  return 'E';
}

export function getNutriScoreClass(score: string | null): string {
  switch (score) {
    case 'A': return 'nutri-score-a';
    case 'B': return 'nutri-score-b';
    case 'C': return 'nutri-score-c';
    case 'D': return 'nutri-score-d';
    case 'E': return 'nutri-score-e';
    default: return 'bg-neutral-300 text-neutral-700';
  }
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function parseFeatures(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features.map(String);
  }
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function downloadFile(content: string, filename: string, type = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getSeasonFromDate(date?: Date): 'printemps' | 'ete' | 'automne' | 'hiver' {
  const d = date || new Date();
  const month = d.getMonth();
  if (month >= 2 && month <= 4) return 'printemps';
  if (month >= 5 && month <= 7) return 'ete';
  if (month >= 8 && month <= 10) return 'automne';
  return 'hiver';
}

export const ALLERGENS = [
  'Gluten',
  'Crustacés',
  'Oeufs',
  'Poisson',
  'Arachides',
  'Soja',
  'Lait',
  'Fruits à coque',
  'Céleri',
  'Moutarde',
  'Sésame',
  'Sulfites',
  'Lupin',
  'Mollusques'
];

export const DIFFICULTY_LEVELS = ['facile', 'moyen', 'difficile'] as const;

export const SEASONS = ['printemps', 'ete', 'automne', 'hiver', 'all'] as const;

export const RECIPE_CATEGORIES = [
  'Entrée',
  'Plat principal',
  'Dessert',
  'Accompagnement',
  'Boisson',
  'Apéritif',
  'Autre'
] as const;

export const MISSION_TYPES = ['chef', 'second', 'consulting', 'formation', 'evenementiel'] as const;

export const MISSION_STATUSES = ['en_attente', 'en_cours', 'terminee', 'annulee'] as const;

export const HACCP_TYPES = ['cleaning', 'temperature', 'delivery', 'traceability', 'checklist'] as const;

export const HACCP_STATUSES = ['pending', 'completed', 'failed'] as const;
