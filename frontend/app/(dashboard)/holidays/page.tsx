'use client';

import { useMemo, useState, useEffect } from 'react';
import { Lunar } from 'lunar-typescript';
import api from '@/lib/api';
import Toast, { ToastState } from '@/components/Toast';
import { useSession } from '@/components/AuthProvider';

export type HolidayItem = {
  id?: string;
  name: string;
  date: string;       // BE returns date
  start?: string;     // For UI compatibility
  end?: string;
  note?: string;
  isPaidLeave?: boolean;
};

// Utilities for Lunar - Solar convertions
function getSolarString(lunarYear: number, lunarMonth: number, lunarDay: number) {
  const s = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay).getSolar();
  return `${s.getYear()}-${String(s.getMonth()).padStart(2, '0')}-${String(s.getDay()).padStart(2, '0')}`;
}

export function generateDefaultHolidays(year: number): HolidayItem[] {
  return [
    { date: `${year}-01-01`, start: `${year}-01-01`, name: "Tết Dương lịch", isPaidLeave: true },
    { date: getSolarString(year - 1, 12, 29), start: getSolarString(year - 1, 12, 29), name: "29 Tết", isPaidLeave: true },
    { date: getSolarString(year, 1, 1), start: getSolarString(year, 1, 1), name: "Mùng 1 Tết", isPaidLeave: true },
    { date: getSolarString(year, 1, 2), start: getSolarString(year, 1, 2), name: "Mùng 2 Tết", isPaidLeave: true },
    { date: getSolarString(year, 1, 3), start: getSolarString(year, 1, 3), name: "Mùng 3 Tết", isPaidLeave: true },
    { date: getSolarString(year, 1, 4), start: getSolarString(year, 1, 4), name: "Mùng 4 Tết", isPaidLeave: true },
    { date: getSolarString(year, 1, 5), start: getSolarString(year, 1, 5), name: "Mùng 5 Tết", isPaidLeave: true },
    { date: getSolarString(year, 3, 10), start: getSolarString(year, 3, 10), name: "Giỗ Tổ Hùng Vương", isPaidLeave: true },
    { date: `${year}-04-30`, start: `${year}-04-30`, name: "Giải phóng miền Nam", isPaidLeave: true },
    { date: `${year}-05-01`, start: `${year}-05-01`, name: "Quốc tế Lao động", isPaidLeave: true },
    { date: `${year}-09-02`, start: `${year}-09-02`, name: "Quốc khánh", isPaidLeave: true },
  ];
}

// Calendar utilities
function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

const WEEK_DAYS = ['TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7', 'CN'];

function MonthCalendar({ month, year, holidays, toggleHoliday, canManage }: { month: number; year: number; holidays: HolidayItem[], toggleHoliday: (d: string) => void, canManage: boolean }) {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  
  const cells = useMemo(() => {
    const list = [];
    for (let i = 0; i < firstDay; i++) list.push(null);
    for (let i = 1; i <= daysInMonth; i++) list.push(i);
    return list;
  }, [firstDay, daysInMonth]);

  const isHoliday = (dateStr: string) => {
    return holidays.some(h => {
       const start = h.date || h.start;
       if (!start) return false;
       const end = h.end || start;
       return dateStr >= start && dateStr <= end;
    });
  };

  const getHolidayName = (dateStr: string) => {
    const h = holidays.find(h => {
       const start = h.date || h.start;
       if (!start) return false;
       const end = h.end || start;
       return dateStr >= start && dateStr <= end;
    });
    return h?.name;
  };

  return (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-xl dark:shadow-2xl hover:bg-white dark:hover:bg-white/10 transition-all group">
      <h3 className="text-xl font-black text-slate-900 dark:text-white/90 mb-6 uppercase tracking-widest text-center">Tháng {month + 1}</h3>
      <div className="grid grid-cols-7 gap-1 text-[10px] font-black text-slate-400 dark:text-white uppercase tracking-tighter mb-4 text-center">
         {WEEK_DAYS.map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
         {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const holiday = isHoliday(dateStr);
            const holidayName = getHolidayName(dateStr);
            
            return (
               <div 
                 key={day} 
                 onClick={() => { if (canManage) toggleHoliday(dateStr); }}
                 title={holidayName}
                 className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative group/day ${
                    holiday ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105 z-10' : 'text-slate-900 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10'
                 } ${canManage ? 'cursor-pointer' : 'cursor-default'}`}
                 style={!holiday ? { textShadow: '0 1px 4px rgba(0,0,0,0.1)' } : {}}
               >
                  {day}
                  {holiday && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-600 text-[8px] font-black py-0.5 px-2 rounded-full border border-white/20 shadow-xl pointer-events-none hidden group-hover/day:block transition-all max-w-[80px] overflow-hidden truncate z-50">
                       {holidayName}
                    </div>
                  )}
               </div>
            );
         })}
      </div>
    </div>
  );
}

export default function HolidaysPage() {
  const { session } = useSession();
  const canManage = session?.permissions.includes('HOLIDAY_MANAGE') ?? false;

  const [year, setYear] = useState(new Date().getFullYear());
  const [tab, setTab] = useState<'calendar' | 'list'>('calendar');
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const showToast = (kind: ToastState['kind'], message: string) => {
    setToast({ show: true, kind, message });
  };

  useEffect(() => {
    fetchHolidays(year);
  }, [year]);

  const fetchHolidays = async (fetchYear: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/holidays/${fetchYear}`);
      if (res.data && res.data.length > 0) {
        setHolidays(res.data.map((h: any) => ({ ...h, start: h.date })));
      } else {
        // Auto generate if empty
        const defaults = generateDefaultHolidays(fetchYear);
        setHolidays(defaults);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Lỗi khi tải dữ liệu ngày lễ!');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = holidays.map(h => ({
        date: h.date,
        name: h.name,
        year: year,
        isPaidLeave: h.isPaidLeave !== undefined ? h.isPaidLeave : true
      }));
      await api.put(`/api/holidays/${year}`, payload);
      showToast('success', `Đã lưu thành công lịch nghỉ lễ năm ${year}`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Lỗi khi lưu ngày lễ!');
    } finally {
      setSaving(false);
    }
  };

  const toggleHoliday = (dateStr: string) => {
    setHolidays(prev => {
      const existing = prev.find(h => (h.date === dateStr || h.start === dateStr));
      if (existing) {
        return prev.filter(h => h.date !== dateStr && h.start !== dateStr);
      } else {
        return [...prev, { date: dateStr, start: dateStr, name: 'Nghỉ lễ / Nghỉ bù', isPaidLeave: true }];
      }
    });
  };

  return (
    <div className="space-y-10 pb-20 relative">
      <Toast toast={toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Hero Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pt-10">
         <div>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.9] drop-shadow-lg">
               Ngày lễ
            </h1>
            <p className="text-xl font-bold uppercase tracking-[0.4em] mt-4 ml-1 text-white/90 drop-shadow-md">
               Lịch nghỉ lễ toàn công ty
            </p>
         </div>

         <div className="flex items-center gap-4 bg-white/60 dark:bg-white/10 backdrop-blur-2xl p-3 rounded-[32px] border border-white/40 dark:border-white/10 shadow-xl dark:shadow-2xl mt-6 md:mt-0">
            <div className="flex items-center bg-white/80 dark:bg-black/40 p-1.5 rounded-[20px] border border-slate-200/50 dark:border-white/10 mr-2 shadow-inner">
              <button 
                onClick={() => setYear(y => y - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-[14px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30 active:scale-95 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                disabled={loading || saving}
              >
                <svg className="w-5 h-5 pr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div className="w-20 font-black text-xl md:text-2xl text-slate-800 dark:text-white tracking-widest text-center tabular-nums leading-none">
                {year}
              </div>
              
              <button 
                onClick={() => setYear(y => y + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-[14px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30 active:scale-95 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                disabled={loading || saving}
              >
                <svg className="w-5 h-5 pl-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <button
               onClick={() => setTab('calendar')}
               className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'calendar' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'bg-transparent text-slate-500 dark:text-white/50 hover:bg-white/80 dark:hover:bg-white/10'}`}
            >
               LỊCH NĂM
            </button>
            <button
               onClick={() => setTab('list')}
               className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'list' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'bg-transparent text-slate-500 dark:text-white/50 hover:bg-white/80 dark:hover:bg-white/10'}`}
            >
               DANH SÁCH
            </button>

            <div className="w-[1px] h-8 bg-slate-300 dark:bg-white/20 mx-2"></div>
            
            {canManage && (
              <button
                 onClick={handleSave}
                 disabled={saving || loading}
                 className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                 {saving ? 'ĐANG LƯU...' : 'LƯU LỊCH NĂM'}
              </button>
            )}
         </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32 text-white">
           <svg className="animate-spin h-12 w-12 text-white/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : tab === 'calendar' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 12 }, (_, i) => (
            <MonthCalendar key={i} month={i} year={year} holidays={holidays} toggleHoliday={toggleHoliday} canManage={canManage} />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] overflow-hidden border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl p-2">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-[0.2em] border-b border-black/5 dark:border-white/5">
                <th className="px-10 py-6 w-1/3">Tên ngày lễ</th>
                <th className="px-8 py-6 text-center">Ngày nghỉ</th>
                {canManage && <th className="px-8 py-6 text-right pr-10">Tùy chọn</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {holidays.sort((a,b) => (a.date || a.start || '').localeCompare(b.date || b.start || '')).map((holiday) => (
                <tr key={holiday.id || holiday.date || holiday.start} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 3.05a1 1 0 010 1.415l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 10a1 1 0 11-2 0h-1a1 1 0 110-2h1a1 1 0 112 0v1zM14.243 15.657a1 1 0 01-1.415 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.415zM10 18a1 1 0 100-2v-1a1 1 0 10-2 0v1a1 1 0 102 0v1zM5.757 14.243a1 1 0 010-1.415l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM3 10a1 1 0 112 0h1a1 1 0 110 2H5a1 1 0 11-2 0v-1zM5.757 5.757a1 1 0 011.415 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{holiday.name}</span>
                     </div>
                  </td>
                  <td className="px-8 py-8 text-center">
                     <div className="inline-flex items-center gap-3 bg-black/5 dark:bg-white/5 px-6 py-3 rounded-xl text-sm font-black text-rose-600 dark:text-rose-400 font-mono tracking-tighter">
                        <span>{holiday.date || holiday.start}</span>
                     </div>
                  </td>
                  {canManage && (
                    <td className="px-8 py-8 text-right pr-10">
                       <button onClick={() => toggleHoliday(holiday.date || holiday.start || '')} className="font-bold text-xs hover:text-rose-500 text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl hover:bg-rose-500/10 hover:border-rose-500/30 transition-all">
                         Xóa ngày này
                       </button>
                    </td>
                  )}
                </tr>
              ))}
              {holidays.length === 0 && (
                <tr>
                   <td colSpan={canManage ? 3 : 2} className="px-10 py-16 text-center text-slate-500 font-bold uppercase tracking-widest">Không có ngày nghỉ nào trong năm {year}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
