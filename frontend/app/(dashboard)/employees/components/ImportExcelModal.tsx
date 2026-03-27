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
      setError('Vui lng chọn file Excel - import');
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
      setError(err.response?.data?.message || 'C- li xy ra khi import danh sách.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"></button>
        <h2 className="text-xl font-bold text-white mb-4">Nhập danh sách nhân viên</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Chơn file Excel (.xlsx, .xls)</label>
          <div className="border-2 border-dashed border-white/10 p-6 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors w-full cursor-pointer relative">
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="text-center pointer-events-none">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1 text-sm text-gray-400">{file ? file.name : 'Kéo thả file vào ở đây hoặc Click'}</p>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 p-2 rounded">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition">Hủy</button>
          <button onClick={handleImport} disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50">
            {loading ? 'ang import...' : 'Gi danh sách'}
          </button>
        </div>
      </div>
    </div>
  );
}
