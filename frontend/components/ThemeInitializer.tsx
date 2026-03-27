'use client';

import { useEffect } from 'react';
import { applyTheme, getThemeMode } from '@/lib/theme';

export default function ThemeInitializer() {
  useEffect(() => {
    const mode = getThemeMode();
    applyTheme(mode);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getThemeMode() === 'system') {
        applyTheme('system');
      }
    };

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return null;
}
