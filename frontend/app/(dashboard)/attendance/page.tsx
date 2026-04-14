'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { Attendance, AttendanceSummary, DashboardSummary } from '@/types';
import Toast, { ToastState } from '@/components/Toast';
import Avatar from '@/components/Avatar';
import { Eye, ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';
import ImportMachineModal from './components/ImportMachineModal';

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

  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth() + 1;
  const [year] = useState(now.getFullYear());
  const [month, setMonth] = useState(currentMonth);
  const [viewMode, setViewMode] = useState<'calendar' | 'supervision'>('calendar');
  
  const [myRecords, setMyRecords] = useState<Attendance[]>([]);
  const [teamSummary, setTeamSummary] = useState<AttendanceSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<AttendanceSummary | null>(null);
  const [employeeRecords, setEmployeeRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  const fetchMyData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = [
        api.get<Attendance[]>('/api/attendance/my', { params: { year } }),
        api.get<DashboardSummary>('/api/dashboard/summary'),
      ];
      const [attendanceRes, summaryRes] = await Promise.all(endpoints);
      setMyRecords(attendanceRes.data ?? []);
      setSummary(summaryRes.data);
    } catch {
      pushToast('error', 'Không thể tải dữ liệu chấm công cá nhân.');
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

  const fetchEmployeeDetails = useCallback(async (sum: AttendanceSummary) => {
    setLoading(true);
    setSelectedUser(sum);
    try {
      const res = await api.get<Attendance[]>(`/api/attendance/${sum.employeeId}`, { params: { year } });
      setEmployeeRecords(res.data ?? []);
    } catch {
      pushToast('error', `Không thể tải lịch công của ${sum.employeeName}`);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    if (session && canView) {
      if (viewMode === 'calendar') {
        void fetchMyData();
      } else if (!selectedUser) {
        void fetchTeamSummary();
      }
    }
  }, [session, canView, viewMode, fetchMyData, fetchTeamSummary, selectedUser]);

  const renderMatrix = (recordsList: Attendance[]) => {
    const byDateMap = new Map<string, Attendance>();
    recordsList.forEach((r) => byDateMap.set(r.date, r));

    return (
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[40px] p-6 lg:p-10 border border-black/5 dark:border-white/5 relative overflow-x-auto shadow-2xl">
        <div className="min-w-[1000px]">
          <div className="flex gap-2 ml-24 mb-8">
            {Array.from({ length: 31 }, (_, i) => (
              <div key={i} className="w-5 flex justify-center text-[13px] font-black text-slate-400 dark:text-white/40 tabular-nums uppercase">
                {i + 1}
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            {Array.from({ length: 12 }, (_, monthIdx) => (
              <div key={monthIdx} className="flex items-center gap-4 group/month">
                <div className="w-20 shrink-0">
                  <span className="text-[17px] font-black text-slate-900 dark:text-white uppercase tabular-nums tracking-tighter">
                    TH {monthIdx + 1}
                  </span>
                </div>
                
                <div className={`flex gap-2 p-1.5 rounded-[20px] transition-all ${monthIdx + 1 === month ? 'bg-indigo-500/10 dark:bg-indigo-500/30 border border-indigo-500/20 dark:border-indigo-500/40' : 'bg-black/5 dark:bg-white/10'}`}>
                  {Array.from({ length: 31 }, (_, dayIdx) => {
                    const day = dayIdx + 1;
                    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const record = byDateMap.get(dateStr);
                    const isToday = dateStr === now.toISOString().split('T')[0];
                    const validDay = day <= new Date(year, monthIdx + 1, 0).getDate();
                    const isWeekend = validDay && [0, 6].includes(new Date(year, monthIdx, day).getDay());

                    let tooltip = record ? `${record.date}: ${statusLabelMap[record.status]}` : '';
                    if (record) {
                      const ci = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                      const co = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                      tooltip += ` (${ci} → ${co})`;
                    }
                    
                    const isCurrentSession = record && !record.checkOut && isToday;
                    const cellColor = record ? statusColorMap[record.status] : (isWeekend ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/10 dark:border-rose-500/20' : 'bg-black/5 dark:bg-white/5 border-transparent');
                    
                    if (!validDay) return <div key={dayIdx} className="w-5 h-9 opacity-0 pointer-events-none" />;

                    return (
                      <div
                        key={dayIdx}
                        title={tooltip}
                        className={`w-5 h-9 rounded-full border flex items-center justify-center transition-all cursor-default grow-0 shrink-0 shadow-sm ${cellColor} ${isCurrentSession ? 'ring-2 ring-indigo-500 animate-pulse' : 'hover:scale-110 active:scale-95'}`}
                      >
                        {isCurrentSession && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                        {!record && validDay && <div className={`w-1 h-1 rounded-full ${isWeekend ? 'bg-rose-500/20 dark:bg-rose-500/40' : 'bg-black/10 dark:bg-white/30'}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-8 items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">Ghi chú trạng thái:</span>
            {Object.keys(statusLabelMap).map(k => (
              <div key={k} className="flex items-center gap-2.5 group/leg">
                  <div className={`w-3 h-6 rounded-full ${statusColorMap[k as AttendanceStatus]}`} />
                  <span className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest leading-none group-hover/leg:text-indigo-500 transition-colors">{statusLabelMap[k as AttendanceStatus]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!session) return null;
  if (!canView) return <div className="py-20 text-center font-black uppercase text-white/30 tracking-widest">Không có quyền truy cập.</div>;

  return (
    <div className="space-y-8 pb-20 px-2 lg:px-6">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
      
      {showImport && (
        <ImportMachineModal 
          onClose={() => setShowImport(false)} 
          onSuccess={() => {
            pushToast('success', 'Import dữ liệu thành công!');
            if (viewMode === 'calendar') fetchMyData(); else fetchTeamSummary();
          }}
        />
      )}

      {/* Hero Section - Synced with Payroll style */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between pt-10 gap-8">
        <div>
          <h1 className="text-6xl md:text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-none" style={{ textShadow: '0 2px 15px rgba(0,0,0,0.4)' }}>
            Lịch chấm công
          </h1>
          <p className="text-lg font-bold uppercase tracking-[0.3em] mt-6 ml-1 text-white/90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
             Hệ thống quản trị chuyên cần {year}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-2xl p-3 rounded-[32px] border border-white/10 shadow-2xl">
            {canSupervise && (
              <button 
                onClick={() => {
                  if (viewMode === 'calendar') setViewMode('supervision');
                  else { setViewMode('calendar'); setSelectedUser(null); }
                }}
                className={`px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'supervision' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
              >
                {viewMode === 'calendar' ? 'QUẢN LÝ THÀNH VIÊN' : 'XEM CÁ NHÂN'}
              </button>
            )}
            {canImport && (
              <button 
                onClick={() => setShowImport(true)}
                className="px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-400 text-white shadow-xl shadow-amber-500/40 transition-all active:scale-95"
              >
                IMPORT DỮ LIỆU
              </button>
            )}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-700">
          <div className="lg:col-span-9 space-y-8 min-w-0">
            {renderMatrix(myRecords)}
          </div>

          <div className="lg:col-span-3 space-y-6">
            {/* KPI STATS CARD */}
            <div className="bg-white/90 dark:bg-black/25 backdrop-blur-3xl rounded-[40px] p-8 lg:p-10 border border-black/5 dark:border-white/10 shadow-2xl flex flex-col gap-10 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 blur-[60px] rounded-full" />
               
               <div className="relative z-10 flex justify-between items-center">
                  <span className="text-[11px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.3em]">THÁNG {month}</span>
                  <div className="px-4 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-xl border border-emerald-500/20">
                    ỔN ĐỊNH
                  </div>
               </div>

               <div className="relative z-10 grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[32px] border border-black/5 dark:border-white/5 flex flex-col items-center">
                     <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-2">Ngày công</span>
                     <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{myRecords.filter(r => ['ON_TIME','LATE','INSUFFICIENT','APPROVED'].includes(r.status)).length}</span>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[32px] border border-black/5 dark:border-white/5 flex flex-col items-center">
                     <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Muộn</span>
                     <span className="text-4xl font-black text-amber-500 tabular-nums">{myRecords.filter(r => r.status === 'LATE').length}</span>
                  </div>
               </div>

               <p className="relative z-10 text-[11px] font-bold text-slate-500 dark:text-white/30 leading-relaxed italic text-justify bg-black/5 dark:bg-white/5 p-6 rounded-[24px] border border-dashed border-black/10 dark:border-white/10">
                 Lưu ý: Hãy gửi giải trình muộn trước ngày cắt lương 10 hàng tháng. Chuyên cần của bạn đang ở mức rất tốt.
               </p>
            </div>

            <div className="bg-white/90 dark:bg-black/25 backdrop-blur-3xl rounded-[40px] p-8 lg:p-10 border border-black/5 dark:border-white/10 shadow-2xl">
                <h3 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                  QUY ĐỊNH CHẤM CÔNG
                </h3>
                <div className="space-y-6">
                   <div className="flex items-center gap-5 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500/60 uppercase tracking-widest mb-0.5">CHECK-IN SÁNG</span>
                        <span className="text-[17px] font-black text-slate-900 dark:text-white tabular-nums">09:00 AM</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-5 p-5 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-rose-600 dark:text-rose-500/60 uppercase tracking-widest mb-0.5">CHECK-OUT CHIỀU</span>
                        <span className="text-[17px] font-black text-slate-900 dark:text-white tabular-nums">06:00 PM</span>
                      </div>
                   </div>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
          {selectedUser ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/10 shadow-xl mb-8">
                <div className="flex items-center gap-6">
                  <Avatar name={selectedUser.employeeName} size="xl" />
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">{selectedUser.employeeName}</h2>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{selectedUser.departmentName} • Chi tiết chuyên cần</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10"
                >
                  <ChevronLeft size={16} /> Quay lại danh sách
                </button>
              </div>
              {renderMatrix(employeeRecords)}
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-widest px-1">
                    Quản lý thành viên
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.4em] mt-3 ml-1 text-justify">Dữ liệu chi tiết tháng {month}/{year}</p>
                </div>
                <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-2 rounded-3xl border border-black/5 dark:border-white/5 shadow-inner">
                  <button onClick={() => setMonth(m => m > 1 ? m - 1 : 12)} className="p-4 hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-2xl transition-all active:scale-90 shadow-md"><ChevronLeft size={20}/></button>
                  <div className="px-8 flex flex-col items-center">
                    <span className="text-[12px] font-black tabular-nums tracking-widest text-slate-700 dark:text-white">THÁNG {String(month).padStart(2, '0')}</span>
                  </div>
                  <button onClick={() => setMonth(m => m < 12 ? m + 1 : 1)} className="p-4 hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-2xl transition-all active:scale-90 shadow-md"><ChevronRight size={20}/></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="text-[11px] uppercase tracking-[0.2em] bg-white/90 dark:bg-black/20 text-slate-600 dark:text-white/70 font-black border-b border-black/5 dark:border-white/5 sticky top-0 z-20 backdrop-blur-md">
                    <tr>
                      <th className="px-12 py-8">Thành viên</th>
                      <th className="px-12 py-8 text-center">Tổng công</th>
                      <th className="px-12 py-8 text-center">Muộn</th>
                      <th className="px-12 py-8 text-center">Vắng</th>
                      <th className="px-12 py-8 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {teamSummary.length === 0 ? (
                      <tr><td colSpan={5} className="py-24 text-center text-slate-300 dark:text-white/10 font-black uppercase tracking-[0.5em] italic">Không có dữ liệu tháng này</td></tr>
                    ) : (
                      teamSummary.map((row) => (
                        <tr key={row.employeeId} className="group/row hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer">
                          <td className="px-12 py-7">
                            <div className="flex items-center gap-6 group-hover/row:translate-x-2 transition-transform duration-500">
                              <Avatar name={row.employeeName} size="lg" />
                              <div className="flex flex-col">
                                <span className="text-[16px] font-black text-slate-900 dark:text-white group-hover/row:text-indigo-500 dark:group-hover/row:text-indigo-400 transition-all duration-300 uppercase tracking-tight">{row.employeeName}</span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest mt-1 opacity-60 group-hover/row:opacity-100 transition-opacity whitespace-nowrap">{row.departmentName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-12 py-7 text-center font-black text-emerald-500 dark:text-emerald-400 tabular-nums text-3xl">{row.totalWorkDays}</td>
                          <td className="px-12 py-7 text-center font-black text-amber-500 tabular-nums text-3xl">{row.lateCount}</td>
                          <td className="px-12 py-7 text-center font-black text-rose-500 tabular-nums text-3xl">{row.absentCount}</td>
                          <td className="px-12 py-7 text-right">
                            <button 
                              onClick={() => fetchEmployeeDetails(row)}
                              className="px-10 py-3 bg-indigo-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-xl dark:shadow-2xl shadow-indigo-600/20 dark:shadow-indigo-600/30 hover:scale-110 active:scale-95 transition-all"
                            >
                              Xem lịch
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
