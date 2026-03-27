'use client';

import { useState } from 'react';
import { useSession } from '@/components/AuthProvider';
import { hasRole } from '@/lib/auth';
import EmployeeTable from './components/EmployeeTable';
import ImportExcelModal from './components/ImportExcelModal';
import CreateEmployeeModal from './components/CreateEmployeeModal';
import api from '@/lib/api';
import Toast, { ToastState } from '@/components/Toast';

export default function EmployeesPage() {
  const { session } = useSession();
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  if (!session) return null;
  const canManage = hasRole(session.role, 'ADMIN', 'HR');

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  async function handleExport() {
    try {
      const res = await api.get('/api/employees/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'danh_sach_nhan_vien.xlsx');
      document.body.appendChild(link);
      link.click();
      pushToast('success', 'Đang tải xuống danh sách nhân viên...');
    } catch {
      pushToast('error', 'Không thể xuất dữ liệu nhân viên.');
    }
  }

  return (
    <div className="space-y-12">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Main Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pt-10">
         <div>
            <h1 className="text-8xl font-black text-white/90 tracking-tighter mix-blend-overlay uppercase">Nhân viên</h1>
            <p className="text-lg font-bold text-white/40 uppercase tracking-widest mt-2 px-1">Cơ sở dữ liệu nhân sự công ty</p>
         </div>

         {canManage && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/5 shadow-2xl mt-6 md:mt-0 px-4 py-3">
               <button
                  onClick={() => setShowCreate(true)}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-black tracking-widest transition-all shadow-lg active:scale-95"
               >
                  THÊM MỚI
               </button>
               <button
                  onClick={() => setShowImport(true)}
                  className="px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black tracking-widest transition-all active:scale-95"
               >
                  NHẬP EXCEL
               </button>
               <button
                  onClick={handleExport}
                  className="p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all"
               >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
               </button>
            </div>
         )}
      </div>

      {/* Stats Quick View Card */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
         <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[32px] min-w-[300px] flex items-center justify-between shadow-2xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
             <div>
                <p className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">Toàn công ty</p>
                <h3 className="text-4xl font-black text-white leading-none">642</h3>
             </div>
             <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-indigo-500/30 shadow-2xl group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493" /></svg>
             </div>
         </div>
         <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[32px] min-w-[300px] flex items-center justify-between shadow-2xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
             <div>
                <p className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">Hoạt động</p>
                <h3 className="text-4xl font-black text-emerald-400 leading-none">620</h3>
             </div>
             <div className="w-14 h-14 bg-emerald-500 text-slate-900 rounded-2xl flex items-center justify-center shadow-emerald-500/30 shadow-2xl group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 011-18" /></svg>
             </div>
         </div>
         <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[32px] min-w-[300px] flex items-center justify-between shadow-2xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full" />
             <div>
                <p className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">Nghỉ phép/Vắng</p>
                <h3 className="text-4xl font-black text-rose-400 leading-none">22</h3>
             </div>
             <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-rose-500/30 shadow-2xl group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
             </div>
         </div>
      </div>

      <div className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-white/10 shadow-3xl">
        <div className="flex items-center justify-between mb-10">
           <h2 className="text-xl font-bold text-white uppercase tracking-widest px-1">Danh sách hồ sơ nhân sự</h2>
           <div className="flex items-center gap-4">
              <div className="relative group">
                 <input type="text" placeholder="Tìm kiếm..." className="bg-white/5 border border-white/10 rounded-2xl py-2.5 px-6 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all w-64" />
                 <svg className="absolute right-4 top-2.5 w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
           </div>
        </div>
        <div className="overflow-hidden">
           <EmployeeTable />
        </div>
      </div>

      {showImport && <ImportExcelModal onClose={() => setShowImport(false)} onSuccess={() => window.location.reload()} />}
      {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} onSuccess={() => window.location.reload()} />}
    </div>
  );
}
