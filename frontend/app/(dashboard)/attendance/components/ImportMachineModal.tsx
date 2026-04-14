'use client';

import axios from 'axios';
import { useState, useRef } from 'react';
import api from '@/lib/api';
import * as XLSX from 'xlsx';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type ExcelCell = string | number | boolean | null | undefined;

interface ExcelRow {
  rowIndex: number;
  [key: string]: ExcelCell | string[];
  errors?: string[];
  employeeId?: string;
  date?: string;
  checkIn?: string;
  checkOut?: string;
}

export default function ImportMachineModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFile(e.target.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFile(e.dataTransfer.files?.[0]);
  };

  const processFile = async (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('Vui lòng chọn file Excel hợp lệ (.xlsx hoặc .xls)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 6) {
        throw new Error('File Excel không có dữ liệu (Bắt đầu từ dòng 6)');
      }

      const rawRows = jsonData.slice(5); // SKIP 5 rows, start from row 6 (index 5)
      
      const rowsWithErrors: ExcelRow[] = rawRows.map((rowArr, idx) => {
        const errors: string[] = [];
        
        // Col B (1): ID
        // Col E (4): Date
        // Col G (6): CheckIn
        // Col H (7): CheckOut
        
        const empId = rowArr[1] ? String(rowArr[1]).trim() : '';
        const dateStr = rowArr[4] ? String(rowArr[4]).trim() : '';
        const ci = rowArr[6] ? String(rowArr[6]) : '';
        const co = rowArr[7] ? String(rowArr[7]) : '';

        if (!empId) errors.push('Thiếu Mã NV');
        if (!dateStr) errors.push('Thiếu Ngày');
        
        return {
          rowIndex: idx + 6,
          col_id: empId,
          col_name: rowArr[2],
          col_dept: rowArr[3],
          col_date: dateStr,
          col_ci: ci,
          col_co: co,
          employeeId: empId,
          date: dateStr,
          checkIn: ci,
          checkOut: co,
          errors
        };
      }).filter(r => r.employeeId || r.date); // Filter out empty lines at the end

      setPreviewData(rowsWithErrors);
      setFile(selectedFile);
      setStep('preview');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Lỗi đọc file Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/attendance/import-machine', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (res.data.failureCount > 0 && res.data.successCount === 0) {
        setError(`Import thất bại hoàn toàn. Có ${res.data.failureCount} lỗi xử lý.`);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Có lỗi xảy ra khi import.'
        : 'Có lỗi xảy ra khi import.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`glass-dark rounded-[40px] shadow-3xl relative animate-in zoom-in duration-500 border border-white/5 flex flex-col transition-all duration-700 ${step === 'upload' ? 'w-full max-w-lg p-10' : 'w-full max-w-[90vw] h-[85vh] p-8'}`}>
        
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-slate-400 dark:text-white/20 hover:text-rose-500 transition-all bg-white/5 p-2 rounded-xl active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 bg-amber-500/20 rounded-[22px] flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-glow">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">Import Máy Chấm Công</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{step === 'upload' ? 'Hỗ trợ file Excel 15 cột' : 'Vui lòng xác nhận dữ liệu'}</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-4 animate-shake">
            {error}
          </div>
        )}

        {step === 'upload' ? (
          <div className="space-y-10">
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed p-20 rounded-[44px] flex items-center justify-center transition-all duration-700 cursor-pointer group shadow-inner ${
                isDragging ? 'bg-amber-500/10 border-amber-500 shadow-amber-500/20' : 'border-black/10 dark:border-white/10 bg-white/5 hover:bg-amber-500/5 hover:border-amber-500/50'
              }`}
            >
              <div className="text-center group-hover:scale-105 transition-transform duration-700">
                <div className="w-20 h-20 bg-amber-500/20 rounded-[32px] flex items-center justify-center text-amber-400 mx-auto mb-6 border border-amber-500/20 group-hover:-translate-y-2 transition-all">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <p className="text-xs font-black tracking-widest uppercase text-slate-400">Chọn file từ máy chấm công</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx,.xls" className="hidden" />
            </div>
            <p className="text-[10px] text-center text-slate-500 uppercase font-bold px-10">Mẹo: Hệ thống sẽ tự động mapping nhân viên dựa vào cột ID và Ngày trong file.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 space-y-6">
             <div className="flex items-center justify-between bg-white/5 p-6 rounded-[32px] border border-white/5">
                <div className="flex gap-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-500">Tổng dòng</span>
                    <span className="text-2xl font-black">{previewData.length}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-emerald-500/50">Sẵn sàng</span>
                    <span className="text-2xl font-black text-emerald-400">{previewData.filter(r => !r.errors?.length).length}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep('upload')} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all">Quay lại</button>
                  <button 
                    onClick={handleImport} 
                    disabled={loading}
                    className="px-8 py-3 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase shadow-glow shadow-emerald-500/20 hover:bg-emerald-500 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Đang import...' : 'Xác nhận và Lưu'}
                  </button>
                </div>
             </div>

             <div className="flex-1 overflow-auto border border-white/10 rounded-[32px] bg-black/20 custom-scrollbar shadow-inner">
               <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-xl z-20 border-b border-white/5">
                   <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                     <th className="p-5">Dòng</th>
                     <th className="p-5 text-amber-400">ID Nhân viên</th>
                     <th className="p-5">Họ tên</th>
                     <th className="p-5">Ngày</th>
                     <th className="p-5 text-emerald-400">Vào</th>
                     <th className="p-5 text-rose-400">Ra</th>
                     <th className="p-5">Lỗi</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {previewData.map((row) => (
                     <tr key={row.rowIndex} className={`hover:bg-white/5 text-[11px] font-bold ${row.errors?.length ? 'bg-rose-500/5' : ''}`}>
                       <td className="p-5 text-slate-500">{row.rowIndex}</td>
                       <td className="p-5 text-white/90 font-mono">{row.col_id}</td>
                       <td className="p-5 text-white/70">{row.col_name}</td>
                       <td className="p-5 text-white/90">{row.col_date}</td>
                       <td className="p-5 text-emerald-400/80">{row.col_ci}</td>
                       <td className="p-5 text-rose-400/80">{row.col_co}</td>
                       <td className="p-5 text-rose-500 text-[9px]">{row.errors?.join(', ')}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
