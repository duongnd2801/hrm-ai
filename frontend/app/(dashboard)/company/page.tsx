"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/AuthProvider";
import CompanyConfigForm from "./components/CompanyConfigForm";
import DepartmentTable from "./components/DepartmentTable";
import PositionTable from "./components/PositionTable";

type CompanyTab = "config" | "departments" | "positions";

export default function CompanyPage() {
  const { session } = useSession();
  const permissions = session?.permissions ?? [];
  const canViewConfig = permissions.includes("COMP_VIEW");
  const canEditConfig = permissions.includes("COMP_UPDATE");
  const canViewDepartments = permissions.includes("DEPT_VIEW");
  const canManageDepartments = permissions.some((permission) =>
    ["DEPT_CREATE", "DEPT_UPDATE", "DEPT_DELETE"].includes(permission)
  );
  const canViewPositions = permissions.includes("POS_VIEW");
  const canManagePositions = permissions.some((permission) =>
    ["POS_CREATE", "POS_UPDATE", "POS_DELETE"].includes(permission)
  );
  const canTogglePositionLock = permissions.includes("POS_UPDATE");

  const tabs = useMemo(
    () =>
      [
        canViewConfig ? { key: "config" as const, label: "THAM SỐ" } : null,
        canViewDepartments ? { key: "departments" as const, label: "PHÒNG BAN" } : null,
        canViewPositions ? { key: "positions" as const, label: "VỊ TRÍ" } : null,
      ].filter(Boolean) as Array<{ key: CompanyTab; label: string }>,
    [canViewConfig, canViewDepartments, canViewPositions]
  );
  const [activeTab, setActiveTab] = useState<CompanyTab>("config");

  useEffect(() => {
    if (tabs.length && !tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [activeTab, tabs]);

  if (!session) return null;

  if (!tabs.length) {
    return (
      <div className="py-20 text-center text-slate-500 dark:text-white/40 font-black uppercase tracking-widest">
        Bạn không có quyền truy cập cấu hình công ty.
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-12 pb-20 px-2 lg:px-6">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between pt-6 md:pt-10 gap-6">
        <div className="max-w-full overflow-hidden">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white dark:text-white dark:mix-blend-overlay uppercase leading-[1.1] md:leading-none tracking-tighter break-words" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>CẤU HÌNH</h1>
          <p className="text-base md:text-lg font-bold text-white uppercase tracking-[0.2em] sm:tracking-widest mt-4 md:mt-6 ml-1" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>Tổ chức & Thiết lập hệ thống</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-2 rounded-2xl md:rounded-[24px] border border-black/5 dark:border-white/5 shadow-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 md:px-8 py-2 md:py-3 rounded-xl text-[10px] md:text-sm font-black tracking-widest transition-all ${activeTab === tab.key ? "bg-indigo-600 text-white shadow-xl scale-105" : "text-slate-500 dark:text-white/50 hover:bg-slate-900/5 dark:hover:bg-white/5"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl p-10 rounded-[40px] border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
        {activeTab === "config" && canViewConfig && <CompanyConfigForm readOnly={!canEditConfig} />}
        {activeTab === "departments" && canViewDepartments && <DepartmentTable canManage={canManageDepartments} />}
        {activeTab === "positions" && canViewPositions && (
          <PositionTable canManage={canManagePositions} canToggleLock={canTogglePositionLock} />
        )}
      </div>
    </div>
  );
}
