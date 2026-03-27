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
            <h1 className="text-8xl font-black text-white/90 tracking-tighter mix-blend-overlay uppercase">Bảng lương</h1>
            <p className="text-lg font-bold text-white/40 uppercase tracking-widest mt-2 px-1">Thu nhập & Chế độ đãi ngộ</p>
         </div>

         {canManage && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/5 shadow-2xl mt-6 md:mt-0 px-4 py-3">
               <div className="flex items-center gap-2 mr-4">
                  <select 
                    value={month} 
                    onChange={e => setMonth(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-xl py-1.5 px-3 text-xs text-white font-black"
                  >
                     {[...Array(12)].map((_, i) => <option key={i+1} value={i+1} className="bg-slate-900 text-white">Tháng {i+1}</option>)}
                  </select>
                  <select 
                    value={year} 
                    onChange={e => setYear(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-xl py-1.5 px-3 text-xs text-white font-black"
                  >
                     {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
                  </select>
               </div>
               <button
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/5 disabled:text-white/20 text-white rounded-xl text-xs font-black tracking-widest transition-all shadow-lg active:scale-95"
               >
                  {calculating ? 'ĐANG TÍNH...' : 'TÍNH LƯƠNG'}
               </button>
            </div>
         )}
      </div>

      <div className="bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-3xl overflow-hidden p-10">
        <h2 className="text-xl font-bold text-white uppercase tracking-widest px-1 mb-8">
           {canManage ? `Bảng lương tổng hợp ${formatMonth(month, year)}` : 'Lịch sử thu nhập cá nhân'}
        </h2>

        {loading ? (
          <div className="p-20 text-center text-white/20 font-black uppercase tracking-widest">Đang truy xuất dữ liệu...</div>
        ) : !payrolls.length ? (
          <div className="p-20 text-center text-white/20 font-black uppercase tracking-widest">Không có dữ liệu lương trong giai đoạn này.</div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
            <table className="min-w-[1200px] w-full text-left text-sm">
              <thead className="text-[10px] uppercase text-white/30 tracking-widest border-b border-white/5">
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
              <tbody className="divide-y divide-white/5">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.03] transition-all group">
                    <td className="px-5 py-5 font-black text-white/50">{formatMonth(p.month, p.year)}</td>
                    <td className="px-5 py-5 font-bold text-white uppercase tracking-tight">{p.employeeName}</td>
                    <td className="px-5 py-5 text-white/60">{formatVND(p.baseSalary)}</td>
                    <td className="px-5 py-5 text-white/60">{p.actualDays}/{p.standardDays}</td>
                    <td className="px-5 py-5 text-indigo-400 font-bold">+{formatVND(p.otAmount)}</td>
                    <td className="px-5 py-5 font-black text-white">{formatVND(p.grossSalary)}</td>
                    <td className="px-5 py-5 text-rose-500/80 font-bold">-{formatVND((p.bhxh||0)+(p.bhyt||0)+(p.bhtn||0))}</td>
                    <td className="px-5 py-5 text-rose-500/80 font-bold">-{formatVND(p.incomeTax)}</td>
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
    </div>
  );
}
