'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportExcelModal({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleImport() {
    if (!file) {
      setError('Vui lòng chọn file Excel để import');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/api/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi import danh sách.');
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
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-10 uppercase tracking-tighter leading-none px-1">Nhập danh sách nhân viên</h2>
        
        <div className="mb-8 space-y-4">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 ml-1">Chọn file Excel (.xlsx, .xls)</label>
          <div className="border-2 border-dashed border-black/10 dark:border-white/10 p-12 rounded-[32px] flex items-center justify-center bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-500 w-full cursor-pointer relative group shadow-inner">
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="text-center pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-6 border border-indigo-500/20 shadow-2xl">
                 <svg className="w-10 h-10" stroke="currentColor" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="mt-1 text-[11px] font-black tracking-widest uppercase text-slate-400 dark:text-white/40">{file ? file.name : 'Kéo thả file vào đây hoặc Click'}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 dark:text-rose-400 text-xs font-black uppercase tracking-widest mb-8 animate-shake">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center gap-4 mt-12">
           <button 
             onClick={onClose} 
             className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
           >
             Hủy
           </button>
           <button 
             onClick={() => void handleImport()} 
             disabled={loading} 
             className="px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white shadow-2xl shadow-emerald-500/30 transition-all disabled:opacity-30 active:scale-95 duration-300"
           >
             {loading ? 'Đang gửi...' : 'Gửi danh sách hồ sơ'}
           </button>
        </div>
      </div>
    </div>
  );
}
