'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { DashboardSummary } from '@/types';
import Toast, { ToastState } from '@/components/Toast';

interface WeatherData {
  temperature?: number;
  windspeed?: number;
  weathercode?: number;
  humidity?: number;
  is_day?: number;
}

/** Map WMO weather code → Vietnamese description + icon color */
function getWeatherInfo(code: number, isDay: boolean) {
  if (code === 0) return { desc: 'Trời quang', icon: 'sun', color: 'text-amber-500', bg: 'from-amber-400/20 to-orange-400/10' };
  if (code === 1) return { desc: 'Gần như quang', icon: 'sun', color: 'text-amber-500', bg: 'from-amber-400/15 to-orange-400/5' };
  if (code === 2) return { desc: 'Mây rải rác', icon: 'cloud-sun', color: 'text-sky-500', bg: 'from-sky-500/15 to-blue-500/10' };
  if (code === 3) return { desc: 'Nhiều mây', icon: 'cloud', color: 'text-slate-400', bg: 'from-slate-400/15 to-slate-500/10' };
  if (code >= 45 && code <= 48) return { desc: 'Sương mù', icon: 'fog', color: 'text-slate-500', bg: 'from-slate-400/20 to-slate-500/15' };
  if (code >= 51 && code <= 55) return { desc: 'Mưa phùn', icon: 'drizzle', color: 'text-blue-500', bg: 'from-blue-500/15 to-cyan-500/10' };
  if (code >= 56 && code <= 57) return { desc: 'Mưa phùn lạnh', icon: 'drizzle', color: 'text-blue-600', bg: 'from-blue-500/20 to-cyan-500/15' };
  if (code >= 61 && code <= 65) return { desc: code <= 62 ? 'Mưa nhỏ' : 'Mưa vừa đến lớn', icon: 'rain', color: 'text-blue-600', bg: 'from-blue-500/20 to-indigo-500/15' };
  if (code >= 66 && code <= 67) return { desc: 'Mưa lạnh', icon: 'rain', color: 'text-blue-700', bg: 'from-blue-600/20 to-indigo-500/15' };
  if (code >= 71 && code <= 77) return { desc: 'Tuyết rơi', icon: 'snow', color: 'text-blue-400', bg: 'from-sky-100 to-blue-300/20' };
  if (code >= 80 && code <= 82) return { desc: 'Mưa rào', icon: 'rain', color: 'text-blue-600', bg: 'from-blue-500/20 to-indigo-500/15' };
  if (code >= 85 && code <= 86) return { desc: 'Mưa tuyết', icon: 'snow', color: 'text-blue-400', bg: 'from-blue-400/15 to-white/10' };
  if (code >= 95) return { desc: 'Giông bão', icon: 'storm', color: 'text-purple-600', bg: 'from-purple-500/20 to-indigo-500/15' };
  return { desc: isDay ? 'Nắng nhẹ' : 'Đêm yên', icon: 'sun', color: 'text-amber-500', bg: 'from-amber-400/15 to-orange-400/5' };
}

function WeatherIcon({ type, className }: { type: string; className?: string }) {
  const cn = className || 'w-10 h-10';
  switch (type) {
    case 'sun':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="12" fill="currentColor" className="text-amber-500" />
          <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-amber-400">
            <line x1="32" y1="4" x2="32" y2="12" />
            <line x1="32" y1="52" x2="32" y2="60" />
            <line x1="4" y1="32" x2="12" y2="32" />
            <line x1="52" y1="32" x2="60" y2="32" />
            <line x1="12.2" y1="12.2" x2="17.9" y2="17.9" />
            <line x1="46.1" y1="46.1" x2="51.8" y2="51.8" />
            <line x1="12.2" y1="51.8" x2="17.9" y2="46.1" />
            <line x1="46.1" y1="17.9" x2="51.8" y2="12.2" />
          </g>
        </svg>
      );
    case 'cloud-sun':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none">
          <circle cx="24" cy="20" r="8" fill="currentColor" className="text-amber-500" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400">
            <line x1="24" y1="6" x2="24" y2="10" />
            <line x1="10" y1="20" x2="14" y2="20" />
            <line x1="14.1" y1="10.1" x2="16.9" y2="12.9" />
            <line x1="33.9" y1="10.1" x2="31.1" y2="12.9" />
          </g>
          <path d="M20 44a10 10 0 01-.5-19.95 12 12 0 0123.3-3A11 11 0 0148 44H20z" fill="currentColor" className="text-slate-400/20" />
        </svg>
      );
    case 'cloud':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none">
          <path d="M18 48a12 12 0 01-.6-23.94 14 14 0 0127.2-3A13 13 0 0150 48H18z" fill="currentColor" className="text-slate-400/30" />
          <path d="M18 48a12 12 0 01-.6-23.94 14 14 0 0127.2-3A13 13 0 0150 48H18z" stroke="currentColor" strokeWidth="2" className="text-slate-500/40" />
        </svg>
      );
    case 'rain':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none">
          <path d="M16 36a10 10 0 01-.5-19.95 12 12 0 0123.3-3A11 11 0 0148 36H16z" fill="currentColor" className="text-slate-400/30" />
          <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-blue-600">
            <line x1="22" y1="42" x2="20" y2="50"><animate attributeName="y2" values="50;54;50" dur="1.5s" repeatCount="indefinite" /></line>
            <line x1="32" y1="42" x2="30" y2="52"><animate attributeName="y2" values="52;56;52" dur="1.2s" repeatCount="indefinite" /></line>
            <line x1="42" y1="42" x2="40" y2="48"><animate attributeName="y2" values="48;52;48" dur="1.8s" repeatCount="indefinite" /></line>
          </g>
        </svg>
      );
    case 'drizzle':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none">
          <path d="M16 36a10 10 0 01-.5-19.95 12 12 0 0123.3-3A11 11 0 0148 36H16z" fill="currentColor" className="text-slate-400/25" />
          <g className="text-blue-500">
            <circle cx="24" cy="46" r="1.5" fill="currentColor"><animate attributeName="cy" values="44;50;44" dur="2s" repeatCount="indefinite" /></circle>
            <circle cx="34" cy="48" r="1.5" fill="currentColor"><animate attributeName="cy" values="46;52;46" dur="1.6s" repeatCount="indefinite" /></circle>
            <circle cx="44" cy="44" r="1.5" fill="currentColor"><animate attributeName="cy" values="42;48;42" dur="2.2s" repeatCount="indefinite" /></circle>
          </g>
        </svg>
      );
    case 'storm':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none">
          <path d="M16 32a10 10 0 01-.5-19.95 12 12 0 0123.3-3A11 11 0 0148 32H16z" fill="currentColor" className="text-purple-600/25" />
          <polygon points="30,34 36,34 32,44 40,44 28,58 32,46 26,46" fill="currentColor" className="text-amber-500">
            <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
          </polygon>
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-blue-600/60">
            <line x1="20" y1="38" x2="18" y2="46"><animate attributeName="y2" values="46;50;46" dur="1.5s" repeatCount="indefinite" /></line>
            <line x1="44" y1="38" x2="42" y2="44"><animate attributeName="y2" values="44;48;44" dur="1.3s" repeatCount="indefinite" /></line>
          </g>
        </svg>
      );
    case 'fog':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none">
          <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-slate-400/50">
            <line x1="12" y1="28" x2="52" y2="28"><animate attributeName="x1" values="12;16;12" dur="3s" repeatCount="indefinite" /></line>
            <line x1="16" y1="36" x2="48" y2="36"><animate attributeName="x1" values="16;12;16" dur="3.5s" repeatCount="indefinite" /></line>
            <line x1="14" y1="44" x2="50" y2="44"><animate attributeName="x1" values="14;18;14" dur="2.8s" repeatCount="indefinite" /></line>
          </g>
        </svg>
      );
    case 'snow':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none">
          <path d="M16 32a10 10 0 01-.5-19.95 12 12 0 0123.3-3A11 11 0 0148 32H16z" fill="currentColor" className="text-blue-400/10" />
          <g className="text-blue-400">
            <circle cx="22" cy="42" r="2" fill="currentColor"><animate attributeName="cy" values="40;50;40" dur="2s" repeatCount="indefinite" /></circle>
            <circle cx="32" cy="46" r="2.5" fill="currentColor"><animate attributeName="cy" values="42;54;42" dur="1.8s" repeatCount="indefinite" /></circle>
            <circle cx="42" cy="40" r="2" fill="currentColor"><animate attributeName="cy" values="38;48;38" dur="2.4s" repeatCount="indefinite" /></circle>
          </g>
        </svg>
      );
    default:
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="12" fill="currentColor" className="text-amber-500" />
        </svg>
      );
  }
}

function formatTime(value?: string) {
  if (!value) return '--:--:--';
  return new Date(value).toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatStatus(status: string) {
  switch (status) {
    case 'PENDING': return 'ĐANG CHỜ';
    case 'ON_TIME': return 'ĐÚNG GIỜ';
    case 'LATE': return 'ĐI MUỘN';
    case 'INSUFFICIENT': return 'THIẾU GIỜ';
    case 'ABSENT': return 'VẮNG MẶT';
    case 'APPROVED': return 'ĐÃ DUYỆT';
    case 'DAY_OFF': return 'NGÀY NGHỈ';
    default: return status || 'CHƯA CÓ DỮ LIỆU';
  }
}

export default function DashboardPage() {
  const { session } = useSession();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [weather, setWeather] = useState<WeatherData>({});
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
        'https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day'
      );
      const current = res.data?.current;
      if (current) {
        setWeather({
          temperature: current.temperature_2m,
          windspeed: current.wind_speed_10m,
          weathercode: current.weather_code,
          humidity: current.relative_humidity_2m,
          is_day: current.is_day,
        });
      }
    } catch {
      setWeather({});
    }
  }

  useEffect(() => {
    void loadSummary();
    void loadWeather();
    // refresh weather every 10 min
    const weatherInterval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(weatherInterval);
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
  const wInfo = getWeatherInfo(weather.weathercode ?? 0, (weather.is_day ?? 1) === 1);

  return (
    <div className="space-y-12 pb-20">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Hero Welcome Section - Premium Styling */}
      <div className="relative pt-10 px-2 lg:px-6">
         {/* Gradient background effect */}
         <div className="absolute -z-10 inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
         
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
               <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white uppercase leading-none tracking-tighter mb-4">
                  Chào {namePrefix}
               </h1>
               <p className="text-base md:text-lg font-bold text-white/70 uppercase tracking-widest ml-1">
                  ⏰ Hệ thống quản trị nhân sự cao cấp
               </p>
            </div>

            <div className="relative group flex items-center gap-6 p-8 bg-gradient-to-br from-white/90 via-white/70 to-indigo-50 dark:from-white/10 dark:via-indigo-500/10 dark:to-purple-500/10 backdrop-blur-2xl border border-white/40 dark:border-indigo-500/20 rounded-[40px] shadow-xl dark:shadow-2xl hover:shadow-2xl dark:hover:shadow-indigo-500/30 transition-all duration-500">
               {/* Gradient overlay */}
               <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[40px] transition-all duration-500" />
               
               <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 group-hover:shadow-indigo-500/60 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <div className="relative z-10 flex flex-col">
                  <div className="flex items-baseline gap-3 mb-2">
                     <span className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-widest font-mono leading-none">{timeText}</span>
                     <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-lg shadow-indigo-500/50" />
                  </div>
                  <span className="text-xs font-black text-slate-500 dark:text-white/40 tracking-[0.3em] uppercase">{dateText}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Main Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-stretch pt-4 px-2 lg:px-6">
         {/* Premium Weather Widget */}
         <div className="lg:col-span-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[48px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl flex flex-col justify-between relative overflow-hidden group">
            {/* Dynamic gradient background based on weather */}
            <div className={`absolute inset-0 bg-gradient-to-br ${wInfo.bg} opacity-20 dark:opacity-60 group-hover:opacity-40 dark:group-hover:opacity-100 transition-opacity duration-1000`} />
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />
            
            <div className="relative z-10 text-slate-900 dark:text-white">
               <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest">Thời tiết Hà Nội</span>
                  <div className="w-12 h-12 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md flex items-center justify-center border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform">
                    <WeatherIcon type={wInfo.icon} className={`w-7 h-7 ${wInfo.color}`} />
                  </div>
               </div>

               <div className="flex items-baseline gap-2 group-hover:translate-x-1 transition-transform duration-500">
                  <h2 className="text-7xl lg:text-8xl font-black text-slate-900 dark:text-white drop-shadow-2xl">{weather.temperature ?? '--'}</h2>
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">°C</span>
               </div>
               <p className="text-xl font-bold text-slate-800 dark:text-white/80 mt-2">{wInfo.desc}</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
               <div className="p-4 bg-slate-900/5 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-black/5 dark:border-white/5 group-hover:bg-slate-900/10 dark:group-hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                     <svg className="w-3.5 h-3.5 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.01M6 6h.01M6 18h.01M14 6l6 6-6 6" /></svg>
                     <p className="text-[10px] font-black text-slate-500 dark:text-white/25 uppercase tracking-widest">Gió</p>
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{weather.windspeed ?? '0'} <span className="text-sm text-slate-500 dark:text-white/50">m/s</span></p>
               </div>
               <div className="p-4 bg-slate-900/5 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-black/5 dark:border-white/5 group-hover:bg-slate-900/10 dark:group-hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                     <svg className="w-3.5 h-3.5 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /></svg>
                     <p className="text-[10px] font-black text-slate-500 dark:text-white/25 uppercase tracking-widest">Độ ẩm</p>
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{weather.humidity ?? '--'}<span className="text-sm text-slate-500 dark:text-white/50">%</span></p>
               </div>
            </div>
         </div>

         {/* Human Resource Management Center (4 functional pills) */}
         <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <Link href="/employees" className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl hover:bg-white dark:hover:bg-white/10 transition-all flex flex-col justify-between group h-full">
               <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493" /></svg>
               </div>
               <div className="mt-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter">Nhân viên</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest mt-2">Quản lý hồ sơ</p>
               </div>
            </Link>
            <Link href="/payroll" className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl hover:bg-white dark:hover:bg-white/10 transition-all flex flex-col justify-between group h-full">
               <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <div className="mt-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter">Bảng lương</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest mt-2">Tháng {new Date().getMonth()+1}/{new Date().getFullYear()}</p>
               </div>
            </Link>
            <Link href="/attendance" className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl hover:bg-white dark:hover:bg-white/10 transition-all flex flex-col justify-between group h-full">
               <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
               </div>
               <div className="mt-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter">Ngày công</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest mt-2">Dữ liệu chấm công</p>
               </div>
            </Link>
            <Link href="/apologies" className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl hover:bg-white dark:hover:bg-white/10 transition-all flex flex-col justify-between group h-full">
               <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <div className="mt-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter">Đơn từ</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest mt-2">{summary?.pendingApologiesToReview ?? 0} đơn chờ duyệt</p>
               </div>
            </Link>
         </div>

         {/* Attendance Card - Theme Aware */}
         <div className="lg:col-span-4 glass-dark rounded-[56px] p-10 shadow-3xl flex flex-col justify-between relative overflow-hidden group border border-black/5 dark:border-white/10">
            <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
            
            <div className="relative z-10">
               <div className="flex justify-between items-center mb-10">
                  <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                  </div>
                  <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    summary?.todayAttendanceStatus === 'ON_TIME' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}>
                     {formatStatus(summary?.todayAttendanceStatus || '')}
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-[0.3em] ml-1">
                    {summary?.todayCheckOut ? 'Giờ ra (Check-out)' : 'Giờ vào (Check-in)'}
                  </p>
                  <h3 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white font-mono tracking-tighter leading-none">
                     {formatTime(summary?.todayCheckOut || summary?.todayCheckIn)}
                  </h3>
               </div>
            </div>

            <div className="relative z-10 mt-12 space-y-6">
               <button 
                  onClick={() => void handleAttendanceAction()}
                  disabled={loadingAction}
                  className="w-full py-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 dark:hover:from-indigo-400 dark:hover:via-purple-400 dark:hover:to-pink-400 text-white rounded-[32px] font-black text-2xl tracking-[0.2em] transition-all shadow-2xl shadow-indigo-600/40 hover:shadow-2xl hover:shadow-purple-600/50 active:scale-95 group/btn border border-indigo-400/20 dark:border-indigo-300/30 disabled:bg-gradient-to-r disabled:from-slate-100 dark:disabled:from-white/5 disabled:via-slate-100 dark:disabled:via-white/5 disabled:to-slate-100 dark:disabled:to-white/5 disabled:text-slate-400 dark:disabled:text-white/10"
               >
                  <span className="group-hover/btn:scale-110 block transition-transform">
                    {loadingAction ? '...' : (nextAction === 'checkin' ? '✓ CHECK-IN' : '✓ CHECK-OUT')}
                  </span>
               </button>
               <p className="text-center text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] italic">Ghi nhận theo thời gian thực</p>
            </div>
         </div>
      </div>
    </div>
  );
}
