export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'hrm_theme_mode';

export function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const raw = localStorage.getItem(THEME_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export function setThemeMode(mode: ThemeMode) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, mode);
  applyTheme(mode);
}

export function applyTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark');

  const resolved =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;

  root.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light');
  root.style.colorScheme = resolved;
}
