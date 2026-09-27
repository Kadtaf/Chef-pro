import { Award, ChefHat, Heart, Users, Utensils, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  chef: ChefHat,
  second: Utensils,
  consulting: Award,
  formation: Users,
  evenementiel: Heart,
};

export function ServiceIcon({ category, className }: { category: string; className?: string }) {
  const Icon = ICONS[category] ?? ChefHat;
  return <Icon className={className} aria-hidden />;
}
