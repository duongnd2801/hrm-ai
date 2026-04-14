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
}

export default function ImportExcelModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
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
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Read as array of arrays first to get headers cleanly

      if (jsonData.length < 4) {
        throw new Error('File Excel không có dữ liệu (cần ít nhất 3 dòng tiêu đề và 1 dòng dữ liệu)');
      }

      const mainHeaders = (jsonData[0] || []) as string[]; 
      const subHeaders = (jsonData[1] || []) as string[]; 
      const dataRows = jsonData.slice(3) as ExcelCell[][]; 
      
      const headerRow: string[] = [];
      for (let i = 0; i < 30; i++) {
        const sub = subHeaders[i];
        const main = mainHeaders[i];
        headerRow.push((sub && String(sub).trim() !== '') ? String(sub) : (main ? String(main) : `Cột ${i + 1}`));
      }
      
      setHeaders(headerRow);
      setFile(selectedFile);

      // Validation for preview based on Backend mapping (30 columns format)
      const rowsWithErrors: ExcelRow[] = dataRows.map((rowArr, idx) => {
        const errors: string[] = [];
        const rowData: ExcelRow = {
          rowIndex: idx + 4, // 1-based excel row index
          errors
        };
        
        headerRow.forEach((h, i) => {
          rowData[`col_${i}`] = rowArr[i];
        });

        const name = rowArr[2];   // Họ tên (col 2)
        const phone = rowArr[16]; // Số điện thoại (col 16)
        const cccd  = rowArr[18]; // CCCD (col 18)

        if (!name || String(name).trim() === '') errors.push('Thiếu Tên');
        
        if (!phone || String(phone).trim() === '') {
          errors.push('Thiếu SĐT');
        }

        if (!cccd || String(cccd).trim() === '') {
          errors.push('Thiếu CCCD');
        }
        
        return rowData;
      });

      setPreviewData(rowsWithErrors);
      setSelectedRows(rowsWithErrors.filter(r => !r.errors?.length).map(r => r.rowIndex));
      setStep('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi đọc file Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    if (selectedRows.length === 0) {
      setError('Vui lòng chọn ít nhất 1 dòng nhân viên hợp lệ để import.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const allRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      
      const newRows = allRows.filter((_, idx) => idx < 3 || selectedRows.includes(idx + 1));
      const newWorksheet = XLSX.utils.aoa_to_sheet(newRows);
      workbook.Sheets[worksheetName] = newWorksheet;
      const newBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const filteredFile = new File([newBuffer], file.name, { type: file.type });

      const formData = new FormData();
      formData.append('file', filteredFile);
      const res = await api.post('/api/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // The backend might return detailed validation results
      if (res.data.failureCount > 0) {
        setError(`Có ${res.data.failureCount} dòng không hợp lệ. Vui lòng kiểm tra lại file.`);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Có lỗi xảy ra khi import danh sách.'
        : 'Có lỗi xảy ra khi import danh sách.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/employees/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError('Có lỗi xảy ra khi tải file mẫu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = previewData.some(row => row.errors && row.errors.length > 0);

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
          <div className="w-14 h-14 bg-indigo-500/20 rounded-[22px] flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-glow">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">Import Nhân viên</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{step === 'upload' ? 'Bước 1: Tải lên file Excel' : 'Bước 2: Kiểm tra dữ liệu hợp lệ'}</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-4 animate-shake">
            <div className="w-8 h-8 bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
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
                isDragging 
                  ? 'bg-indigo-500/10 border-indigo-500 shadow-indigo-500/20' 
                  : 'border-black/10 dark:border-white/10 bg-white/5 hover:bg-indigo-500/5 hover:border-indigo-500/50'
              }`}
            >
              <div className="text-center group-hover:scale-105 transition-transform duration-700">
                <div className="w-24 h-24 bg-indigo-500/20 rounded-[32px] flex items-center justify-center text-indigo-400 mx-auto mb-8 border border-indigo-500/20 shadow-2xl group-hover:shadow-indigo-500/40 group-hover:-translate-y-2 transition-all duration-500">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <p className="text-xs font-black tracking-[0.2em] uppercase text-slate-400 group-hover:text-indigo-400 transition-colors">Vui lòng Click để chọn File</p>
                <div className="flex items-center gap-2 justify-center mt-4">
                   <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase text-slate-500 border border-white/5">.xlsx</span>
                   <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase text-slate-500 border border-white/5">.xls</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect} 
                accept=".xlsx,.xls" 
                className="hidden" 
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <button onClick={onClose} className="px-8 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10">Hủy bỏ</button>
              <button 
                onClick={handleDownloadTemplate}
                disabled={loading}
                className="px-8 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 text-center transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? 'Đang tải...' : 'Tải file Excel mẫu'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 space-y-6">
            <div className="flex items-center justify-between bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-2xl">
              <div className="flex gap-12">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Dòng phát hiện</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{previewData.length}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/50">Dòng hợp lệ</span>
                  <span className="text-3xl font-black text-emerald-400">{previewData.filter(r => !r.errors?.length).length}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-500/50">Dòng lỗi</span>
                  <span className="text-3xl font-black text-rose-400">{previewData.filter(r => r.errors?.length).length}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setStep('upload')}
                  className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  Chọn lại file khác
                </button>
                <div className="h-12 w-px bg-white/10"></div>
                <button 
                  onClick={handleImport}
                  disabled={loading || hasErrors}
                  className="px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow shadow-emerald-500/30 transition-all disabled:opacity-20 active:scale-95 duration-500 flex items-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <span>Xác nhận Import</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto border border-white/10 rounded-[32px] bg-black/20 custom-scrollbar shadow-inner relative group">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl z-20">
                  <tr>
                    <th className="px-5 py-5 w-10 border-b border-white/5">
                      <input 
                         type="checkbox" 
                         className="w-4 h-4 bg-white/5 border-white/10 rounded cursor-pointer checked:bg-indigo-500 transition-colors"
                         checked={selectedRows.length > 0 && selectedRows.length === previewData.filter(r => !r.errors?.length).length}
                         onChange={(e) => {
                            if (e.target.checked) setSelectedRows(previewData.filter(r => !r.errors?.length).map(r => r.rowIndex));
                            else setSelectedRows([]);
                         }}
                      />
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">#</th>
                    {headers.map((header, i) => (
                      <th key={i} className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-indigo-300/80 border-b border-white/5 whitespace-nowrap">{header}</th>
                    ))}
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {previewData.map((row) => (
                    <tr key={row.rowIndex} className={`group/row transition-all duration-300 ${row.errors?.length ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-white/5'} ${selectedRows.includes(row.rowIndex) ? 'bg-indigo-500/5' : ''}`}>
                      <td className="px-5 py-5 text-center">
                        <input 
                           type="checkbox" 
                           className="w-4 h-4 bg-white/5 border-white/10 rounded cursor-pointer disabled:opacity-20"
                           disabled={(row.errors?.length || 0) > 0}
                           checked={selectedRows.includes(row.rowIndex)}
                           onChange={(e) => {
                              if (e.target.checked) setSelectedRows([...selectedRows, row.rowIndex]);
                              else setSelectedRows(selectedRows.filter(id => id !== row.rowIndex));
                           }}
                        />
                      </td>
                      <td className="px-8 py-5 text-[12px] font-bold text-slate-500 group-hover/row:text-slate-300 transition-colors">{row.rowIndex}</td>
                      {headers.map((header, i) => (
                        <td key={i} className="px-6 py-5 text-[13px] text-slate-300 group-hover/row:text-white transition-colors whitespace-nowrap">
                          {String(row[`col_${i}`] || '-')}
                        </td>
                      ))}
                      <td className="px-8 py-5">
                        {row.errors?.length ? (
                          <div className="flex flex-col gap-1.5">
                             <span className="flex items-center gap-1.5 text-rose-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Dòng lỗi</span>
                             </span>
                             <p className="text-[11px] text-rose-400/50 font-medium leading-tight">{row.errors.join(', ')}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-400">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                             <span className="text-[10px] font-black uppercase tracking-widest">Hợp lệ</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(previewData.length > 0 && hasErrors) && (
               <p className="text-center text-[10px] font-black tracking-widest uppercase text-rose-500 mt-4 animate-pulse">Vui lòng sửa các dòng lỗi trong file Excel trước khi tiếp tục</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
