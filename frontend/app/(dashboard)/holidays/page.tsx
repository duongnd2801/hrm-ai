'use client';

import { useMemo, useState } from 'react';

type HolidayItem = {
  id: string;
  name: string;
  start: string;
  end: string;
  note?: string;
};

const HOLIDAYS: HolidayItem[] = [
  { id: 'tet', name: 'Tết âm lịch 2026', start: '2026-02-16', end: '2026-02-21', note: 'Nghỉ theo lịch nhà nước' },
  { id: 'new-year', name: 'Tết dương lịch', start: '2026-01-01', end: '2026-01-01' },
  { id: 'liberation', name: 'Giải phóng miền Nam', start: '2026-04-30', end: '2026-04-30' },
  { id: 'labor', name: 'Quốc tế lao động', start: '2026-05-01', end: '2026-05-01' },
  { id: 'national', name: 'Quốc khánh', start: '2026-09-02', end: '2026-09-02' },
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  // 0: Sunday, 1: Monday, ...
  // We want 0: Monday, 1: Tuesday, ... 6: Sunday
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

const WEEK_DAYS = ['TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7', 'CN'];

function MonthCalendar({ month, year, holidays }: { month: number; year: number; holidays: HolidayItem[] }) {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  
  const cells = useMemo(() => {
    const list = [];
    // Padding for first day
    for (let i = 0; i < firstDay; i++) list.push(null);
    for (let i = 1; i <= daysInMonth; i++) list.push(i);
    return list;
  }, [firstDay, daysInMonth]);

  const isHoliday = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.some(h => {
       const start = h.start;
       const end = h.end || h.start;
       return dateStr >= start && dateStr <= end;
    });
  };

  const getHolidayName = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const h = holidays.find(h => {
       const start = h.start;
       const end = h.end || h.start;
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
            
            const holiday = isHoliday(day);
            const holidayName = getHolidayName(day);
            
            return (
               <div 
                 key={day} 
                 title={holidayName}
                 className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative cursor-default ${
                    holiday ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105 z-10' : 'text-slate-900 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10'
                 }`}
                 style={!holiday ? { textShadow: '0 1px 4px rgba(0,0,0,0.1)' } : {}}
               >
                  {day}
                  {holiday && day === Number(holidays.find(h => h.name === holidayName)?.start.split('-')[2]) && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-600 text-[8px] font-black py-0.5 px-2 rounded-full border border-white/20 shadow-xl pointer-events-none hidden group-hover:block transition-all max-w-[80px] overflow-hidden truncate">
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
  const [year] = useState(2026);
  const [tab, setTab] = useState<'calendar' | 'list'>('calendar');

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Header - Synced with Payroll Style */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pt-10">
         <div>
            <h1 className="text-5xl md:text-7xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-none" style={{ textShadow: '0 2px 15px rgba(0,0,0,0.4)' }}>
               Ngày lễ
            </h1>
            <p className="text-lg font-bold uppercase tracking-[0.3em] mt-6 ml-1 text-white/90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
               Lịch nghỉ lễ toàn công ty trong năm {year}
            </p>
         </div>

         <div className="flex items-center gap-4 bg-white/10 backdrop-blur-2xl p-3 rounded-[32px] border border-white/10 shadow-2xl mt-6 md:mt-0">
            <button
               onClick={() => setTab('calendar')}
               className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'calendar' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
            >
               LỊCH NĂM
            </button>
            <button
               onClick={() => setTab('list')}
               className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'list' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
            >
               DANH SÁCH
            </button>
         </div>
      </div>

      {tab === 'calendar' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 12 }, (_, i) => (
            <MonthCalendar key={i} month={i} year={year} holidays={HOLIDAYS} />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] overflow-hidden border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl p-2">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-[0.2em] border-b border-black/5 dark:border-white/5">
                <th className="px-10 py-6">Tên ngày lễ</th>
                <th className="px-8 py-6 text-center">Thời gian nghỉ</th>
                <th className="px-8 py-6">Ghi chú</th>
                <th className="px-8 py-6 text-right pr-10">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {HOLIDAYS.map((holiday) => (
                <tr key={holiday.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 3.05a1 1 0 010 1.415l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 10a1 1 0 11-2 0h-1a1 1 0 110-2h1a1 1 0 112 0v1zM14.243 15.657a1 1 0 01-1.415 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.415zM10 18a1 1 0 100-2v-1a1 1 0 10-2 0v1a1 1 0 102 0v1zM5.757 14.243a1 1 0 010-1.415l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM3 10a1 1 0 112 0h1a1 1 0 110 2H5a1 1 0 11-2 0v-1zM5.757 5.757a1 1 0 011.415 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{holiday.name}</span>
                     </div>
                  </td>
                  <td className="px-8 py-8 text-center">
                     <div className="inline-flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl text-sm font-black text-rose-600 dark:text-rose-400 font-mono tracking-tighter">
                        <span>{holiday.start}</span>
                        <svg className="w-3 h-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        <span>{holiday.end}</span>
                     </div>
                  </td>
                  <td className="px-8 py-8 text-sm font-bold text-slate-500 dark:text-white/50">{holiday.note || 'Nghỉ lễ theo quy định'}</td>
                  <td className="px-8 py-8 text-right pr-10">
                     <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-2 px-6 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-lg shadow-emerald-500/10">Sắp đến</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
