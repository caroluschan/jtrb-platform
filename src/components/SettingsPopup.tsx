import { useCallback, useEffect, useState } from 'preact/hooks';
import type { ArrangementMode, Settings } from '../types';

interface SettingsPopupProps {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  settings: Settings;
  setFontSize: (size: number) => void;
  setArrangement: (mode: ArrangementMode) => void;
}

export function SettingsPopup({ theme, setTheme, settings, setFontSize, setArrangement }: SettingsPopupProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Close on backdrop click (e.target === e.currentTarget)
  const handleBackdropClick = useCallback((e: MouseEvent) => {
    if (e.target === e.currentTarget) setOpen(false);
  }, []);

  const handleBackdropKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(false);
    }
  }, []);

  return (
    <>
      <button type="button" class="settings-toggle" aria-label="Settings" onClick={handleOpen}>
        ⚙️
      </button>
      {open && (
        <button
          type="button"
          class="settings-overlay"
          onClick={handleBackdropClick}
          onKeyDown={handleBackdropKeyDown}
          aria-label="Close settings"
        >
          <div class="settings-popup">
            {/* Theme */}
            <div class="settings-group">
              <span class="settings-group-label">Theme</span>
              <div class="settings-btn-group">
                <button
                  type="button"
                  class={`settings-btn${theme === 'light' ? ' settings-btn-active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  ☀️ Light
                </button>
                <button
                  type="button"
                  class={`settings-btn${theme === 'dark' ? ' settings-btn-active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  🌙 Dark
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div class="settings-group">
              <span class="settings-group-label">Font Size</span>
              <div class="settings-range">
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="2"
                  value={settings.fontSize}
                  onInput={(e) => setFontSize(Number((e.target as HTMLInputElement).value))}
                />
                <span class="settings-range-value">{settings.fontSize}px</span>
              </div>
            </div>

            {/* Arrangement */}
            <div class="settings-group">
              <span class="settings-group-label">Arrangement</span>
              <select
                class="settings-select"
                value={settings.arrangement}
                onChange={(e) => setArrangement((e.target as HTMLSelectElement).value as ArrangementMode)}
              >
                <option value="default">Default</option>
                <option value="aligned">Aligned</option>
              </select>
            </div>
          </div>
        </button>
      )}
    </>
  );
}
