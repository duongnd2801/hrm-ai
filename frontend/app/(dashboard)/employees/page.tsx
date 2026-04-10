'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { useSession } from '@/components/AuthProvider';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<{total: number, active: number, absent: number}>({ total: 0, active: 0, absent: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = useEffectEvent(async () => {
    try {
      const res = await api.get('/api/employees/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Stats load failed:', err);
      setStats({ total: 0, active: 0, absent: 0 });
    }
  });

  useEffect(() => {
    void fetchStats();
  }, [refreshKey]);

  if (!session) return null;
  const canView = session.permissions.includes('EMP_VIEW');
  const canCreate = session.permissions.includes('EMP_CREATE');
  const canImport = session.permissions.includes('EMP_IMPORT');
  const canExport = session.permissions.includes('EMP_EXPORT');

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  async function handleExport() {
    if (!canExport) {
      pushToast('error', 'Bạn không có quyền xuất dữ liệu nhân viên.');
      return;
    }
    try {
      const res = await api.get('/api/employees/export', { responseType: 'blob' });
      // D24: Validate blob response before download
      if (!res.data || res.data.size === 0) {
        pushToast('error', 'Tệp xuất thất bại hoặc trống.');
        return;
      }
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

      {!canView ? (
        <div className="text-rose-400 p-20 text-center font-black uppercase tracking-widest">Bạn không có quyền xem danh sách nhân viên.</div>
      ) : (
        <>

      {/* Main Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pt-10">
         <div>
            <h1 className="text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Nhân viên</h1>
            <p className="text-lg font-bold text-white dark:text-white/40 uppercase tracking-widest mt-6 ml-1" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Cơ sở dữ liệu nhân sự công ty</p>
         </div>

         {(canCreate || canImport || canExport) && (
            <div className="flex items-center gap-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl dark:shadow-2xl mt-6 md:mt-0 px-4 py-3">
               {canCreate && (
                 <button
                    onClick={() => setShowCreate(true)}
                    className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-black tracking-widest transition-all shadow-lg active:scale-95"
                 >
                    THÊM MỚI
                 </button>
               )}
               {canImport && (
                 <button
                    onClick={() => setShowImport(true)}
                    className="px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black tracking-widest transition-all active:scale-95"
                 >
                    NHẬP EXCEL
                 </button>
               )}
               {canExport && (
                 <button
                    onClick={handleExport}
                    className="p-2.5 bg-white/80 dark:bg-transparent text-slate-400 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5 rounded-xl transition-all"
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                 </button>
               )}
            </div>
         )}
      </div>

      {/* Stats Quick View Cards - Premium Design */}
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
         {/* Total Employees Card */}
         <div className="relative group min-w-[320px] rounded-[40px] overflow-hidden">
            {/* Gradient backgrounds */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-[40px] opacity-0 group-hover:opacity-20 blur-lg transition-all duration-500" />
            
            <div className="relative background bg-gradient-to-br from-white/90 via-white/70 to-indigo-50 dark:from-white/10 dark:via-indigo-500/10 dark:to-purple-500/10 backdrop-blur-2xl border border-white/40 dark:border-indigo-500/20 p-8 shadow-xl dark:shadow-2xl group-hover:shadow-2xl dark:group-hover:shadow-indigo-500/30 group-hover:border-indigo-500/40 transition-all duration-300 h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-500 dark:text-white/50 uppercase tracking-widest mb-3">👥 Toàn công ty</p>
                    <h3 className="text-5xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</h3>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 group-hover:shadow-indigo-500/60 group-hover:scale-110 transition-all duration-300 group-hover:-translate-y-1">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
                  <p className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Nhân viên đang làm việc</p>
                </div>
            </div>
         </div>

         {/* Active Employees Card */}
         <div className="relative group min-w-[320px] rounded-[40px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-[40px] opacity-0 group-hover:opacity-20 blur-lg transition-all duration-500" />
            
            <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-emerald-50 dark:from-white/10 dark:via-emerald-500/10 dark:to-teal-500/10 backdrop-blur-2xl border border-white/40 dark:border-emerald-500/20 p-8 shadow-xl dark:shadow-2xl group-hover:shadow-2xl dark:group-hover:shadow-emerald-500/30 group-hover:border-emerald-500/40 transition-all duration-300 h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-500 dark:text-white/50 uppercase tracking-widest mb-3">✅ Hoạt động</p>
                    <h3 className="text-5xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.active}</h3>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 group-hover:shadow-emerald-500/60 group-hover:scale-110 transition-all duration-300 group-hover:-translate-y-1">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
                  <p className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Có thể làm việc</p>
                </div>
            </div>
         </div>

         {/* Absent/Leave Card */}
         <div className="relative group min-w-[320px] rounded-[40px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/30 via-red-500/20 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-1 bg-gradient-to-br from-rose-400 via-red-400 to-orange-400 rounded-[40px] opacity-0 group-hover:opacity-20 blur-lg transition-all duration-500" />
            
            <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-rose-50 dark:from-white/10 dark:via-rose-500/10 dark:to-red-500/10 backdrop-blur-2xl border border-white/40 dark:border-rose-500/20 p-8 shadow-xl dark:shadow-2xl group-hover:shadow-2xl dark:group-hover:shadow-rose-500/30 group-hover:border-rose-500/40 transition-all duration-300 h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-500 dark:text-white/50 uppercase tracking-widest mb-3">📋 Nghỉ/Vắng</p>
                    <h3 className="text-5xl font-black text-rose-600 dark:text-rose-400 leading-none">{stats.absent}</h3>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-rose-400 via-red-400 to-orange-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-500/40 group-hover:shadow-rose-500/60 group-hover:scale-110 transition-all duration-300 group-hover:-translate-y-1">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v3.5a4 4 0 100 8H10" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
                  <p className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Nghỉ phép hoặc vắng mặt</p>
                </div>
            </div>
         </div>
      </div>

      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
        <div className="flex items-center justify-between mb-10">
           <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-widest px-1">Danh sách hồ sơ nhân sự</h2>
           <div className="flex items-center gap-4">
              <div className="relative group">
                 <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-2.5 px-6 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-900/10 dark:focus:bg-white/10 transition-all w-64 shadow-inner" />
                 <svg className="absolute right-4 top-2.5 w-5 h-5 text-slate-400 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
           </div>
        </div>
        <div className="overflow-x-auto">
           <EmployeeTable search={searchQuery} refreshKey={refreshKey} />
        </div>
      </div>

      {showImport && canImport && <ImportExcelModal onClose={() => setShowImport(false)} onSuccess={triggerRefresh} />}
      {showCreate && canCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} onSuccess={triggerRefresh} />}
        </>
      )}
    </div>
  );
}
