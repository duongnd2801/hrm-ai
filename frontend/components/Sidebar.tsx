'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { hasRole } from '@/lib/auth';
import type { UserSession } from '@/types';
import Avatar from './Avatar';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tổng quan', icon: 'grid', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
  { href: '/employees', label: 'Nhân viên', icon: 'users', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
  { href: '/projects', label: 'Dự án', icon: 'project', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
  { href: '/attendance', label: 'Chấm công', icon: 'calendar', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
  { href: '/apologies', label: 'Giải trình', icon: 'file-text', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
  { href: '/leave', label: 'Nghỉ phép', icon: 'umbrella', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
  { href: '/ot', label: 'Tăng ca', icon: 'clock', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
  { href: '/payroll', label: 'Bảng lương', icon: 'banknote', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
  { href: '/holidays', label: 'Ngày lễ', icon: 'holiday', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
  { href: '/company', label: 'Cấu hình', icon: 'settings', roles: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'] },
  { href: '/users', label: 'Quản lý TK', icon: 'users-admin', roles: ['ADMIN'] },
];

function Icon({ name }: { name: string }) {
  const cls = 'w-5 h-5';
  switch (name) {
    case 'grid':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
    case 'calendar':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
    case 'file-text':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
    case 'umbrella':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 15.536c-1.171-1.172-3.071-1.172-4.242 0L6 19.414V5a2 2 0 012-2h8a2 2 0 012 2v14.414l-3.879-3.878z" /></svg>;
    case 'users':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
    case 'banknote':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75m0 0v.75m0-1.5h1.5m-1.5 0h-1.5m1.5 1.5H3.75m1.5 0h1.5m-1.5-1.5V3.75m0 9.75v.75m0 0v.75m0-1.5h1.5m-1.5 0h-1.5m1.5 1.5H3.75m1.5 0h1.5m-1.5-1.5V12.75M12 9.75v.75m0 0v.75m0-1.5h1.5m-1.5 0h-1.5m1.5 1.5H12m1.5 0h1.5m-1.5-1.5V9.75m0 9.75v.75m0 0v.75m0-1.5h1.5m-1.5 0h-1.5m1.5 1.5H12m1.5 0h1.5m-1.5-1.5V19.5" /></svg>;
    case 'holiday':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
    case 'clock':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'settings':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'users-admin':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
    case 'project':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.118v0H5.622c-1.085-.082-1.872-1.024-1.872-2.118v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>;
    case 'sparkles':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.454L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
    default:
      return null;
  }
}

interface SidebarProps {
  session: UserSession;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ session, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => hasRole(...item.roles));

  return (
      <aside className={`h-screen glass-dark flex flex-col border-r border-black/5 dark:border-white/10 z-50 md:z-30 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl fixed inset-y-0 left-0 md:relative ${collapsed ? '-translate-x-full md:translate-x-0 w-[280px] md:w-[88px]' : 'translate-x-0 w-[280px]'}`}>
      
      {/* Glow Effect */}
      {!collapsed && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
      )}

      {/* Top Logo Section */}
      <div className={`h-32 flex items-center shrink-0 transition-all duration-500 ${collapsed ? 'justify-center' : 'px-8'}`}>
         <div className="flex items-center gap-5 group cursor-pointer">
            <div className="w-14 h-14 rounded-[22px] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 relative overflow-hidden group-hover:scale-105 transition-all duration-500 active:scale-95">
               <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
               <span className="text-white font-black text-3xl tracking-tighter drop-shadow-lg relative z-10">H</span>
            </div>
            {!collapsed && (
               <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500 delay-150">
                  <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-widest leading-none uppercase">HRM SYSTEM</h1>
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400/50 uppercase tracking-[0.35em] mt-2 ml-0.5 leading-none">Premium Suite</p>
               </div>
            )}
         </div>
      </div>

      {/* Navigation Items */}
      <div className={`flex-1 py-4 flex flex-col gap-2.5 overflow-y-auto scrollbar-none scroll-smooth ${collapsed ? 'items-center px-4' : 'px-6'}`}>
         {visibleItems.map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
               <Link 
                 key={item.href} 
                 href={item.href} 
                 className={`flex items-center rounded-[20px] transition-all duration-500 relative group overflow-hidden ${
                   collapsed ? 'p-4 justify-center w-full' : 'p-4 px-5 justify-start gap-4'
                 } ${
                   isActive 
                     ? 'bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)] ring-1 ring-white/10' 
                     : 'text-slate-900 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white hover:translate-x-1.5'
                 }`}
               >
                  <div className={`shrink-0 transition-all duration-500 ${isActive ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`}>
                    <Icon name={item.icon} />
                  </div>
                  
                  {!collapsed && (
                    <span className="text-sm font-black uppercase tracking-[0.15em] whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                      {item.label}
                    </span>
                  )}

                  {!collapsed && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-pulse" />
                  )}

                  {collapsed && (
                    <div className={`absolute left-0 bottom-3 top-3 w-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-r-full transition-all duration-500 ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 group-hover:opacity-100 group-hover:scale-y-100'}`} />
                  )}
               </Link>
            );
         })}
      </div>

      {/* Footer Profile Section */}
      <div className={`shrink-0 pb-10 transition-all duration-500 border-t border-black/5 dark:border-white/5 pt-8 ${collapsed ? 'flex flex-col items-center gap-6' : 'px-8'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-4 bg-black/[0.03] dark:bg-white/[0.03] p-4 rounded-[28px] border border-black/5 dark:border-white/5 group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
               <div className="relative shrink-0">
                  <Avatar name={session.email.split('@')[0]} size="md" />
                  <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-emerald-400 border-[3px] border-white dark:border-slate-950 rounded-full shadow-lg" />
               </div>
               <div className="flex flex-col min-w-0">
                  <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-tighter truncate">{session.email.split('@')[0]}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-widest uppercase mt-0.5">
                    {session.role === 'ADMIN' ? 'Quản trị' : session.role === 'HR' ? 'Nhân sự' : session.role === 'MANAGER' ? 'Quản lý' : 'Nhân viên'}
                  </span>
               </div>
                <Link href={`/employees/${session.employeeId}`} className="ml-auto p-2 opacity-0 group-hover:opacity-100 text-slate-400 dark:text-white/30 hover:text-indigo-600 dark:hover:text-white transition-all transform hover:scale-110">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </Link>
            </div>
          ) : (
            <Link href={`/employees/${session.employeeId}`} className="relative group transition-transform hover:scale-110 duration-300">
               <Avatar name={session.email.split('@')[0]} size="md" />
               <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-950 rounded-full shadow-lg" />
               <div className="absolute left-full ml-4 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-2xl z-50 translate-x-4 group-hover:translate-x-0 duration-500">
                  <div className="flex flex-col">
                     <span className="uppercase tracking-tighter">{session.email.split('@')[0]}</span>
                     <span className="text-[8px] opacity-70 tracking-widest leading-none mt-1 uppercase">Xem hồ sơ</span>
                  </div>
               </div>
            </Link>
          )}
      </div>
    </aside>
  );
}
