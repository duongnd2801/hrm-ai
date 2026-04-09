"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Toast, { ToastState } from "@/components/Toast";
import { CompanyConfig } from "@/types";

export default function CompanyConfigForm() {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const pushToast = (kind: ToastState['kind'], message: string) =>
    setToast({ show: true, kind, message });

  useEffect(() => {
    void fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get("/api/company/config");
      setConfig(res.data as CompanyConfig);
    } catch (error) {
      console.error("Failed to fetch company config", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config) return;
    const { name, value, type } = e.target;
    setConfig({
      ...config,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    try {
      await api.put("/api/company/config", config);
      pushToast('success', 'Lưu cấu hình thành công!');
    } catch (error) {
      pushToast('error', 'Lỗi khi lưu cấu hình! Vui lòng thử lại.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Đang nạp cấu hình hệ thống...</div>;
  if (!config) return <div className="py-20 text-center text-rose-500 font-black">Không thể tải cấu hình</div>;

  const inputClass = "w-full bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-3 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 ml-1";
  const headerClass = "text-xl font-black border-b border-black/5 dark:border-white/10 pb-4 mb-8 text-slate-900 dark:text-white uppercase tracking-tighter italic";

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
      <form onSubmit={handleSave} className="space-y-12">
      <div>
        <h2 className={headerClass}>Giờ làm việc mặc định</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className={labelClass}>Giờ bắt đầu</label>
            <input type="time" name="workStartTime" value={config.workStartTime} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Giờ kết thúc</label>
            <input type="time" name="workEndTime" value={config.workEndTime} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bắt đầu nghỉ trưa</label>
            <input type="time" name="lunchBreakStart" value={config.lunchBreakStart} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Kết thúc nghỉ trưa</label>
            <input type="time" name="lunchBreakEnd" value={config.lunchBreakEnd} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <h2 className={headerClass}>Tham số chấm công & Lương</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>Số giờ chuẩn/ngày</label>
            <input type="number" step="0.5" name="standardHours" value={config.standardHours} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Số ngày công chuẩn/tháng</label>
            <input type="number" name="standardDaysPerMonth" value={config.standardDaysPerMonth} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ngày chốt công</label>
            <input type="number" name="cutoffDay" value={config.cutoffDay} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <h2 className={headerClass}>Hệ số OT & Nghỉ phép</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className={labelClass}>OT Ngày thường</label>
            <input type="number" step="0.1" name="otRateWeekday" value={config.otRateWeekday} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>OT Cuối tuần</label>
            <input type="number" step="0.1" name="otRateWeekend" value={config.otRateWeekend} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>OT Ngày lễ</label>
            <input type="number" step="0.1" name="otRateHoliday" value={config.otRateHoliday} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nghỉ lễ bù</label>
            <input type="number" step="0.1" name="otRateHolidayComp" value={config.otRateHolidayComp} onChange={handleChange} className={inputClass} />
          </div>
          <div className="lg:mt-6">
            <label className={labelClass}>Nửa ngày Sáng</label>
            <input type="number" step="0.1" name="halfDayMorningRate" value={config.halfDayMorningRate} onChange={handleChange} className={inputClass} />
          </div>
          <div className="lg:mt-6">
            <label className={labelClass}>Nửa ngày Chiều</label>
            <input type="number" step="0.1" name="halfDayAfternoonRate" value={config.halfDayAfternoonRate} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t border-black/5 dark:border-white/10">
        <button 
          type="submit" 
          disabled={saving} 
          className="bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white font-black uppercase tracking-widest py-4 px-12 rounded-2xl transition-all shadow-2xl shadow-indigo-500/30 disabled:opacity-50"
        >
          {saving ? "Đang cập nhật..." : "Lưu Thay đổi"}
        </button>
      </div>
    </form>
    </>
  );
}
