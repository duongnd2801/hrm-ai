'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/components/AuthProvider';
import { hasRole } from '@/lib/auth';
import api from '@/lib/api';
import { Payroll } from '@/types';
import { formatVND, formatMonth } from '@/lib/utils';
import Toast, { ToastState } from '@/components/Toast';

export default function PayrollPage() {
  const { session } = useSession();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  if (!session) return null;
  const canManage = hasRole(session.role, 'ADMIN', 'HR');

  async function fetchPayrolls() {
    setLoading(true);
    try {
      const endpoint = canManage ? `/api/payroll?month=${month}&year=${year}` : '/api/payroll/my';
      const res = await api.get(endpoint);
      setPayrolls(res.data as Payroll[]);
    } catch {
      pushToast('error', 'Không thể tải dữ liệu lương.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPayrolls();
  }, [month, year, session.role]);

  async function handleCalculate() {
    setCalculating(true);
    try {
      await api.post(`/api/payroll/calculate?month=${month}&year=${year}`);
      pushToast('success', `Đã tính lương xong cho Tháng ${month}/${year}`);
      void fetchPayrolls();
    } catch {
      pushToast('error', 'Có lỗi xảy ra khi tính lương.');
    } finally {
      setCalculating(false);
    }
  }

  return (
    <div className="space-y-12 pb-20">
      <Toast toast={toast} onClose={() => setToast(t => ({ ...t, show: false }))} />

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pt-10">
         <div>
            <h1 className="text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Bảng lương</h1>
            <p className="text-lg font-bold uppercase tracking-widest mt-6 ml-1" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Thu nhập & Chế độ đãi ngộ</p>
         </div>

         {canManage && (
            <div className="flex items-center gap-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl dark:shadow-2xl mt-6 md:mt-0 px-4 py-3">
               <div className="flex items-center gap-2 mr-4">
                  <select 
                    value={month} 
                    onChange={e => setMonth(Number(e.target.value))}
                    className="bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-900 dark:text-white font-black"
                  >
                     {[...Array(12)].map((_, i) => <option key={i+1} value={i+1} className="bg-slate-900 text-white">Tháng {i+1}</option>)}
                  </select>
                  <select 
                    value={year} 
                    onChange={e => setYear(Number(e.target.value))}
                    className="bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-900 dark:text-white font-black"
                  >
                     {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
                  </select>
               </div>
               <button
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-900/5 dark:disabled:bg-white/5 disabled:text-slate-400 dark:disabled:text-white/20 text-white rounded-xl text-xs font-black tracking-widest transition-all shadow-lg active:scale-95"
               >
                  {calculating ? 'ĐANG TÍNH...' : 'TÍNH LƯƠNG'}
               </button>
            </div>
         )}
      </div>

      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl overflow-hidden p-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-widest px-1 mb-8">
           {canManage ? `Bảng lương tổng hợp ${formatMonth(month, year)}` : 'Lịch sử thu nhập cá nhân'}
        </h2>

        {loading ? (
          <div className="p-20 text-center text-slate-400 dark:text-white/20 font-black uppercase tracking-widest">Đang truy xuất dữ liệu...</div>
        ) : !payrolls.length ? (
          <div className="p-20 text-center text-slate-400 dark:text-white/20 font-black uppercase tracking-widest">Không có dữ liệu lương trong giai đoạn này.</div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10">
            <table className="min-w-[1200px] w-full text-left text-sm">
              <thead className="text-[10px] uppercase text-slate-500 dark:text-white/30 tracking-widest border-b border-black/5 dark:border-white/5">
                <tr>
                  <th className="px-5 py-5 font-black">Thời điểm</th>
                  <th className="px-5 py-5 font-black">Nhân viên</th>
                  <th className="px-5 py-5 font-black">Lương CB</th>
                  <th className="px-5 py-5 font-black">Công thực</th>
                  <th className="px-5 py-5 font-black">OT</th>
                  <th className="px-5 py-5 font-black">Tổng thu nhập</th>
                  <th className="px-5 py-5 font-black">Bảo hiểm</th>
                  <th className="px-5 py-5 font-black">Thuế TNCN</th>
                  <th className="px-5 py-5 font-black text-emerald-400">Thực nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all group">
                    <td className="px-5 py-5 font-black text-slate-500/50 dark:text-white/50">{formatMonth(p.month, p.year)}</td>
                    <td className="px-5 py-5 font-bold text-slate-900 dark:text-white uppercase tracking-tight">{p.employeeName}</td>
                    <td className="px-5 py-5 text-slate-500/60 dark:text-white/60">{formatVND(p.baseSalary)}</td>
                    <td className="px-5 py-5 text-slate-500/60 dark:text-white/60">{p.actualDays}/{p.standardDays}</td>
                    <td className="px-5 py-5 text-indigo-700 dark:text-indigo-400 font-bold">+{formatVND(p.otAmount)}</td>
                    <td className="px-5 py-5 font-black text-slate-900 dark:text-white">{formatVND(p.grossSalary)}</td>
                    <td className="px-5 py-5 text-rose-600 font-bold">-{formatVND((p.bhxh||0)+(p.bhyt||0)+(p.bhtn||0))}</td>
                    <td className="px-5 py-5 text-rose-600 font-bold">-{formatVND(p.incomeTax)}</td>
                    <td className="px-5 py-5">
                       <span className="text-xl font-black text-emerald-400 tracking-tighter">{formatVND(p.netSalary)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card section */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl overflow-hidden p-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-widest px-1 mb-8">
           Cấu trúc Thuế & Bảo hiểm (Pháp luật Việt Nam)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Column 1: Bảo Hiểm */}
           <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-6">
              <h3 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                 </svg>
                 Bảo hiểm bắt buộc
              </h3>
              <ul className="space-y-3 text-xs font-bold text-slate-600 dark:text-white/60">
                 <li className="flex justify-between"><span>Bảo hiểm xã hội (BHXH)</span><span className="text-slate-900 dark:text-white font-black">8%</span></li>
                 <li className="flex justify-between"><span>Bảo hiểm y tế (BHYT)</span><span className="text-slate-900 dark:text-white font-black">1.5%</span></li>
                 <li className="flex justify-between"><span>Bảo hiểm thất nghiệp (BHTN)</span><span className="text-slate-900 dark:text-white font-black">1%</span></li>
                 <li className="border-t border-black/5 dark:border-white/5 pt-3 flex justify-between text-indigo-600 dark:text-indigo-400 uppercase tracking-tight"><span>Người lao động đóng</span><span className="font-black text-sm">10.5%</span></li>
              </ul>
           </div>

           {/* Column 2: Giảm trừ */}
           <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
              <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                 </svg>
                 Giảm trừ gia cảnh
              </h3>
              <ul className="space-y-3 text-xs font-bold text-slate-600 dark:text-white/60">
                 <li className="flex justify-between"><span>Đối với bản thân</span><span className="text-slate-900 dark:text-white font-black text-[11px]">15.500.000 đ/tháng</span></li>
                 <li className="flex justify-between"><span>Đối với người phụ thuộc</span><span className="text-slate-900 dark:text-white font-black text-[11px]">6.200.000 đ/tháng</span></li>
                 <li className="border-t border-black/5 dark:border-white/5 pt-3"><span className="text-[10px] text-slate-500/70 font-semibold leading-relaxed">Thuế TNCN = Thu nhập (Gross) - Các khoản BH - Giảm trừ gia cảnh.<br/>Do Bảo hiểm bắt buộc trừ 10.5% vào lương Gross, người thu nhập Gross dưới 17,3 triệu đồng (chưa có con) sẽ hoàn toàn không phải nộp Thuế TNCN (sau trừ bảo hiểm thì phần còn lại nhỏ hơn mức giảm trừ bản thân 15.5tr).</span></li>
              </ul>
           </div>
           
           {/* Column 3: Thuế TNCN lũy tiến */}
           <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6">
              <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 Thuế TNCN Lũy Tiến
              </h3>
              <ul className="space-y-2 text-[10px] font-bold text-slate-600 dark:text-white/60">
                 <li className="flex justify-between items-center"><span className="opacity-75">Bậc 1: Đến 5 triệu VNĐ</span><span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-black">5%</span></li>
                 <li className="flex justify-between items-center"><span className="opacity-75">Bậc 2: 5 - 10 triệu VNĐ</span><span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-black">10%</span></li>
                 <li className="flex justify-between items-center"><span className="opacity-75">Bậc 3: 10 - 18 triệu VNĐ</span><span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-black">15%</span></li>
                 <li className="flex justify-between items-center"><span className="opacity-75">Bậc 4: 18 - 32 triệu VNĐ</span><span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-black">20%</span></li>
                 <li className="flex justify-between items-center"><span className="opacity-75">Bậc 5: 32 - 52 triệu VNĐ</span><span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-black">25%</span></li>
                 <li className="flex justify-between items-center"><span className="opacity-75">Bậc 6: 52 - 80 triệu VNĐ</span><span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-black">30%</span></li>
                 <li className="flex justify-between items-center"><span className="opacity-75">Bậc 7: Trên 80 triệu VNĐ</span><span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-black">35%</span></li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
