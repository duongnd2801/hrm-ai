import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeInitializer from '@/components/ThemeInitializer';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'HRM System - Quản trị nhân sự',
  description: 'Hệ thống quản trị nhân sự nội bộ: chấm công, đơn từ, cấu hình công ty',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <Script id="theme-boot" strategy="beforeInteractive">
          {`
            try {
              var mode = localStorage.getItem('hrm_theme_mode') || 'system';
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
              var root = document.documentElement;
              root.classList.remove('theme-light', 'theme-dark');
              root.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light');
              root.style.colorScheme = resolved;
            } catch (e) {}
          `}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans antialiased app-body relative overflow-x-hidden`}>
        {/* Background Decorative Orbs */}
        <div className="fixed -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] orb z-0 pointer-events-none" />
        <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-violet-500/20 rounded-full blur-[100px] orb-delay z-0 pointer-events-none" />
        
        <ThemeInitializer />
        <div className="relative z-1">
          {children}
        </div>
      </body>
    </html>
  );
}
