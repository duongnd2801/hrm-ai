'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { getThemeMode, setThemeMode, ThemeMode } from '@/lib/theme';

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode(getThemeMode());
  }, []);

  if (!mounted) return <div className="w-10 h-10" />;

  const cycle = () => {
    let next: ThemeMode = 'light';
    if (mode === 'light') next = 'dark';
    else if (mode === 'dark') next = 'system';
    else if (mode === 'system') next = 'light';
    
    setMode(next);
    setThemeMode(next);
  };

  return (
    <button
      onClick={cycle}
      className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-white/50 hover:text-white flex items-center justify-center relative group"
      title={`Giao diện: ${mode === 'light' ? 'Sáng' : mode === 'dark' ? 'Tối' : 'Hệ thống'}`}
    >
      {mode === 'light' && <Sun size={20} className="animate-in zoom-in duration-300" />}
      {mode === 'dark' && <Moon size={20} className="animate-in zoom-in duration-300" />}
      {mode === 'system' && <Monitor size={20} className="animate-in zoom-in duration-300" />}
      
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-white/10 rounded text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
        {mode === 'light' ? 'Sáng' : mode === 'dark' ? 'Tối' : 'Hệ thống'}
      </span>
    </button>
  );
}
