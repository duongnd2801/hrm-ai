'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeText = clock.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const pillItems = NAV_ITEMS.filter((item) => {
     const isAllowed = hasRole(session.role, ...item.roles);
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
         <div className="flex items-center bg-white/10 backdrop-blur-3xl rounded-[24px] p-1.5 border border-white/10 shadow-3xl">
            {pillItems.map((item) => {
               const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
               return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex items-center gap-2.5 px-6 py-3 rounded-[18px] text-[13px] font-black tracking-widest uppercase transition-all duration-500 ${
                       active 
                         ? 'bg-white text-slate-900 shadow-2xl scale-105' 
                         : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                     {item.label}
                  </Link>
               )
            })}
         </div>

         <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-[20px] border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hidden lg:flex">
            <span>HRM</span>
            <svg className="w-2.5 h-2.5 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-white/80">{NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label || 'Hệ thống'}</span>
         </div>
      </div>

      <div className="flex items-center gap-6">
         <div className="flex items-center gap-4 bg-white/10 backdrop-blur-3xl px-6 py-3 rounded-[24px] border border-white/10 shadow-3xl">
             <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                <svg className="w-5 h-5 text-amber-300 shadow-amber-500/50" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 3.05a1 1 0 010 1.415l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 10a1 1 0 11-2 0h-1a1 1 0 110-2h1a1 1 0 112 0v1zM14.243 15.657a1 1 0 01-1.415 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.415zM10 18a1 1 0 100-2v-1a1 1 0 10-2 0v1a1 1 0 102 0v1zM5.757 14.243a1 1 0 010-1.415l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM3 10a1 1 0 112 0h1a1 1 0 110 2H5a1 1 0 11-2 0v-1zM5.757 5.757a1 1 0 011.415 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                <span className="text-sm font-black text-white">26°C</span>
             </div>
             <span className="text-base font-black font-mono text-white tracking-[0.2em]">{timeText}</span>
         </div>

         <div className="flex items-center gap-2">
         <ThemeToggle />
            <button 
              title="Đăng xuất"
              onClick={handleLogout}
              className="p-3.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
            >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
         </div>
      </div>
    </header>
  );
}
