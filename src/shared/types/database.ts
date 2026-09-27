/**
 * Database types = generated types (`database.generated.ts`, refreshed with
 * `npm run db:types`) + precise unions for columns guarded by CHECK
 * constraints, which the Supabase generator reports as plain `string`.
 * Application code imports from this file only.
 */
import type { MergeDeep } from 'type-fest';
import type {
  CARD_CATEGORY_VALUES,
  MENU_CATEGORY_VALUES,
  MENU_ITEM_TYPE_VALUES,
} from '../../../supabase/functions/_shared/vocabulary.ts';
import type { Database as GeneratedDatabase } from './database.generated';

export type { Json } from './database.generated';

type Values<T extends readonly string[]> = T[number];

type HaccpType = 'cleaning' | 'temperature' | 'delivery' | 'traceability' | 'checklist';
type HaccpStatus = 'pending' | 'completed' | 'failed';
type MissionStatus = 'en_attente' | 'en_cours' | 'terminee' | 'annulee';
type MissionType = 'chef' | 'second' | 'consulting' | 'formation' | 'evenementiel';
type ProfileRole = 'admin' | 'editor' | 'viewer';
type CommentSource = 'site' | 'google' | 'facebook' | 'internal';
type NotificationType = 'info' | 'success' | 'warning' | 'error';
type GenerationStatus = 'success' | 'error';

/** Applies the same column overrides to Row, Insert and Update. */
type Columns<Row, Insert = Partial<Row>> = { Row: Row; Insert: Insert; Update: Partial<Row> };

type Overrides = {
  public: {
    Tables: {
      profiles: Columns<{ role: ProfileRole }>;
      haccp_records: Columns<{ type: HaccpType; status: HaccpStatus }>;
      missions: Columns<{ status: MissionStatus; type: MissionType | null }>;
      menus: Columns<{ category: Values<typeof MENU_CATEGORY_VALUES> | null }>;
      menu_items: Columns<{ item_type: Values<typeof MENU_ITEM_TYPE_VALUES> | null }>;
      cards: Columns<{ category: Values<typeof CARD_CATEGORY_VALUES> | null }>;
      comments: Columns<{ source: CommentSource | null }>;
      notifications: Columns<{ type: NotificationType | null }>;
      ai_generations: Columns<{ status: GenerationStatus }>;
    };
  };
};

export type Database = MergeDeep<GeneratedDatabase, Overrides>;

type PublicTables = Database['public']['Tables'];

export type Tables<T extends keyof PublicTables> = PublicTables[T]['Row'];
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]['Insert'];
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]['Update'];
