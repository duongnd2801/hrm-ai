'use client';

import React from 'react';
import { Employee } from '@/types';

type Props = {
  emp: Employee;
};

export default function AccountStatusCard({ emp }: Props) {
  return (
    <div className="relative group glass-dark backdrop-blur-3xl rounded-[40px] p-10 shadow-2xl dark:shadow-3xl hover:shadow-3xl dark:hover:shadow-4xl transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[40px] transition-all duration-300" />
      
      <div className="relative z-10 text-center space-y-6">
        <div>
          <p className="text-[10px] font-black text-slate-600/60 dark:text-white/30 uppercase tracking-[0.2em] mb-5">🔑 Tài khoản hệ thống</p>
          
          <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full border text-xs font-black uppercase tracking-widest transition-all duration-300 ${
            emp.status === 'ACTIVE' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10' :
            emp.status === 'INACTIVE' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-500/10' :
            'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10'
          }`}>
            {emp.status === 'ACTIVE' ? '✓ Đang hoạt động' : 
             emp.status === 'INACTIVE' ? '✕ Ngưng hoạt động / Khóa' :
             emp.status === 'PROBATION' ? '⏳ Đang thử việc' :
             '📄 Chính thức / Hợp đồng'}
          </div>
        </div>
        <div className="pt-4 border-t border-black/10 dark:border-white/10">
          <h4 className="text-slate-900 dark:text-white font-black text-lg truncate mb-2">{emp.email}</h4>
          <p className="text-slate-700/60 dark:text-white/40 text-xs font-bold tracking-widest">
            ID: <span className="font-black text-indigo-400">{emp.id.split('-')[0].toUpperCase()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
