'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { clearSession, hasRole } from '@/lib/auth';
import type { UserSession } from '@/types';
import { NAV_ITEMS } from './Sidebar';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  session: UserSession;
  collapsed: boolean;
  onToggleSidebar: () => void;
  pathname: string;
}

export default function Header({ session, collapsed, onToggleSidebar, pathname }: HeaderProps) {
  const router = useRouter();
  const [clock, setClock] = useState(new Date());
  const [temp, setTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await axios.get(
          'https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current=temperature_2m,weather_code'
        );
        const current = res.data?.current;
        if (current) {
          setTemp(Math.round(current.temperature_2m));
          setWeatherCode(current.weather_code ?? 0);
        }
      } catch {
        // silently fail
      }
    }
    void fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const timeText = clock.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit' });

  // Weather icon based on WMO code
  const isSunny = weatherCode <= 1;
  const isCloudy = weatherCode >= 2 && weatherCode <= 3;
  const isRainy = weatherCode >= 51;

  const pillItems = NAV_ITEMS.filter((item) => {
     const isAllowed = hasRole(...item.roles);
     const isPill = ['/dashboard', '/employees', '/attendance', '/payroll'].includes(item.href);
     return isAllowed && isPill;
  });

  function handleLogout() {
    clearSession();
    document.cookie = 'hrm_token=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <header className="h-24 shrink-0 px-8 flex items-center justify-between relative z-20">
      <div className="flex items-center gap-4 flex-1">
         <button 
           onClick={onToggleSidebar}
           className="w-12 h-12 flex items-center justify-center bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 rounded-2xl border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl transition-all active:scale-95 group mr-2"
         >
           {collapsed ? (
             <svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
           ) : (
             <svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
           )}
         </button>

         <div className="flex items-center bg-white/80 dark:bg-white/10 backdrop-blur-3xl rounded-[24px] p-1.5 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
            {pillItems.map((item) => {
               const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
               return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex items-center gap-2.5 px-6 py-3 rounded-[18px] text-[13px] font-black tracking-widest uppercase transition-all duration-500 ${
                       active 
                         ? 'bg-indigo-600 text-white shadow-2xl scale-105' 
                         : 'text-slate-900 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                     {item.label}
                  </Link>
               )
            })}
         </div>

          <div className="flex items-center gap-3 bg-white/80 dark:bg-white/5 px-6 py-3 rounded-[20px] border border-black/5 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30 hidden lg:flex shadow-xl dark:shadow-none">
             <span>HRM</span>
             <svg className="w-2.5 h-2.5 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
             <span className="text-slate-900 dark:text-white/80">{NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label || 'Hệ thống'}</span>
          </div>
      </div>

      <div className="flex items-center gap-6">
         <div className="flex items-center gap-4 bg-white/80 dark:bg-white/10 backdrop-blur-3xl px-6 py-3 rounded-[24px] border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
             <div className="flex items-center gap-2 pr-4 border-r border-black/5 dark:border-white/10">
                {isRainy ? (
                  <svg className="w-5 h-5 text-blue-500 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" /></svg>
                ) : isCloudy ? (
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-amber-500 dark:text-amber-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 3.05a1 1 0 010 1.415l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 10a1 1 0 11-2 0h-1a1 1 0 110-2h1a1 1 0 112 0v1zM14.243 15.657a1 1 0 01-1.415 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.415zM10 18a1 1 0 100-2v-1a1 1 0 10-2 0v1a1 1 0 102 0v1zM5.757 14.243a1 1 0 010-1.415l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM3 10a1 1 0 112 0h1a1 1 0 110 2H5a1 1 0 11-2 0v-1zM5.757 5.757a1 1 0 011.415 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                )}
                <span className="text-sm font-black text-slate-800 dark:text-white">{temp !== null ? `${temp}°C` : '--°C'}</span>
             </div>
             <span className="text-base font-black font-mono text-slate-800 dark:text-white tracking-[0.2em]">{timeText}</span>
         </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button 
              title="Đăng xuất"
              onClick={handleLogout}
              className="p-3.5 text-slate-400 dark:text-white/30 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
            >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
      </div>
    </header>
  );
}
