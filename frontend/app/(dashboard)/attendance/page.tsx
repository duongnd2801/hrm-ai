'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { Attendance, AttendanceSummary, TeamMatrix, CompanyConfig } from '@/types';
import Toast, { ToastState } from '@/components/Toast';
import Avatar from '@/components/Avatar';
import { ChevronLeft, ChevronRight, Eye, Table as TableIcon, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import ImportMachineModal from './components/ImportMachineModal';
import { formatDate, formatTime } from '@/lib/utils';

type AttendanceStatus = Attendance['status'];

const statusColorMap: Record<AttendanceStatus, string> = {
  PENDING: 'bg-slate-200 dark:bg-white/10 text-slate-400',
  ON_TIME: 'bg-emerald-500 text-white',
  LATE: 'bg-amber-500 text-white',
  INSUFFICIENT: 'bg-orange-500 text-white',
  ABSENT: 'bg-rose-500 text-white',
  APPROVED: 'bg-indigo-500 text-white',
  DAY_OFF: 'bg-slate-400/20 dark:bg-white/10 text-slate-500',
};

const statusLabelMap: Record<AttendanceStatus, string> = {
  PENDING: 'Đang chờ',
  ON_TIME: 'Đúng giờ',
  LATE: 'Đi muộn',
  INSUFFICIENT: 'Thiếu giờ',
  ABSENT: 'Vắng mặt',
  APPROVED: 'Đã duyệt',
  DAY_OFF: 'Ngày nghỉ',
};

export default function AttendancePage() {
  const { session } = useSession();
  const canView = session?.permissions.includes('ATT_VIEW') ?? false;
  const canImport = session?.permissions.includes('ATT_IMPORT') ?? false;
  const canSupervise = session?.permissions.includes('ATT_TEAM_VIEW') ?? false;
  const canExport = session?.permissions.includes('ATT_EXPORT') ?? false;

  const now = useMemo(() => new Date(), []);
  const [year] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [viewMode, setViewMode] = useState<'calendar' | 'supervision'>('calendar');
  
  const [myRecords, setMyRecords] = useState<Attendance[]>([]);
  const [teamSummary, setTeamSummary] = useState<AttendanceSummary[]>([]);
  const [selectedUserMatrix, setSelectedUserMatrix] = useState<{name: string, dept: string, records: Attendance[]} | null>(null);
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = [
        api.get<Attendance[]>('/api/attendance/my', { params: { year } }),
        api.get<CompanyConfig>('/api/company/config')
      ];
      const [attendanceRes, configRes] = await Promise.all(endpoints);
      setMyRecords(attendanceRes.data ?? []);
      setConfig(configRes.data);
    } catch {
      pushToast('error', 'Không thể tải dữ liệu chấm công.');
    } finally {
      setLoading(false);
    }
  }, [year]);

  const fetchTeamSummary = useCallback(async () => {
    if (!canSupervise) return;
    setLoading(true);
    try {
      const res = await api.get<AttendanceSummary[]>('/api/attendance/summary', { params: { month, year } });
      setTeamSummary(res.data ?? []);
    } catch {
      pushToast('error', 'Không thể tải thống kê đội ngũ.');
    } finally {
      setLoading(false);
    }
  }, [canSupervise, month, year]);

  const fetchUserMatrix = async (empId: string, name: string, dept: string) => {
    setLoading(true);
    try {
        const res = await api.get<Attendance[]>(`/api/attendance/${empId}`, { params: { year } });
        setSelectedUserMatrix({ name, dept, records: res.data ?? [] });
    } catch {
        pushToast('error', 'Lỗi khi tải ma trận chấm công.');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (session && canView) {
      if (viewMode === 'calendar') {
        void fetchData();
      } else if (!selectedUserMatrix) {
        void fetchTeamSummary();
      }
    }
  }, [session, canView, viewMode, fetchData, fetchTeamSummary, selectedUserMatrix]);

  const handleExport = async () => {
    try {
      const response = await api.get('/api/attendance/export', { 
        params: { month, year },
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bang_cham_cong_${month}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      pushToast('error', 'Lỗi khi xuất file Excel.');
    }
  };

  const renderMatrixRecords = (recordsList: Attendance[], title?: string) => {
    const byDateMap = new Map<string, Attendance>();
    recordsList.forEach((r) => byDateMap.set(r.date, r));

    return (
      <div className="bg-white/95 dark:bg-black/40 backdrop-blur-3xl rounded-[40px] p-6 lg:p-10 border border-white dark:border-white/5 relative overflow-x-auto shadow-xl dark:shadow-2xl">
        <div className="min-w-[1000px]">
          <div className="flex gap-2 ml-24 mb-8">
            {Array.from({ length: 31 }, (_, i) => (
              <div key={i} className="w-5 flex justify-center text-[12px] font-black text-slate-400 dark:text-white/30 tabular-nums uppercase">
                {i + 1}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {Array.from({ length: 12 }, (_, monthIdx) => (
              <div key={monthIdx} className="flex items-center gap-4 group/month">
                <div className="w-20 shrink-0">
                  <span className="text-[17px] font-black text-slate-900 dark:text-white uppercase tabular-nums tracking-tighter">
                    TH {monthIdx + 1}
                  </span>
                </div>
                
                <div className={`flex gap-2 p-1.5 rounded-[24px] transition-all bg-white/5`}>
                  {Array.from({ length: 31 }, (_, dayIdx) => {
                    const day = dayIdx + 1;
                    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const record = byDateMap.get(dateStr);
                    const validDay = day <= new Date(year, monthIdx + 1, 0).getDate();
                    const isWeekend = validDay && [0, 6].includes(new Date(year, monthIdx, day).getDay());

                    const cellColor = record ? statusColorMap[record.status] : (isWeekend ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-100 dark:bg-white/5 border-transparent');
                    
                    if (!validDay) return <div key={dayIdx} className="w-5 h-10 opacity-0 pointer-events-none" />;

                    return (
                      <div
                        key={dayIdx}
                        className={`w-5 h-10 rounded-full border flex items-center justify-center transition-all cursor-default grow-0 shrink-0 shadow-sm ${cellColor} hover:scale-110 relative group/cell`}
                        title={record ? `Ngày: ${formatDate(record.date)}\nTrạng thái: ${statusLabelMap[record.status]}\nVào: ${formatTime(record.checkIn)}\nRa: ${formatTime(record.checkOut)}\nTổng: ${record.totalHours || 0}h` : (isWeekend ? `Cuối tuần (${day}/${monthIdx+1})` : `Ngày ${day}/${monthIdx+1}: Chưa có dữ liệu`)}
                      >
                        {!record && validDay && <div className={`w-1.5 h-1.5 rounded-full ${isWeekend ? 'bg-rose-500/40' : 'bg-slate-300 dark:bg-white/20'}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-10 items-center">
            {Object.keys(statusLabelMap).map(k => (
              <div key={k} className="flex items-center gap-3">
                  <div className={`w-3 h-8 rounded-full ${statusColorMap[k as AttendanceStatus]}`} />
                  <span className="text-[11px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">{statusLabelMap[k as AttendanceStatus]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!session) return null;
  if (!canView) return <div className="py-20 text-center font-black uppercase text-white/30 tracking-widest">Không có quyền truy cập.</div>;

  const currentMonthRecords = myRecords.filter(r => new Date(r.date).getMonth() + 1 === month);
  const totalCông = currentMonthRecords.reduce((acc, r) => {
    if (['ON_TIME','LATE','APPROVED'].includes(r.status)) return acc + 1;
    if (r.status === 'INSUFFICIENT' && config && r.totalHours) return acc + (r.totalHours / config.standardHours);
    return acc;
  }, 0);
  const totalMuộn = currentMonthRecords.filter(r => r.status === 'LATE').length;

  return (
    <div className="space-y-8 pb-20 px-2 lg:px-6">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
      
      {showImport && (
        <ImportMachineModal 
          onClose={() => setShowImport(false)} 
          onSuccess={() => {
            pushToast('success', 'Import thành công!');
            if (viewMode === 'calendar') fetchData(); else fetchTeamSummary();
          }}
        />
      )}

      {/* Title & Buttons Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between pt-16 gap-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase leading-[0.9] tracking-tighter mix-blend-overlay" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
            CHẤM CÔNG
          </h1>
          <p className="text-[14px] font-black uppercase tracking-[0.5em] mt-10 text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            HỆ THỐNG QUẢN TRỊ CHUYÊN CẦN {year}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
            {canSupervise && (
              <button 
                onClick={() => {
                  if (viewMode === 'calendar') setViewMode('supervision');
                  else { setViewMode('calendar'); setSelectedUserMatrix(null); }
                }}
                className={`px-10 py-5 rounded-[24px] text-[12px] font-black uppercase tracking-[0.2em] transition-all bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-xl shadow-2xl`}
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
              >
                {viewMode === 'calendar' ? 'Quản lý thành viên' : 'Lịch cá nhân'}
              </button>
            )}
            {canExport && viewMode === 'supervision' && (
              <button 
                onClick={handleExport}
                className="px-10 py-5 rounded-[24px] text-[12px] font-black uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_10px_40px_rgba(16,185,129,0.3)] transition-all active:scale-95"
              >
                Xuất Excel
              </button>
            )}
            {canImport && (
              <button 
                onClick={() => setShowImport(true)}
                className="px-10 py-5 rounded-[24px] text-[12px] font-black uppercase tracking-[0.2em] bg-[#FF7A00] hover:bg-[#FF8A00] text-white shadow-[0_10px_40px_rgba(255,122,0,0.3)] transition-all active:scale-95"
              >
                Import dữ liệu
              </button>
            )}
        </div>
      </div>

      {/* Stats Cards for Supervision */}
      {viewMode === 'supervision' && !selectedUserMatrix && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="bg-white/80 dark:bg-black/30 backdrop-blur-xl p-8 rounded-[40px] border border-white dark:border-white/5 shadow-xl dark:shadow-2xl">
               <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest block mb-6">Thành viên</span>
               <p className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">{teamSummary.length}</p>
               <p className="text-[9px] font-bold text-slate-300 dark:text-white/10 uppercase tracking-widest mt-4">Tổng số nhân sự</p>
           </div>
           <div className="bg-white/80 dark:bg-black/30 backdrop-blur-xl p-8 rounded-[40px] border border-white dark:border-white/5 shadow-xl dark:shadow-2xl">
               <span className="text-[10px] font-black text-indigo-500/60 dark:text-indigo-400 uppercase tracking-widest block mb-6">Tổng công</span>
               <p className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                 {teamSummary.reduce((acc, r) => acc + r.totalWorkDays, 0).toFixed(1)}
               </p>
               <p className="text-[9px] font-bold text-indigo-600/30 dark:text-indigo-400/30 uppercase tracking-widest mt-4">Số công thực tế cả team</p>
           </div>
           <div className="bg-white/80 dark:bg-black/30 backdrop-blur-xl p-8 rounded-[40px] border border-white dark:border-white/5 shadow-xl dark:shadow-2xl">
               <span className="text-[10px] font-black text-amber-600/60 dark:text-amber-500 uppercase tracking-widest block mb-6">Đi muộn</span>
               <p className="text-5xl font-black text-amber-600 dark:text-amber-500 tabular-nums">
                 {teamSummary.reduce((acc, r) => acc + r.lateCount, 0)}
               </p>
               <p className="text-[9px] font-bold text-amber-600/30 dark:text-amber-500/30 uppercase tracking-widest mt-4">Tổng số buổi đi muộn</p>
           </div>
           <div className="bg-white/80 dark:bg-black/30 backdrop-blur-xl p-8 rounded-[40px] border border-white dark:border-white/5 shadow-xl dark:shadow-2xl">
               <span className="text-[10px] font-black text-rose-500/60 dark:text-rose-500 uppercase tracking-widest block mb-6">Vắng mặt</span>
               <p className="text-5xl font-black text-rose-600 dark:text-rose-500 tabular-nums">
                  {teamSummary.reduce((acc, r) => acc + r.absentCount, 0)}
               </p>
               <p className="text-[9px] font-bold text-rose-600/30 dark:text-rose-500/30 uppercase tracking-widest mt-4">Dựa trên lịch nghỉ & vắng</p>
           </div>
        </div>
      )}

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-1000">
          <div className="lg:col-span-9 space-y-8">
            {renderMatrixRecords(myRecords)}
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white/80 dark:bg-black/40 backdrop-blur-3xl rounded-[40px] p-10 border border-white dark:border-white/5 shadow-xl dark:shadow-2xl h-full flex flex-col justify-between">
               <div>
                  <div className="flex justify-between items-center mb-10">
                     <span className="text-[12px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.3em] font-sans">THÁNG {month}</span>
                     <div className="px-5 py-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">
                       ỔN ĐỊNH
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-10">
                     <div className="aspect-square bg-slate-100 dark:bg-white/5 rounded-[40px] border border-black/5 dark:border-white/10 flex flex-col items-center justify-center p-4">
                        <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.1em] mb-2 font-sans">Ngày công</span>
                        <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">{totalCông.toFixed(0)}</span>
                     </div>
                     <div className="aspect-square bg-white/5 rounded-[40px] border border-white/10 flex flex-col items-center justify-center p-4">
                        <span className="text-[10px] font-black text-[#FF7A00]/60 uppercase tracking-[0.1em] mb-2 font-sans">Muộn</span>
                        <span className="text-5xl font-black text-[#FF7A00] tabular-nums">{totalMuộn}</span>
                     </div>
                  </div>
               </div>

               <div className="p-8 rounded-[40px] bg-slate-50 dark:bg-white/[0.03] border border-dashed border-slate-300 dark:border-white/10 shadow-inner">
                  <p className="text-[12px] font-medium text-slate-400 dark:text-white/30 leading-relaxed italic text-center">
                    Lưu ý: Hãy gửi giải trình muộn trước ngày cất lương 10 hàng tháng. Chuyên cần của bạn đang ở mức rất tốt.
                  </p>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
            {selectedUserMatrix ? (
               <div className="space-y-8">
                  <div className="flex items-center justify-between p-10 bg-black/20 backdrop-blur-3xl rounded-[40px] border border-white/5">
                     <div className="flex items-center gap-10">
                        <Avatar name={selectedUserMatrix.name} size="xl" />
                        <div>
                           <h2 className="text-5xl font-black text-white uppercase tracking-tighter">{selectedUserMatrix.name}</h2>
                           <p className="text-[12px] font-black text-indigo-500 uppercase tracking-[0.5em] mt-4">{selectedUserMatrix.dept} — MA TRẬN CHUYÊN CẦN</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedUserMatrix(null)} className="px-10 py-5 bg-white/10 text-white text-[12px] font-black rounded-2xl uppercase tracking-widest hover:bg-white/20 transition-all">
                       Quay lại
                     </button>
                  </div>
                  {renderMatrixRecords(selectedUserMatrix.records)}
               </div>
            ) : (
                 <div className="bg-white/80 dark:bg-black/20 backdrop-blur-3xl rounded-[40px] p-12 border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-2xl">
                   <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 p-2 rounded-[24px] border border-black/5 dark:border-white/10">
                           <button onClick={() => setMonth(m => m > 1 ? m - 1 : 12)} className="w-12 h-12 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all text-slate-400 dark:text-white/50"><ChevronLeft size={24}/></button>
                           <span className="px-8 text-[15px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Tháng {month}</span>
                           <button onClick={() => setMonth(m => m < 12 ? m + 1 : 1)} className="w-12 h-12 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all text-slate-400 dark:text-white/50"><ChevronRight size={24}/></button>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">Tổng nhân sự</p>
                              <p className="text-3xl font-black text-slate-900 dark:text-white">{teamSummary.length}</p>
                           </div>
                        </div>
                   </div>

                   <div className="overflow-x-auto min-h-[1200px]">
                     <table className="w-full text-left border-collapse">
                       <thead className="text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/70 font-black border-b border-black/5 dark:border-white/10 sticky top-0 z-20 backdrop-blur-md">
                         <tr>
                           <th className="px-6 py-5">Nhân viên</th>
                           <th className="px-6 py-5 text-center">Công thực tế</th>
                           <th className="px-6 py-5 text-center">Trễ</th>
                           <th className="px-6 py-5 text-center">Thiếu giờ</th>
                           <th className="px-6 py-5 text-center">Vắng</th>
                           <th className="px-6 py-5 text-right">Tác vụ</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-black/5 dark:divide-white/5">
                         {teamSummary.length === 0 ? (
                           <tr><td colSpan={6} className="py-40 text-center text-slate-300 dark:text-white/10 font-black uppercase tracking-[1em] italic">Đang tải dữ liệu...</td></tr>
                         ) : (
                           teamSummary.map((row) => (
                             <tr key={row.employeeId} className="group/row hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all duration-200">
                               <td className="px-6 py-5">
                                  <div className="flex items-center gap-4">
                                     <Avatar name={row.employeeName} size="sm" />
                                     <div className="flex flex-col">
                                        <span className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">{row.employeeName}</span>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">{row.departmentName}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-5 text-center font-bold text-indigo-600 dark:text-indigo-400 text-lg tabular-nums">
                                 {row.totalWorkDays.toFixed(2)}
                               </td>
                               <td className="px-6 py-5 text-center font-bold text-amber-600 dark:text-amber-500 text-lg tabular-nums">{row.lateCount}</td>
                               <td className="px-6 py-5 text-center font-bold text-orange-600 dark:text-orange-500 text-lg tabular-nums">{row.insufficientCount}</td>
                               <td className="px-6 py-5 text-center font-bold text-rose-600 dark:text-rose-500 text-lg tabular-nums">{row.absentCount}</td>
                               <td className="px-6 py-5 text-right">
                                  <button 
                                    onClick={() => fetchUserMatrix(row.employeeId, row.employeeName, row.departmentName)}
                                    className="px-4 py-2 bg-indigo-500/10 dark:bg-white/10 text-indigo-600 dark:text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-90"
                                  >
                                    Chi tiết
                                  </button>
                               </td>
                             </tr>
                           ))
                         )}
                       </tbody>
                     </table>
                   </div>
                 </div>
            )}
        </div>
      )}
    </div>
  );
}
