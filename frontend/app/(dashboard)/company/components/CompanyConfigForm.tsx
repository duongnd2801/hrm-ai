"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { CompanyConfig } from "@/types";

export default function CompanyConfigForm() {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
      alert("Lu cu hơnh thành công!");
    } catch (error) {
      alert("Li khi lưu cu hơnh!");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!config) return <div>Không thể tải cu hơnh</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h2 className="text-xl font-semibold border-b border-gray-700 pb-2">Giờ lm vic mc nh</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Giờ bt u</label>
          <input type="time" name="workStartTime" value={config.workStartTime} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Giờ kết thúc</label>
          <input type="time" name="workEndTime" value={config.workEndTime} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Bt u nghỉ tra</label>
          <input type="time" name="lunchBreakStart" value={config.lunchBreakStart} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Kết thúc nghỉ tra</label>
          <input type="time" name="lunchBreakEnd" value={config.lunchBreakEnd} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 pt-4">Tham s- chấm công & Lương</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Số gi- chuẩn/ngày</label>
          <input type="number" step="0.5" name="standardHours" value={config.standardHours} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Số ngày công chuẩn/tháng</label>
          <input type="number" name="standardDaysPerMonth" value={config.standardDaysPerMonth} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Ngày chệt công</label>
          <input type="number" name="cutoffDay" value={config.cutoffDay} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 pt-4">Hệ số OT & Nghệ phép</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Hệ số OT Ngày thường</label>
          <input type="number" step="0.1" name="otRateWeekday" value={config.otRateWeekday} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Hệ số OT Cui tun</label>
          <input type="number" step="0.1" name="otRateWeekend" value={config.otRateWeekend} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Hệ số OT Ngày l</label>
          <input type="number" step="0.1" name="otRateHoliday" value={config.otRateHoliday} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Hồ sơ nửa ngày Sáng</label>
          <input type="number" step="0.1" name="halfDayMorningRate" value={config.halfDayMorningRate} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Hồ sơ nửa ngày Chiều</label>
          <input type="number" step="0.1" name="halfDayAfternoonRate" value={config.halfDayAfternoonRate} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "ang lưu..." : "Lu Thay i"}
        </button>
      </div>
    </form>
  );
}
