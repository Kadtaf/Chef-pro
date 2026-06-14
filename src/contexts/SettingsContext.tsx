import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Tables } from '../lib/supabase';

interface SettingsContextType {
  settings: Tables<'settings'> | null;
  loading: boolean;
  updateSettings: (updates: Partial<Tables<'settings'>>) => Promise<{ error: Error | null }>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Tables<'settings'> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (!error && data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (updates: Partial<Tables<'settings'>>) => {
    if (!settings) return { error: new Error('Settings not loaded') };

    const { error } = await supabase
      .from('settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', settings.id);

    if (!error) {
      setSettings(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error: error as Error | null };
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
