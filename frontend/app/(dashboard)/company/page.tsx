"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { getRole } from "@/lib/auth";
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
    return <div className="text-gray-400">Đang tải tháng tin công ty...</div>;
  }

  if (!config) {
    return <div className="text-red-400">Không thể tải tháng tin công ty.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-white/10 bg-black/25 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Thông s- lm vic</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">Giờ lm vic: <span className="text-white">{config.workStartTime} - {config.workEndTime}</span></p>
            <p className="text-gray-300">Nghệ tra: <span className="text-white">{config.lunchBreakStart} - {config.lunchBreakEnd}</span></p>
            <p className="text-gray-300">Check-in sm tải a: <span className="text-white">{config.earlyCheckinMinutes} phệt</span></p>
            <p className="text-gray-300">Số gi- chuẩn/ngày: <span className="text-white">{config.standardHours}</span></p>
            <p className="text-gray-300">Ngày công chuẩn/tháng: <span className="text-white">{config.standardDaysPerMonth}</span></p>
            <p className="text-gray-300">Ngày chệt công: <span className="text-white">{config.cutoffDay}</span></p>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/25 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Hồ sơ lương & OT</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">OT ngày thường: <span className="text-white">{config.otRateWeekday}x</span></p>
            <p className="text-gray-300">OT cui tun: <span className="text-white">{config.otRateWeekend}x</span></p>
            <p className="text-gray-300">OT ngày l: <span className="text-white">{config.otRateHoliday}x</span></p>
            <p className="text-gray-300">OT nghỉ b- l: <span className="text-white">{config.otRateHolidayComp}x</span></p>
            <p className="text-gray-300">Na ngày sng: <span className="text-white">{config.halfDayMorningRate} ngày công</span></p>
            <p className="text-gray-300">Na ngày chiu: <span className="text-white">{config.halfDayAfternoonRate} ngày công</span></p>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-white/10 bg-black/25 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Phòng ban ({departments.length})</h3>
        <div className="flex flex-wrap gap-2">
          {departments.length === 0 ? (
            <span className="text-sm text-gray-400">Chưa c- phòng ban.</span>
          ) : (
            departments.map((department) => (
              <span key={department.id} className="px-3 py-1 rounded-full text-sm bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                {department.name}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-black/25 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Chức vụ & v- tr</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-emerald-300 mb-2">ang hot ng ({activePositions.length})</h4>
            <div className="space-y-2">
              {activePositions.length === 0 ? (
                <span className="text-sm text-gray-400">Không có dữ liệu.</span>
              ) : (
                activePositions.map((position) => (
                  <div key={position.id} className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
                    <p className="text-sm text-white font-medium">{position.name}</p>
                    <p className="text-xs text-gray-300 mt-1">{position.description || "Không c- m- t"}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-rose-300 mb-2">- khóa ({lockedPositions.length})</h4>
            <div className="space-y-2">
              {lockedPositions.length === 0 ? (
                <span className="text-sm text-gray-400">Không có dữ liệu.</span>
              ) : (
                lockedPositions.map((position) => (
                  <div key={position.id} className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-3">
                    <p className="text-sm text-white font-medium">{position.name}</p>
                    <p className="text-xs text-gray-300 mt-1">{position.description || "Không c- m- t"}</p>
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
  const role = getRole();
  const isAdmin = role === "ADMIN";
  const [activeTab, setActiveTab] = useState("config");

  return (
    <div className="p-6 max-w-7xl mx-auto w-full h-full flex flex-col text-white">
      <h1 className="text-3xl font-bold mb-6">{isAdmin ? "Cấu hình Tổ chức & Công ty" : "Thông tin công ty"}</h1>

      {isAdmin ? (
        <>
          <div className="flex space-x-4 border-b border-gray-700 mb-6 font-medium">
            <button
              className={`py-2 px-4 transition-colors ${activeTab === "config" ? "border-b-2 border-blue-400 text-blue-400" : "text-gray-400 hover:text-gray-200"}`}
              onClick={() => setActiveTab("config")}
            >
              Tham s- chuẩng
            </button>
            <button
              className={`py-2 px-4 transition-colors ${activeTab === "departments" ? "border-b-2 border-blue-400 text-blue-400" : "text-gray-400 hover:text-gray-200"}`}
              onClick={() => setActiveTab("departments")}
            >
              Phòng ban
            </button>
            <button
              className={`py-2 px-4 transition-colors ${activeTab === "positions" ? "border-b-2 border-blue-400 text-blue-400" : "text-gray-400 hover:text-gray-200"}`}
              onClick={() => setActiveTab("positions")}
            >
              Chức vụ & V- tr
            </button>
          </div>

          <div className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-white/10 flex-1 overflow-auto shadow-2xl">
            {activeTab === "config" && <CompanyConfigForm />}
            {activeTab === "departments" && <DepartmentTable />}
            {activeTab === "positions" && <PositionTable />}
          </div>
        </>
      ) : (
        <div className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-white/10 flex-1 overflow-auto shadow-2xl">
          <ReadOnlyCompanyInfo />
        </div>
      )}
    </div>
  );
}
