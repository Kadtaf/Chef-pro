import {
  Beef,
  CakeSlice,
  Carrot,
  Coffee,
  Croissant,
  Fish,
  Flower2,
  Leaf,
  Salad,
  Sandwich,
  Snowflake,
  Sun,
  UtensilsCrossed,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
import type { SVGProps } from 'react';

/**
 * House icon set — fine 1.5 px strokes to match the premium typography.
 * Recipe types without a bespoke drawing reuse lucide icons (same grid).
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** Brand mark: chef's toque. */
export function ToqueIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 14.5a4 4 0 0 1-.6-7.9 4.8 4.8 0 0 1 9.2-1.3 4 4 0 0 1 2.4 9.2" />
      <path d="M7 12.5V19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-6.5" />
      <path d="M7 16.5h10" />
      <path d="M10 13v3.5M14 13v3.5" />
    </Svg>
  );
}

/** Serving cloche — used for starters / "entrée". */
export function ClocheIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 17.5h18" />
      <path d="M4.5 17.5a7.5 7.5 0 0 1 15 0" />
      <path d="M12 10V8M10.5 8h3" />
      <path d="M2.5 20.5h19" />
    </Svg>
  );
}

export function WhiskIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 22v-6" />
      <path d="M12 16c-2.8 0-4.5-3.6-4.5-8a4.5 4.5 0 0 1 9 0c0 4.4-1.7 8-4.5 8Z" />
      <path d="M12 16c-1 0-1.6-3.6-1.6-8S11 3.5 12 3.5s1.6 0 1.6 4.5-.6 8-1.6 8Z" />
    </Svg>
  );
}

export function WineGlassIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.5 3h9l-.4 5.2a4.1 4.1 0 0 1-8.2 0L7.5 3Z" />
      <path d="M8 6.5h8" />
      <path d="M12 12.3V20M8.5 20.5h7" />
    </Svg>
  );
}

/** Tasting spoon with a bite — "amuse-bouche". */
export function AmuseBoucheIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 20.5 10 14" />
      <ellipse cx="15" cy="9" rx="6" ry="3.8" transform="rotate(-45 15 9)" />
      <circle cx="15.2" cy="8.8" r="1.6" />
    </Svg>
  );
}

/** Steaming bowl — soups, potages, veloutés. */
export function BowlIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 11.5h18a9 9 0 0 1-18 0Z" />
      <path d="M8.5 21h7" />
      <path d="M9 8c0-1 1-1.3 1-2.3S9 4.4 9 3.5M13 8c0-1 1-1.3 1-2.3s-1-1.3-1-2.2" />
    </Svg>
  );
}

type AnyIcon = LucideIcon | ((props: IconProps) => React.JSX.Element);

const TYPE_ICONS: Record<string, AnyIcon> = {
  entree: ClocheIcon,
  plat: UtensilsCrossed,
  salade: Salad,
  'amuse-bouche': AmuseBoucheIcon,
  veloute: BowlIcon,
  potage: BowlIcon,
  soupe: BowlIcon,
  viande: Beef,
  poisson: Fish,
  vegetarien: Carrot,
  dessert: CakeSlice,
  patisserie: Croissant,
  brunch: Coffee,
  'street-food': Sandwich,
};

/** Icon of a recipe type (taxonomy `icon` or slug), with a sensible fallback. */
export function RecipeTypeIcon({ icon, className }: { icon: string | null | undefined; className?: string }) {
  const Icon = (icon && TYPE_ICONS[icon]) || UtensilsCrossed;
  return <Icon className={className} aria-hidden />;
}

const SEASON_ICONS: Record<string, LucideIcon> = {
  printemps: Flower2,
  ete: Sun,
  automne: Leaf,
  hiver: Snowflake,
};

export function SeasonIcon({ season, ...props }: LucideProps & { season: string | null | undefined }) {
  const Icon = (season && SEASON_ICONS[season]) || Leaf;
  return <Icon aria-hidden {...props} />;
}
