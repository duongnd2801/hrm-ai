"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/AuthProvider";
import { hasRole } from "@/lib/auth";
import api from "@/lib/api";
import { CompanyConfig, Department, Position } from "@/types";
import CompanyConfigForm from "./components/CompanyConfigForm";
import DepartmentTable from "./components/DepartmentTable";
import PositionTable from "./components/PositionTable";

function ReadOnlyCompanyInfo() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const [configRes, deptRes, posRes] = await Promise.all([
          api.get("/api/company/config"),
          api.get("/api/company/departments"),
          api.get("/api/company/positions"),
        ]);
        setConfig(configRes.data as CompanyConfig);
        setDepartments(deptRes.data as Department[]);
        setPositions(posRes.data as Position[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const activePositions = useMemo(() => positions.filter((p) => !p.isLocked), [positions]);
  const lockedPositions = useMemo(() => positions.filter((p) => p.isLocked), [positions]);

  if (loading) {
    return <div className="text-gray-400">Đang tải thông tin công ty...</div>;
  }

  if (!config) {
    return <div className="text-red-400">Không thể tải thông tin công ty.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 p-5 shadow-xl dark:shadow-3xl backdrop-blur-3xl">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">Thông số làm việc</h3>
          <div className="space-y-2 text-sm">
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">Giờ làm việc: <span className="text-slate-900 dark:text-white">{config.workStartTime} - {config.workEndTime}</span></p>
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">Nghỉ trưa: <span className="text-slate-900 dark:text-white">{config.lunchBreakStart} - {config.lunchBreakEnd}</span></p>
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">Check-in sớm tối đa: <span className="text-slate-900 dark:text-white">{config.earlyCheckinMinutes} phút</span></p>
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">Số giờ chuẩn/ngày: <span className="text-slate-900 dark:text-white">{config.standardHours}</span></p>
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">Ngày công chuẩn/tháng: <span className="text-slate-900 dark:text-white">{config.standardDaysPerMonth}</span></p>
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">Ngày chốt công: <span className="text-slate-900 dark:text-white">{config.cutoffDay}</span></p>
          </div>
        </section>

        <section className="rounded-xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 p-5 shadow-xl dark:shadow-3xl backdrop-blur-3xl">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">Hệ số lương & OT</h3>
          <div className="space-y-2 text-sm">
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">OT ngày thường: <span className="text-slate-900 dark:text-white">{config.otRateWeekday}x</span></p>
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">OT cuối tuần: <span className="text-slate-900 dark:text-white">{config.otRateWeekend}x</span></p>
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">OT ngày lễ: <span className="text-slate-900 dark:text-white">{config.otRateHoliday}x</span></p>
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">OT nghỉ bù lễ: <span className="text-slate-900 dark:text-white">{config.otRateHolidayComp}x</span></p>
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">Nửa ngày sáng: <span className="text-slate-900 dark:text-white">{config.halfDayMorningRate} ngày công</span></p>
            <p className="text-slate-500 dark:text-gray-300 font-bold uppercase tracking-tight">Nửa ngày chiều: <span className="text-slate-900 dark:text-white">{config.halfDayAfternoonRate} ngày công</span></p>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 p-5 shadow-xl dark:shadow-3xl backdrop-blur-3xl">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">Phòng ban ({departments.length})</h3>
        <div className="flex flex-wrap gap-2">
          {departments.length === 0 ? (
            <span className="text-sm text-gray-400">Chưa có phòng ban.</span>
          ) : (
            departments.map((department) => (
              <span key={department.id} className="px-3 py-1 rounded-full text-sm bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 border border-indigo-400/30">
                {department.name}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 p-5 shadow-xl dark:shadow-3xl backdrop-blur-3xl">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">Chức vụ & vị trí</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Đang hoạt động ({activePositions.length})</h4>
            <div className="space-y-2">
              {activePositions.length === 0 ? (
                <span className="text-sm text-gray-400">Không có dữ liệu.</span>
              ) : (
                activePositions.map((position) => (
                  <div key={position.id} className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
                    <p className="text-sm text-slate-900 dark:text-white font-medium">{position.name}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-300 mt-1">{position.description || "Không có mô tả"}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-2">Đã khóa ({lockedPositions.length})</h4>
            <div className="space-y-2">
              {lockedPositions.length === 0 ? (
                <span className="text-sm text-gray-400">Không có dữ liệu.</span>
              ) : (
                lockedPositions.map((position) => (
                  <div key={position.id} className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-3">
                    <p className="text-sm text-slate-900 dark:text-white font-medium">{position.name}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-300 mt-1">{position.description || "Không có mô tả"}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CompanyPage() {
  const { session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("config");

  useEffect(() => {
    // No longer redirect
  }, [session, router]);

  if (!session) return null;

  const isAdmin = hasRole('ADMIN');
  const canEdit = isAdmin; // Following GEMINI.md, only ADMIN can edit company setup

  return (
    <div className="space-y-12 pb-20 px-2 lg:px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between pt-10">
        <div>
          <h1 className="text-[clamp(3rem,8vw,6rem)] font-black text-white dark:text-white dark:mix-blend-overlay uppercase leading-none tracking-tighter" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>CẤU HÌNH</h1>
          <p className="text-lg font-bold text-white uppercase tracking-widest mt-6 ml-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Tổ chức & Thiết lập hệ thống</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-black/5 dark:border-white/5 shadow-xl mt-8 md:mt-0 px-4 py-3">
            <button
              onClick={() => setActiveTab("config")}
              className={`px-8 py-3 rounded-xl text-sm font-black tracking-widest transition-all ${activeTab === "config" ? "bg-indigo-600 text-white shadow-xl scale-105" : "text-slate-500 dark:text-white/50 hover:bg-slate-900/5 dark:hover:bg-white/5"}`}
            >
              THAM SỐ
            </button>
            <button
              onClick={() => setActiveTab("departments")}
              className={`px-8 py-3 rounded-xl text-sm font-black tracking-widest transition-all ${activeTab === "departments" ? "bg-indigo-600 text-white shadow-xl scale-105" : "text-slate-500 dark:text-white/50 hover:bg-slate-900/5 dark:hover:bg-white/5"}`}
            >
              PHÒNG BAN
            </button>
            <button
              onClick={() => setActiveTab("positions")}
              className={`px-8 py-3 rounded-xl text-sm font-black tracking-widest transition-all ${activeTab === "positions" ? "bg-indigo-600 text-white shadow-xl scale-105" : "text-slate-500 dark:text-white/50 hover:bg-slate-900/5 dark:hover:bg-white/5"}`}
            >
              VỊ TRÍ
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl p-10 rounded-[40px] border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
        {isAdmin ? (
          <>
            {activeTab === "config" && <CompanyConfigForm />}
            {activeTab === "departments" && <DepartmentTable />}
            {activeTab === "positions" && <PositionTable />}
          </>
        ) : (
          <ReadOnlyCompanyInfo />
        )}
      </div>
    </div>
  );
}
