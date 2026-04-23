'use client';

import React from 'react';
import { Department, Employee, Position } from '@/types';
import SearchableSelect, { SelectOption } from '@/components/SearchableSelect';
import { formatVND } from '@/lib/utils';

type Props = {
  emp: Employee;
  onChange: (updates: Partial<Employee>) => void;
  departments: Department[];
  positions: Position[];
  manager1Options: SelectOption[];
  manager2Options: SelectOption[];
  canEditStructure: boolean;
  disabledSave: boolean;
};

export default function WorkStructureSection({
  emp,
  onChange,
  departments,
  positions,
  manager1Options,
  manager2Options,
  canEditStructure,
  disabledSave,
}: Props) {
  const departmentSelectOptions = React.useMemo<SelectOption[]>(
    () => departments.map((d) => ({ id: d.id, label: d.name })),
    [departments]
  );

  const positionSelectOptions = React.useMemo<SelectOption[]>(
    () => positions.map((p) => ({ id: p.id, label: p.name, subLabel: p.description || undefined })),
    [positions]
  );

  return (
    <div className="relative group glass-dark backdrop-blur-xl rounded-[40px] p-10 shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-3xl transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[40px] transition-all duration-300" />

      <div className="relative z-10 flex items-center gap-3 mb-10">
        <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Cơ cấu & Lương</h3>
      </div>

      <div className="relative z-10 space-y-6">
        {canEditStructure ? (
          <>
            <SearchableSelect
              label="🏢 Phòng ban"
              value={emp.departmentId}
              options={departmentSelectOptions}
              placeholder="Chọn bộ phận..."
              allowClear
              onSelect={(nextId) => {
                const selected = departments.find((d) => d.id === nextId);
                onChange({ departmentId: nextId, departmentName: selected?.name });
              }}
            />
            <SearchableSelect
              label="👔 Chức danh"
              value={emp.positionId}
              options={positionSelectOptions}
              placeholder="Chọn chức vụ..."
              allowClear
              onSelect={(nextId) => {
                const selected = positions.find((p) => p.id === nextId);
                let autoRole = emp.role;
                if (selected) {
                  const posName = selected.name.toUpperCase();
                  if (posName.includes('HR')) {
                    autoRole = 'HR';
                  } else if (posName.includes('ADMIN') || posName.includes('CEO') || posName.includes('DIRECTOR')) {
                    autoRole = 'ADMIN';
                  } else if (posName.includes('PM') || posName.includes('MANAGER') || posName.includes('HEAD') || posName.includes('LEAD') || posName.includes('MNG')) {
                    autoRole = 'MANAGER';
                  } else {
                    autoRole = 'EMPLOYEE';
                  }
                }
                onChange({ positionId: nextId, positionName: selected?.name, role: autoRole as Employee['role'] });
              }}
            />
            <SearchableSelect
              label="🔑 Quyền hệ thống"
              value={emp.role}
              options={[
                { id: 'EMPLOYEE', label: 'Nhân viên (EMPLOYEE)' },
                { id: 'MANAGER', label: 'Quản lý (MANAGER)' },
                { id: 'HR', label: 'Nhân sự (HR)' },
                { id: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
              ]}
              placeholder="Chọn quyền..."
              onSelect={(nextId) => onChange({ role: nextId as Employee['role'] })}
            />
            <SearchableSelect
              label="👨‍💼 Người quản lý cấp 1"
              value={emp.managerId}
              options={manager1Options}
              placeholder="Chọn người quản lý cấp 1..."
              allowClear
              onSelect={(nextId) => {
                const selectedLabel = manager1Options.find((m) => m.id === nextId)?.label;
                onChange({ managerId: nextId, managerName: selectedLabel });
              }}
            />
            <SearchableSelect
              label="👨‍💼 Người quản lý cấp 2"
              value={emp.manager2Id}
              options={manager2Options}
              placeholder="Chọn người quản lý cấp 2..."
              allowClear
              onSelect={(nextId) => {
                const selectedLabel = manager2Options.find((m) => m.id === nextId)?.label;
                onChange({ manager2Id: nextId, manager2Name: selectedLabel });
              }}
            />
            <div>
              <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📅 Ngày vào công ty</label>
              <input type="date" value={emp.joinDate || ''}
                onChange={(e) => onChange({ joinDate: e.target.value })}
                className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300" />
            </div>
            <SearchableSelect
              label="✅ Trạng thái hồ sơ"
              value={emp.status}
              options={[
                { id: 'ACTIVE', label: 'Đang làm việc' },
                { id: 'PROBATION', label: 'Thử việc' },
                { id: 'CONTRACT', label: 'Hợp đồng' },
                { id: 'COLLABORATOR', label: 'Cộng tác viên' },
                { id: 'INACTIVE', label: 'Ngưng hoạt động' },
              ]}
              placeholder="Chọn trạng thái..."
              onSelect={(nextId) => onChange({ status: nextId as Employee['status'] })}
            />
            <div>
              <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">💰 Lương cơ bản (VND)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black">₫</span>
                <input
                  type="number"
                  value={emp.baseSalary || 0}
                  onChange={(e) => onChange({ baseSalary: Number(e.target.value) })}
                  className="w-full pl-8 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-emerald-600 dark:text-emerald-400 font-black text-lg focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent rounded-2xl border border-indigo-500/20 dark:border-indigo-500/25 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">🏢 Bộ phận / Phòng ban</p>
              <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{emp.departmentName || 'Chung'}</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent rounded-2xl border border-indigo-500/20 dark:border-indigo-500/25 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">👔 Chức danh / Vị trí</p>
              <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{emp.positionName || 'Nhân viên'}</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent rounded-2xl border border-indigo-500/20 dark:border-indigo-500/25 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300">
              <p className="text-[10px] font-black text-slate-400 dark:text-emerald-300/60 uppercase tracking-widest mb-2">💰 Mức lương hiện tại</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{formatVND(emp.baseSalary)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent rounded-2xl border border-indigo-500/20 dark:border-indigo-500/25 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">📅 Tham gia từ</p>
                <p className="text-sm font-black text-slate-900 dark:text-white tracking-widest">{emp.startDate ? new Date(emp.startDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
              </div>
              <div className={`p-5 rounded-2xl border backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${
                emp.status === 'ACTIVE' ? 'bg-emerald-500/20 border-emerald-500/30 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
                emp.status === 'INACTIVE' ? 'bg-rose-500/20 border-rose-500/30 dark:bg-rose-500/10 dark:border-rose-500/20' :
                'bg-amber-500/20 border-amber-500/30 dark:bg-amber-500/10 dark:border-amber-500/20'
              }`}>
                <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">✅ Trạng thái</p>
                <p className={`text-sm font-black uppercase tracking-widest ${
                  emp.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' :
                  emp.status === 'INACTIVE' ? 'text-rose-600 dark:text-rose-400' :
                  'text-amber-600 dark:text-amber-400'
                }`}>
                  {emp.status === 'ACTIVE' ? 'Làm việc' : emp.status === 'PROBATION' ? 'Thử việc' : 'Hợp đồng/Khác'}
                </p>
              </div>
            </div>
            <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent rounded-2xl border border-indigo-500/20 dark:border-indigo-500/25 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">👨‍💼 Quản lý cấp 1</p>
              <p className="text-lg font-black text-slate-900 dark:text-white tracking-widest">{emp.managerName || 'Không có'}</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent rounded-2xl border border-indigo-500/20 dark:border-indigo-500/25 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">👨‍💼 Quản lý cấp 2</p>
              <p className="text-lg font-black text-slate-900 dark:text-white tracking-widest">{emp.manager2Name || 'Không có'}</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-transparent rounded-2xl border border-sky-500/20 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <p className="text-[10px] font-black text-slate-400 dark:text-sky-300/60 uppercase tracking-widest mb-2">⏳ Thâm niên</p>
              <p className="text-lg font-black text-sky-600 dark:text-sky-400 tracking-tight">
                {(() => {
                  const ref = emp.joinDate || emp.startDate;
                  if (!ref) return 'N/A';
                  const start = new Date(ref);
                  const now = new Date();
                  const years = now.getFullYear() - start.getFullYear();
                  const months = now.getMonth() - start.getMonth();
                  const totalMonths = years * 12 + months;
                  if (totalMonths < 1) return 'Mới vào';
                  if (totalMonths < 12) return `${totalMonths} tháng`;
                  const y = Math.floor(totalMonths / 12);
                  const m = totalMonths % 12;
                  return m > 0 ? `${y} năm ${m} tháng` : `${y} năm`;
                })()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
