'use client';

import { useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';

export default function CreateEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/employees', formData);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        const message = typeof data === 'string' ? data : (data as { message?: string } | undefined)?.message;
        setError(message || 'Lỗi tạo nhân viên mới.');
      } else {
        setError('Lỗi tạo nhân viên mới.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm">
       <div className="glass-dark w-full max-w-md rounded-[40px] p-10 shadow-3xl relative animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 dark:text-white/20 hover:text-indigo-600 dark:hover:text-white transition-all">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-10 uppercase tracking-tighter leading-none">Thêm nhân viên thủ công</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 ml-1">Họ tên nhân viên</label>
            <input
              required
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm tracking-tight"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 ml-1">Email công ty</label>
            <input
              required
              type="email"
              placeholder="email@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm tracking-tight"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 ml-1">Ngày vào làm</label>
            <input
              required
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-black text-sm uppercase tracking-widest"
            />
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 dark:text-rose-400 text-xs font-black uppercase tracking-widest animate-shake">
              {error}
            </div>
          )}
          
          <p className="text-slate-400 dark:text-white/20 text-[10px] mt-6 text-center font-bold uppercase tracking-widest leading-relaxed">
             Tài khoản user sẽ được tạo tự động với mật khẩu mặc định <span className="text-slate-500 dark:text-white/40">Emp@123</span>
          </p>

          <div className="flex justify-between items-center gap-4 mt-12">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 text-white shadow-2xl shadow-indigo-500/30 transition-all disabled:opacity-30 active:scale-95 duration-300"
            >
              {loading ? 'Đang tạo...' : 'Tạo mới hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
