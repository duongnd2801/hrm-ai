'use client';

import React from 'react';
import { Employee } from '@/types';

type Props = {
  emp: Employee;
  onChange: (updates: Partial<Employee>) => void;
  disabledPersonal: boolean;
  disabledStructure: boolean;
};

export default function IdentitySection({ emp, onChange, disabledPersonal, disabledStructure }: Props) {
  return (
    <div className="relative group glass-dark rounded-[40px] p-10 shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-3xl transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-[40px] transition-all duration-300" />
      <div className="relative z-10 flex items-center gap-3 mb-10">
        <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">🪪 Căn cước công dân</h3>
      </div>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📧 Email cá nhân</label>
          <input
            type="email"
            value={emp.personalEmail || ''}
            placeholder="email.canhan@gmail.com"
            onChange={(e) => onChange({ personalEmail: e.target.value })}
            disabled={disabledPersonal}
            className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-amber-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🆔 Số CCCD/CMND</label>
          <input
            type="text"
            value={emp.citizenId || ''}
            placeholder="079095xxxxxx"
            onChange={(e) => onChange({ citizenId: e.target.value })}
            disabled={disabledStructure}
            className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-amber-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📅 Ngày cấp</label>
          <input
            type="date"
            value={emp.citizenIdDate || ''}
            onChange={(e) => onChange({ citizenIdDate: e.target.value })}
            disabled={disabledStructure}
            className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-amber-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📍 Nơi cấp</label>
          <input
            type="text"
            value={emp.citizenIdPlace || ''}
            placeholder="Công an TP. Hà Nội"
            onChange={(e) => onChange({ citizenIdPlace: e.target.value })}
            disabled={disabledStructure}
            className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-amber-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
