import { useEffect, useCallback } from 'preact/hooks';
import { useLocalStorage } from './useLocalStorage';
import type { Settings, ArrangementMode } from '../types';

const DEFAULT_SETTINGS: Settings = {
  fontSize: 16,
  arrangement: 'aligned',
};

const STORAGE_KEY = 'jvc-settings';

interface UseSettingsReturn {
  settings: Settings;
  setFontSize: (size: number) => void;
  setArrangement: (mode: ArrangementMode) => void;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useLocalStorage<Settings>(STORAGE_KEY, DEFAULT_SETTINGS);

  useEffect(() => {
    if (settings.arrangement === 'default' as ArrangementMode) {
      setSettings(prev => ({ ...prev, arrangement: 'natural' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
  }, [settings.fontSize]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-arrangement', settings.arrangement);
  }, [settings.arrangement]);

  const setFontSize = useCallback((size: number) => {
    setSettings(prev => ({ ...prev, fontSize: size }));
  }, [setSettings]);

  const setArrangement = useCallback((mode: ArrangementMode) => {
    setSettings(prev => ({ ...prev, arrangement: mode }));
  }, [setSettings]);

  return { settings, setFontSize, setArrangement };
}
