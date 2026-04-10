'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { Attendance, DashboardSummary } from '@/types';
import Toast, { ToastState } from '@/components/Toast';

type AttendanceStatus = Attendance['status'];

const statusColorMap: Record<AttendanceStatus, string> = {
  PENDING: 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400 dark:text-white/40',
  ON_TIME: 'bg-emerald-500 border-emerald-400/30 text-emerald-950',
  LATE: 'bg-amber-500 border-amber-400/30 text-amber-950',
  INSUFFICIENT: 'bg-orange-500 border-orange-400/30 text-orange-950',
  ABSENT: 'bg-rose-500 border-rose-400/30 text-white',
  APPROVED: 'bg-indigo-500 border-indigo-400/30 text-white',
  DAY_OFF: 'bg-slate-200 dark:bg-white/10 border-black/10 dark:border-white/10 text-slate-500 dark:text-white/30',
};

const statusLabelMap: Record<AttendanceStatus, string> = {
  PENDING: 'Đang chờ',
  ON_TIME: 'Đúng giờ',
  LATE: 'Đi muộn',
  INSUFFICIENT: 'Thiếu giờ',
  ABSENT: 'Vắng',
  APPROVED: 'Được duyệt',
  DAY_OFF: 'Ngày nghỉ',
};

export default function AttendancePage() {
  const { session } = useSession();
  const canView = session?.permissions.includes('ATT_VIEW') ?? false;
  const now = useMemo(() => new Date(), []);
  const [year] = useState(now.getFullYear());
  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [attendanceRes, summaryRes] = await Promise.all([
        api.get<Attendance[]>('/api/attendance/my', { params: { year } }),
        api.get<DashboardSummary>('/api/dashboard/summary'),
      ]);
      setRecords(attendanceRes.data ?? []);
      setSummary(summaryRes.data);
    } catch {
      pushToast('error', 'Không thể tải dữ liệu chấm công.');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    if (session && canView) void fetchData();
  }, [session, fetchData]);

  const byDate = useMemo(() => {
    const map = new Map<string, Attendance>();
    records.forEach((record) => map.set(record.date, record));
    return map;
  }, [records]);

  if (!session) return null;
  if (!canView) {
    return (
      <div className="py-20 text-center text-slate-500 dark:text-white/40 font-black uppercase tracking-widest">
        Bạn không có quyền truy cập chấm công.
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 px-2 lg:px-6">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Main Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pt-10">
        <div>
          <h1 className="text-[clamp(3rem,8vw,6rem)] font-black text-white dark:text-white dark:mix-blend-overlay uppercase leading-none tracking-tighter" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Lịch công</h1>
          <p className="text-lg font-bold uppercase tracking-widest mt-6 ml-1" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Thời gian làm việc & Chuyên cần</p>
        </div>

        <div className="flex items-center gap-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl mt-8 md:mt-0">
          <Link
            href="/attendance"
            className="bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-900 px-8 py-3 rounded-xl text-sm font-black tracking-widest shadow-xl scale-105"
          >
            TỔNG QUAN
          </Link>
          <button className="px-8 py-3 rounded-xl text-sm font-black tracking-widest text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all">
             BÁO CÁO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Year Grid Section */}
        <div className="lg:col-span-8 bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl overflow-hidden">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-10 px-1 italic">Ma trận chuyên cần {year}</h2>

          <div className="space-y-3 overflow-x-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 pb-4">
            <div className="flex gap-1.5 ml-32 mb-4">
              {Array.from({ length: 31 }, (_, i) => (
                <div key={i} className="w-8 flex justify-center text-[10px] font-black text-slate-500 dark:text-white/20">{i + 1}</div>
              ))}
            </div>

            {Array.from({ length: 12 }, (_, monthIdx) => (
              <div key={monthIdx} className="flex items-center gap-1.5 group">
                <span className="w-32 text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase tracking-widest leading-none px-2 py-1 rounded">TH {monthIdx + 1}</span>
                {Array.from({ length: 31 }, (_, dayIdx) => {
                  const day = dayIdx + 1;
                  const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const record = byDate.get(dateStr);
                  const isToday = dateStr === now.toISOString().split('T')[0];
                  const status = record?.status || 'PENDING';
                  const validDay = day <= new Date(year, monthIdx + 1, 0).getDate();
                  const isWeekend = validDay && [0, 6].includes(new Date(year, monthIdx, day).getDay());

                  let tooltip = record ? `${record.date}: ${statusLabelMap[record.status]}` : '';
                  if (record) {
                    const ci = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                    const co = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                    tooltip += ` (${ci} → ${co})`;
                    if (record.totalHours) tooltip += ` | ${record.totalHours}h`;
                  }
                  
                  const isCurrentSession = record && !record.checkOut && isToday;
                  const dayBg = !validDay ? 'opacity-0' :
                    record ? `${statusColorMap[record.status]} shadow-lg ${isCurrentSession ? 'animate-pulse ring-2 ring-indigo-500' : ''}` :
                    isWeekend ? 'bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20' :
                    'bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-slate-900/10 dark:hover:bg-white/15';

                  return (
                    <div
                      key={dayIdx}
                      title={tooltip}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${dayBg}`}
                    >
                      {isCurrentSession && <div className="w-2 rounded-full bg-indigo-500 shadow-sm grow aspect-square" />}
                      {!record && validDay && <div className={`w-1.5 h-1.5 rounded-full ${isWeekend ? 'bg-rose-400/50' : 'bg-slate-400/30'}`} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-14 pt-10 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-6 text-slate-900 dark:text-white">
             {Object.keys(statusLabelMap).map(k => (
               <div key={k} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColorMap[k as AttendanceStatus]}`} />
                  <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">{statusLabelMap[k as AttendanceStatus]}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Sidebar Stats Section */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white/80 dark:bg-gradient-to-br dark:from-indigo-900/40 dark:to-indigo-800/20 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl text-slate-900 dark:text-white">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-8">Trạng thái hiện tại</h2>
            <div className="space-y-4">
               <div className="flex justify-between items-center p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase">Tháng {now.getMonth() + 1}</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 underline underline-offset-4 decoration-emerald-500/30">ỔN ĐỊNH</span>
               </div>
               <p className="text-slate-500 dark:text-white/40 text-xs leading-relaxed italic px-2">
                  Hãy gửi giải trình nếu bạn có ngày vắng mặt hoặc đi muộn không mong muốn trước ngày cắt lương {summary?.cutoffDay || 10} hàng tháng.
               </p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl text-slate-900 dark:text-white">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-8 px-1 italic">Quy định chấm công</h2>
            <ul className="space-y-6">
              <li className="flex gap-4 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <p className="text-sm font-bold text-slate-500 dark:text-white/40 leading-relaxed uppercase tracking-tighter">
                   Check-in sáng: <span className="text-slate-900 dark:text-white">09:00</span>
                </p>
              </li>
              <li className="flex gap-4 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <p className="text-sm font-bold text-slate-500 dark:text-white/40 leading-relaxed uppercase tracking-tighter">
                   Check-out chiều: <span className="text-slate-900 dark:text-white">18:00</span>
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
