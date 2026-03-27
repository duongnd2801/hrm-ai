'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { DashboardSummary } from '@/types';
import Toast, { ToastState } from '@/components/Toast';

interface WeatherCurrent {
  temperature?: number;
  windspeed?: number;
  weathercode?: number;
}

function formatTime(value?: string) {
  if (!value) return '--:--:--';
  return new Date(value).toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function DashboardPage() {
  const { session } = useSession();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [weather, setWeather] = useState<WeatherCurrent>({});
  const [clock, setClock] = useState(new Date());
  const [loadingAction, setLoadingAction] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  async function loadSummary() {
    try {
      const res = await api.get<DashboardSummary>('/api/dashboard/summary');
      setSummary(res.data);
    } catch {
      setSummary(null);
    }
  }

  async function loadWeather() {
    try {
      const res = await axios.get(
        'https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current_weather=true'
      );
      setWeather(res.data.current_weather);
    } catch {
      setWeather({});
    }
  }

  useEffect(() => {
    void loadSummary();
    void loadWeather();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateText = clock.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' . ');
  const timeText = clock.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const nextAction = summary?.todayCheckIn && !summary?.todayCheckOut ? 'checkout' : 'checkin';

  async function handleAttendanceAction() {
    setLoadingAction(true);
    try {
      await api.post(nextAction === 'checkin' ? '/api/attendance/checkin' : '/api/attendance/checkout');
      pushToast('success', nextAction === 'checkin' ? 'Check-in thành công.' : 'Check-out thành công.');
      await loadSummary();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Thao tác chấm công thất bại.';
      pushToast('error', msg);
    } finally {
      setLoadingAction(false);
    }
  }

  const namePrefix = session?.email.split('@')[0] || 'bạn';

  return (
    <div className="space-y-12 pb-20">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Hero Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pt-10">
         <div className="relative">
            <h1 className="text-8xl font-black text-white/95 tracking-tighter mix-blend-overlay uppercase leading-[0.8]">Chào {namePrefix}</h1>
            <p className="text-lg font-bold text-white/30 uppercase tracking-[0.3em] mt-6 ml-2 italic">Hệ thống quản trị nhân sự cao cấp</p>
         </div>

         <div className="flex items-center gap-6 mt-10 md:mt-0 p-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-3xl group hover:bg-white/10 transition-all duration-700">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center text-white shadow-2xl group-hover:rotate-12 transition-transform">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="flex flex-col">
               <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-white tracking-widest font-mono">{timeText}</span>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
               </div>
               <span className="text-sm font-black text-white/30 tracking-[0.2em] mt-2 uppercase">{dateText}</span>
            </div>
         </div>
      </div>

      {/* Main Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-stretch pt-4">
         {/* Weather & Environment Widget */}
         <div className="lg:col-span-3 bg-slate-900/60 backdrop-blur-3xl rounded-[48px] p-10 border border-white/10 shadow-3xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />
            
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Thời tiết Hà Nội</span>
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 3.05a1 1 0 010 1.415l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 10a1 1 0 11-2 0h-1a1 1 0 110-2h1a1 1 0 112 0v1zM14.243 15.657a1 1 0 01-1.415 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.415zM10 18a1 1 0 100-2v-1a1 1 0 10-2 0v1a1 1 0 102 0v1zM5.757 14.243a1 1 0 010-1.415l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM3 10a1 1 0 112 0h1a1 1 0 110 2H5a1 1 0 11-2 0v-1zM5.757 5.757a1 1 0 011.415 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.415z" /></svg>
                  </div>
               </div>

               <div className="flex items-baseline gap-2 group-hover:translate-x-1 transition-transform">
                  <h2 className="text-8xl font-black text-white drop-shadow-2xl">{weather.temperature ?? '--'}</h2>
                  <span className="text-3xl font-black text-indigo-400">°C</span>
               </div>
               <p className="text-xl font-bold text-white/80 mt-2">Nắng nhẹ</p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
               <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Gió</p>
                  <p className="text-lg font-black text-white">{weather.windspeed ?? '0'} m/s</p>
               </div>
               <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Độ ẩm</p>
                  <p className="text-lg font-black text-white">42%</p>
               </div>
            </div>
         </div>

         {/* Human Resource Management Center (4 functional pills) */}
         <div className="lg:col-span-5 grid grid-cols-2 gap-6">
            <Link href="/employees" className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-3xl hover:bg-white/10 transition-all flex flex-col justify-between group">
               <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493" /></svg>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">Nhân viên</h3>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-2">{summary?.todayAttendanceStatus === 'PENDING' ? 'Quản lý hồ sơ' : 'Quản lý hồ sơ'}</p>
               </div>
            </Link>
            <Link href="/payroll" className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-3xl hover:bg-white/10 transition-all flex flex-col justify-between group">
               <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">Bảng lương</h3>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-2">Tháng {new Date().getMonth()+1}/{new Date().getFullYear()}</p>
               </div>
            </Link>
            <Link href="/attendance" className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-3xl hover:bg-white/10 transition-all flex flex-col justify-between group">
               <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">Ngày công</h3>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-2">Dữ liệu chấm công</p>
               </div>
            </Link>
            <Link href="/apologies" className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-3xl hover:bg-white/10 transition-all flex flex-col justify-between group">
               <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">Đơn từ</h3>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-2">{summary?.pendingApologiesToReview ?? 0} đơn chờ duyệt</p>
               </div>
            </Link>
         </div>

         {/* Punch In/Out Premium Card */}
         <div className="lg:col-span-4 bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-[56px] p-10 border border-white/10 shadow-3xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative z-10">
               <div className="flex justify-between items-center mb-10">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                     <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 ${summary?.todayAttendanceStatus === 'ON_TIME' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                     {summary?.todayAttendanceStatus || 'CHƯA CÓ DỮ LIỆU'}
                  </div>
               </div>

               <div className="space-y-2">
                  <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em] ml-1">Thời gian ghi nhận</p>
                  <h3 className="text-4xl font-black text-white font-mono tracking-tighter">
                     {formatTime(summary?.todayCheckIn)}
                  </h3>
               </div>
            </div>

            <div className="relative z-10 mt-12">
               <button 
                  onClick={() => void handleAttendanceAction()}
                  disabled={loadingAction}
                  className="w-full py-8 bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/5 disabled:text-white/10 text-white rounded-[32px] font-black text-2xl tracking-[0.2em] transition-all shadow-2xl shadow-indigo-500/20 active:scale-95 group/btn"
               >
                  <span className="group-hover/btn:scale-110 block transition-transform">
                    {loadingAction ? '...' : (nextAction === 'checkin' ? 'CHECK-IN' : 'CHECK-OUT')}
                  </span>
               </button>
               <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest mt-6 italic">Ghi nhận tọa độ & Thời gian thực</p>
            </div>
         </div>
      </div>
    </div>
  );
}
