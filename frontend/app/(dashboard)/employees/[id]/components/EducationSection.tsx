'use client';

import React from 'react';
import { Employee } from '@/types';

type Props = {
  emp: Employee;
  onChange: (updates: Partial<Employee>) => void;
  disabled: boolean;
};

export default function EducationSection({ emp, onChange, disabled }: Props) {
  return (
    <div className="relative group glass-dark rounded-[40px] p-10 shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-3xl transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-[40px] transition-all duration-300" />
      <div className="relative z-10 flex items-center gap-3 mb-10">
        <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">🎓 Trình độ & Chứng chỉ</h3>
      </div>
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🏫 Trường đào tạo</label>
          <input
            type="text"
            value={emp.university || ''}
            placeholder="ĐH Bách Khoa Hà Nội"
            onChange={(e) => onChange({ university: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📚 Chuyên ngành</label>
          <input
            type="text"
            value={emp.major || ''}
            placeholder="Công nghệ phần mềm"
            onChange={(e) => onChange({ major: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🎓 Hệ đào tạo</label>
          <input
            type="text"
            value={emp.educationLevel || ''}
            placeholder="Đại học / Cao đẳng / Thạc sĩ"
            onChange={(e) => onChange({ educationLevel: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📆 Năm tốt nghiệp</label>
          <input
            type="number"
            value={emp.graduationYear || ''}
            placeholder="2020"
            onChange={(e) => onChange({ graduationYear: Number(e.target.value) || undefined })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">💻 Ngôn ngữ lập trình</label>
          <input
            type="text"
            value={emp.programmingLanguages || ''}
            placeholder="Java, Python, TypeScript"
            onChange={(e) => onChange({ programmingLanguages: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🏅 Chứng chỉ CNTT</label>
          <input
            type="text"
            value={emp.itCertificate || ''}
            placeholder="AWS SAA, CCNA, PMP..."
            onChange={(e) => onChange({ itCertificate: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
