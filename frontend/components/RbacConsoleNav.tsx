'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, KeyRound, Shield } from 'lucide-react';

const RBAC_ITEMS = [
  {
    href: '/settings/roles/matrix',
    label: 'Ma trận phân quyền',
    icon: LayoutGrid,
    description: 'Gán / bỏ quyền trực tiếp theo role',
  },
  {
    href: '/settings/roles',
    label: 'Quản lý Role',
    icon: Shield,
    description: 'Tạo, sửa, xóa nhóm quyền',
  },
  {
    href: '/settings/permissions',
    label: 'Danh mục quyền',
    icon: KeyRound,
    description: 'Xem danh sách quyền hệ thống (chỉ đọc)',
  },
];

export default function RbacConsoleNav() {
  const pathname = usePathname();

  return (
    <div className="glass-dark border border-slate-200 dark:border-white/5 rounded-[32px] p-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {RBAC_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-[24px] border p-5 transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-100 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500/30 shadow-lg dark:shadow-[0_12px_40px_rgba(79,70,229,0.18)]'
                  : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-white/60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-black uppercase tracking-[0.18em] ${
                    isActive ? 'text-indigo-700 dark:text-white' : 'text-slate-700 dark:text-white'
                  }`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-white/35 uppercase tracking-[0.14em] mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
