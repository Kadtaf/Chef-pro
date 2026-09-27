import type { SupabaseClient } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/shared/types/database';
import { supabase } from './supabase';

type TableName = keyof Database['public']['Tables'];

/** Re-types rows coming from the untyped client (see note in createCrud). */
const rows = <R>(value: unknown): R => value as R;

type CrudOptions<T extends TableName> = {
  /** Default ordering of list queries. */
  orderBy: { column: keyof Tables<T> & string; ascending?: boolean }[];
  /** Singular label used in success toasts ("Projet enregistré"). */
  label: string;
  /** Other query keys to refresh after a write (e.g. dashboard counters). */
  alsoInvalidate?: readonly (readonly unknown[])[];
};

/**
 * Typed React Query hooks for a single-table resource (list / get / save /
 * patch / remove). Multi-table aggregates use dedicated RPCs instead.
 */
export function createCrud<T extends TableName>(table: T, options: CrudOptions<T>) {
  // The generic `from(table)` overloads cannot be resolved for a type parameter;
  // rows are re-typed at the boundary below.
  const db = supabase as unknown as SupabaseClient;
  type Row = Tables<T>;

  const keys = {
    all: [table] as const,
    list: [table, 'list'] as const,
    detail: (id: string) => [table, 'detail', id] as const,
  };

  function useInvalidate() {
    const queryClient = useQueryClient();
    return () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.all }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        ...(options.alsoInvalidate ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
  }

  return {
    keys,

    useList() {
      return useQuery({
        queryKey: keys.list,
        queryFn: async () => {
          let query = db.from(table).select('*');
          for (const { column, ascending = true } of options.orderBy) query = query.order(column, { ascending });
          const { data, error } = await query;
          if (error) throw error;
          return rows<Row[]>(data);
        },
      });
    },

    useOne(id: string | undefined) {
      return useQuery({
        queryKey: keys.detail(id ?? ''),
        enabled: !!id,
        queryFn: async () => {
          const { data, error } = await db.from(table).select('*').eq('id', id).single();
          if (error) throw error;
          return rows<Row>(data);
        },
      });
    },

    /** Inserts when `id` is absent, updates otherwise. Resolves to the saved row. */
    useSave() {
      const invalidate = useInvalidate();
      return useMutation({
        meta: { successMessage: `${options.label} enregistré(e)` },
        mutationFn: async ({ id, ...values }: TablesInsert<T> & { id?: string }) => {
          const query = id
            ? db.from(table).update(values).eq('id', id).select().single()
            : db.from(table).insert(values).select().single();
          const { data, error } = await query;
          if (error) throw error;
          return rows<Row>(data);
        },
        onSuccess: invalidate,
      });
    },

    /** Partial update without toast (toggles, inline edits). */
    usePatch() {
      const invalidate = useInvalidate();
      return useMutation({
        mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<T> }) => {
          const { error } = await db.from(table).update(values).eq('id', id);
          if (error) throw error;
        },
        onSuccess: invalidate,
      });
    },

    useRemove() {
      const invalidate = useInvalidate();
      return useMutation({
        meta: { successMessage: `${options.label} supprimé(e)` },
        mutationFn: async (id: string) => {
          const { error } = await db.from(table).delete().eq('id', id);
          if (error) throw error;
        },
        onSuccess: invalidate,
      });
    },
  };
}
