'use client';

import React from 'react';
import { Employee } from '@/types';
import SearchableSelect from '@/components/SearchableSelect';

type Props = {
  emp: Employee;
  onChange: (updates: Partial<Employee>) => void;
  disabled: boolean;
  canEditStructure: boolean;
};

export default function PersonalInfoSection({ emp, onChange, disabled, canEditStructure }: Props) {
  return (
    <div className="relative group glass-dark rounded-[40px] p-10 shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-3xl transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[40px] transition-all duration-300" />
      
      <div className="relative z-10 flex items-center gap-3 mb-10">
        <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Thông tin cá nhân</h3>
      </div>
      
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        {canEditStructure && (
          <>
            <div className="md:col-span-1">
              <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">👤 Họ và Tên</label>
              <input
                type="text"
                value={emp.fullName || ''}
                onChange={(e) => onChange({ fullName: e.target.value })}
                className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">✉️ Email đăng nhập</label>
              <input
                type="email"
                value={emp.email || ''}
                onChange={(e) => onChange({ email: e.target.value })}
                className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📱 Số điện thoại</label>
          <input
            type="text"
            value={emp.phone || ''}
            placeholder="Chưa cập nhật"
            onChange={(e) => onChange({ phone: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🎂 Ngày sinh</label>
          <input
            type="date"
            value={emp.birthDate || ''}
            onChange={(e) => onChange({ birthDate: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <SearchableSelect
            label="⚧ Giới tính"
            value={emp.gender}
            options={[
              { id: 'MALE', label: 'Nam' },
              { id: 'FEMALE', label: 'Nữ' },
              { id: 'OTHER', label: 'Khác' },
            ]}
            placeholder="Chọn giới tính..."
            allowClear
            disabled={disabled}
            onSelect={(nextId) => onChange({ gender: (nextId || undefined) as Employee['gender'] })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🏠 Địa chỉ thường trú</label>
          <input
            type="text"
            value={emp.address || ''}
            placeholder="Chưa cập nhật địa chỉ"
            onChange={(e) => onChange({ address: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">✍️ Tiểu sử / Ghi chú</label>
          <textarea
            rows={4}
            value={emp.bio || ''}
            placeholder="Giới thiệu ngắn về bản thân, kỹ năng, thành tựu..."
            onChange={(e) => onChange({ bio: e.target.value })}
            disabled={disabled}
            className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-4 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
        </div>
      </div>
    </div>
  );
}
