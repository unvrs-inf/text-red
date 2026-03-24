"use client";

import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '@/lib/types';
import { SETTINGS_STORAGE_KEY, DEFAULT_MODEL, DEFAULT_SCOPE } from '@/lib/constants';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // SSR-safe: читаем из localStorage только на клиенте
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored) as AppSettings); // eslint-disable-line react-hooks/set-state-in-effect
      }
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true);  
  }, []);

  const saveSettings = useCallback((newSettings: AppSettings) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
  }, []);

  const clearSettings = useCallback(() => {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    setSettings(null);
  }, []);

  const getCredentialsBase64 = useCallback((): string => {
    if (!settings) return '';
    return btoa(`${settings.gigachatClientId}:${settings.gigachatClientSecret}`);
  }, [settings]);

  const getDefaultSettings = (): AppSettings => ({
    gigachatClientId: '',
    gigachatClientSecret: '',
    gigachatScope: DEFAULT_SCOPE as AppSettings['gigachatScope'],
    gigachatModel: DEFAULT_MODEL as AppSettings['gigachatModel'],
    theme: 'system',
  });

  return { settings, isLoaded, saveSettings, clearSettings, getCredentialsBase64, getDefaultSettings };
}
