'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession } from '@/lib/auth';
import type { UserSession } from '@/types';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { AuthProvider } from '@/components/AuthProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    setMounted(true);
    const s = getSession() as UserSession | null;
    if (!s) {
      router.push('/login');
      return;
    }
    setSession(s);
  }, [router, pathname]);

  // Prevent hydration mismatch by only rendering content after mount
  if (!mounted || !session) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden relative bg-slate-50 dark:bg-slate-950 transition-colors duration-500 text-slate-900 dark:text-white">
        {/* Dynamic Background Image */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop')",
            filter: "brightness(var(--bg-bright, 0.3)) contrast(var(--bg-contrast, 1.1)) saturate(1.2) blur(3px)" 
          }} 
        />
        <style jsx>{`
            :global(.theme-light) { --bg-bright: 0.95; --bg-contrast: 0.85; }
            :global(.theme-dark) { --bg-bright: 0.3; --bg-contrast: 1.1; }
        `}</style>
        
        {/* Main Overlay Gradient */}
        <div className="fixed inset-0 z-1 bg-gradient-to-tr from-slate-200/40 via-white/10 to-transparent dark:from-slate-950/80 dark:via-indigo-950/20 dark:to-transparent pointer-events-none" />

        {/* Floating UI Container */}
        <div className="relative z-10 flex w-full h-full">
           <Sidebar session={session} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

           <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <Header
                 session={session}
                 collapsed={collapsed}
                 onToggleSidebar={() => setCollapsed(!collapsed)}
                 pathname={pathname}
              />

              <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 relative scrollbar-thin scrollbar-thumb-white/10 min-w-0">
                 {children}
              </main>
           </div>
        </div>
      </div>
    </AuthProvider>
  );
}
