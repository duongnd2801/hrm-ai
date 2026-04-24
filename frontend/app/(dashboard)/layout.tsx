'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { fetchCurrentSession } from '@/lib/api';
import type { UserSession } from '@/types';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { AuthProvider } from '@/components/AuthProvider';
import ChatWidget from '@/components/ChatWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setCollapsed(false);
    }

    async function initSession() {
      // Fetch full session with permissions from backend /me
      const current = await fetchCurrentSession();
      if (current) {
        setSession(current);
      } else if (!redirectingRef.current) {
        redirectingRef.current = true;
        router.replace('/login');
      }
      setLoading(false);
    }
    
    void initSession();
  }, [router]);

  // Show spinner during initial load or while fetching session
  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center transition-opacity duration-700">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <AuthProvider session={session}>
      <div className="flex h-screen overflow-hidden relative bg-white dark:bg-[#020617] transition-colors duration-500 text-slate-900 dark:text-white">
        {/* Background Image */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700
                     brightness-[0.35] contrast-[1.1]
                     theme-light:brightness-[0.6] theme-light:saturate-[1.1]"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop')"
          }} 
        />
        
        {/* Subtle Overlay */}
        <div className="fixed inset-0 z-1 pointer-events-none transition-colors duration-700
                        bg-gradient-to-tr from-[#020617]/80 via-[#020617]/20 to-transparent
                        theme-light:from-slate-900/25 theme-light:via-slate-900/5 theme-light:to-transparent" />

        <div className="relative z-10 flex w-full h-full">
           {/* Mobile Drawer Overlay */}
           {!collapsed && (
              <div 
                 className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-all duration-500 animate-in fade-in"
                 onClick={() => setCollapsed(true)}
              />
           )}
           <Sidebar session={session} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

           <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <Header
                 session={session}
                 collapsed={collapsed}
                 onToggleSidebar={() => setCollapsed(!collapsed)}
                 pathname={pathname}
              />

              <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 py-2 relative scrollbar-thin scrollbar-thumb-white/10 min-w-0">
                 {children}
              </main>
           </div>
           <ChatWidget />
        </div>
      </div>
    </AuthProvider>


  );
}
