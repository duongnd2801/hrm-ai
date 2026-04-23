'use client';

import React from 'react';
import { Employee } from '@/types';

type Props = {
  emp: Employee;
  onChange: (updates: Partial<Employee>) => void;
  disabled: boolean;
};

export default function EmergencyContactSection({ emp, onChange, disabled }: Props) {
  return (
    <div className="relative group glass-dark rounded-[40px] p-10 shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-3xl transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 rounded-[40px] transition-all duration-300" />
      <div className="relative z-10 flex items-center gap-3 mb-10">
        <div className="w-2 h-8 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full" />
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">👨‍👩‍👧 Người thân liên hệ</h3>
      </div>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">👤 Họ tên</label>
          <input
            type="text"
            value={emp.emergencyContactName || ''}
            placeholder="Nguyễn Thị B"
            onChange={(e) => onChange({ emergencyContactName: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-rose-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-rose-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">💞 Mối quan hệ</label>
          <input
            type="text"
            value={emp.emergencyContactRelationship || ''}
            placeholder="Mẹ / Vợ / Chồng..."
            onChange={(e) => onChange({ emergencyContactRelationship: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-rose-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-rose-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📱 Điện thoại</label>
          <input
            type="text"
            value={emp.emergencyContactPhone || ''}
            placeholder="0987654321"
            onChange={(e) => onChange({ emergencyContactPhone: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-rose-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-rose-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
