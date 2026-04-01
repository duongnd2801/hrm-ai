'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/components/AuthProvider';
import api from '@/lib/api';
import { Payroll } from '@/types';
import { formatVND } from '@/lib/utils';
import Toast, { ToastState } from '@/components/Toast';

export default function SalaryStatementPage() {
  const { session } = useSession();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  useEffect(() => {
    if (!session) return;
    fetchPayrolls();
  }, [session]);

  async function fetchPayrolls() {
    setLoading(true);
    try {
      const res = await api.get<Payroll[]>('/api/payroll/my');
      setPayrolls(Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSelectedPayroll(res.data[0]);
      }
    } catch {
      pushToast('error', 'Không thể tải danh sách phiếu lương.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf(payroll: Payroll) {
    setDownloading(true);
    try {
      const res = await api.get(`/api/payroll/statement/pdf/${payroll.month}/${payroll.year}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `phieu_luong_${payroll.month}_${payroll.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      pushToast('success', 'Đã tải xuống phiếu lương PDF.');
    } catch {
      pushToast('error', 'Không thể tải xuống phiếu lương.');
    } finally {
      setDownloading(false);
    }
  }

  if (!session) return null;

  return (
    <div className="space-y-12 pb-20 px-2 lg:px-6">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pt-10">
        <div>
          <h1 className="text-[clamp(3rem,8vw,6rem)] font-black text-white dark:text-white dark:mix-blend-overlay uppercase leading-none tracking-tighter" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Phiếu Lương
          </h1>
          <p className="text-lg font-bold uppercase tracking-widest mt-6 ml-1" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
            Xem và tải xuống phiếu lương cá nhân
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Payroll List */}
        <div className="lg:col-span-1 bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl h-fit">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 px-1">Lịch sử Lương</h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-white/10 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : payrolls.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-white/40 text-center py-8">Chưa có phiếu lương</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {payrolls.map((payroll) => (
                <button
                  key={`${payroll.month}-${payroll.year}`}
                  onClick={() => setSelectedPayroll(payroll)}
                  className={`w-full p-4 rounded-xl text-left font-bold uppercase tracking-widest transition-all ${
                    selectedPayroll?.month === payroll.month && selectedPayroll?.year === payroll.year
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-slate-900/5 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-emerald-500/20 dark:hover:bg-emerald-500/10'
                  }`}
                >
                  <div className="text-sm">Tháng {payroll.month}</div>
                  <div className="text-xs text-slate-500 dark:text-white/40 font-normal">Năm {payroll.year}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Payroll Detail */}
        <div className="lg:col-span-3 bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
          {selectedPayroll ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center pb-8 border-b border-black/5 dark:border-white/5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    Phiếu Lương Tháng {selectedPayroll.month}/{selectedPayroll.year}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-white/40 mt-2">{selectedPayroll.employeeName}</p>
                </div>
                <button
                  onClick={() => handleDownloadPdf(selectedPayroll)}
                  disabled={downloading}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-400 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all"
                >
                  {downloading ? 'Đang tải...' : 'Tải PDF'}
                </button>
              </div>

              {/* Income Section */}
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Thành Phần Thu Nhập</h3>
                <div className="space-y-2 bg-slate-900/5 dark:bg-white/5 rounded-2xl p-6">
                  <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-slate-700 dark:text-white/70">Lương cơ sở</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatVND(selectedPayroll.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-slate-700 dark:text-white/70">Số ngày chuẩn</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedPayroll.standardDays} ngày</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-slate-700 dark:text-white/70">Số ngày thực tế</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedPayroll.actualDays?.toFixed(1)} ngày</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-slate-700 dark:text-white/70">Giờ OT</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedPayroll.otHours?.toFixed(1)} giờ</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-slate-700 dark:text-white/70">Tiền OT</span>
                    <span className="font-bold text-slate-900 dark:text-white text-emerald-600">{formatVND(selectedPayroll.otAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-slate-700 dark:text-white/70">Phụ cấp</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatVND(selectedPayroll.allowance)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 pt-3 border-t-2 border-emerald-500/20">
                    <span className="font-black text-slate-900 dark:text-white">TỔNG THU NHẬP</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">{formatVND(selectedPayroll.grossSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Insurance & Tax Section */}
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Các Khoản Chiết Khấu</h3>
                <div className="space-y-2 bg-slate-900/5 dark:bg-white/5 rounded-2xl p-6">
                  <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-slate-700 dark:text-white/70">BHXH (8%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatVND(selectedPayroll.bhxh)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-slate-700 dark:text-white/70">BHYT (1.5%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatVND(selectedPayroll.bhyt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-slate-700 dark:text-white/70">BHTN (1%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatVND(selectedPayroll.bhtn)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-slate-700 dark:text-white/70">Thuế TNCN</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatVND(selectedPayroll.incomeTax)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 pt-3 border-t-2 border-rose-500/20">
                    <span className="font-black text-slate-900 dark:text-white">TỔNG CHIẾT KHẤU</span>
                    <span className="font-black text-rose-600 dark:text-rose-400 text-lg">
                      {formatVND(selectedPayroll.bhxh + selectedPayroll.bhyt + selectedPayroll.bhtn + selectedPayroll.incomeTax)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 dark:from-emerald-500/30 dark:to-emerald-500/10 rounded-2xl p-8 border-2 border-emerald-500/30">
                <div className="text-center">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Lương Nhận</p>
                  <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{formatVND(selectedPayroll.netSalary)}</p>
                </div>
              </div>

              {selectedPayroll.note && (
                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border border-amber-200 dark:border-amber-500/20">
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    <span className="font-bold">Ghi chú:</span> {selectedPayroll.note}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-slate-500 dark:text-white/40 text-center">Chọn một phiếu lương để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
