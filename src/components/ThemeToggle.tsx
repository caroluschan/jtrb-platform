import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      class="theme-toggle"
      aria-label={isLight ? 'Toggle dark mode' : 'Toggle light mode'}
      onClick={toggle}
    >
      {isLight ? '🌙' : '☀️'}
    </button>
  );
}
