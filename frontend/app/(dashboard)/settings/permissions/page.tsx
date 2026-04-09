'use client';

import { useEffect, useState } from 'react';
import { Key, Layers, Network, Search } from 'lucide-react';
import RbacConsoleNav from '@/components/RbacConsoleNav';
import Toast, { ToastState } from '@/components/Toast';
import { permissionApi } from '@/lib/permissionApi';
import { roleApi } from '@/lib/roleApi';
import type { PermissionDTO, RoleDTO } from '@/types';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionDTO[]>([]);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permissionsData, rolesData] = await Promise.all([
        permissionApi.getAllPermissions(),
        roleApi.getAllRoles(),
      ]);
      setPermissions(permissionsData);
      setRoles(rolesData);
    } catch {
      pushToast('error', 'Không thể tải danh sách permission');
    } finally {
      setLoading(false);
    }
  };

  const filteredPermissions = permissions.filter((permission) => {
    const keyword = searchTerm.toLowerCase();
    return (
      permission.name.toLowerCase().includes(keyword) ||
      permission.code.toLowerCase().includes(keyword) ||
      permission.module.toLowerCase().includes(keyword)
    );
  });

  const modules = Array.from(new Set(permissions.map((permission) => permission.module)));

  const getAssignedRoles = (code: string) =>
    roles.filter((role) => role.permissions.includes(code)).map((role) => role.name);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 animate-pulse">
          Đang tải permission...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-40 animate-in fade-in duration-1000">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
      <RbacConsoleNav />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-[24px] bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-xl dark:shadow-2xl relative">
              <Key className="w-8 h-8" />
              <div className="absolute inset-0 bg-indigo-400 blur-2xl opacity-0 dark:opacity-20" />
            </div>
            <h1
              className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white px-1 tracking-tighter uppercase leading-none"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
            >
              Permissions
            </h1>
          </div>
          <p className="text-sm font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.25em] ml-1.5 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-slate-300 dark:bg-white/20" />
            Danh mục quyền hạn trong hệ thống
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-initial lg:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-white/20 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Tìm theo tên, code, module..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[24px] py-4 pl-16 pr-8 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold tracking-wider placeholder:text-slate-300 dark:placeholder:text-white/10 shadow-sm dark:shadow-none"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-dark border border-slate-200 dark:border-white/5 rounded-[32px] p-6">
          <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.28em]">Tổng permission</p>
          <p className="mt-3 text-4xl font-black text-slate-900 dark:text-white tracking-tight">{permissions.length}</p>
        </div>
        <div className="glass-dark border border-slate-200 dark:border-white/5 rounded-[32px] p-6">
          <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.28em]">Module</p>
          <p className="mt-3 text-4xl font-black text-slate-900 dark:text-white tracking-tight">{modules.length}</p>
        </div>
        <div className="glass-dark border border-slate-200 dark:border-white/5 rounded-[32px] p-6">
          <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.28em]">Role đang dùng</p>
          <p className="mt-3 text-4xl font-black text-slate-900 dark:text-white tracking-tight">{roles.length}</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-5 rounded-3xl flex items-center gap-5 max-w-3xl">
        <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
          <Key className="w-5 h-5" />
        </div>
        <p className="text-[11px] font-bold text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed uppercase tracking-widest">
          Đây là danh mục quyền hạn hệ thống (chỉ đọc). Để gán hoặc bỏ quyền cho từng Role, vui lòng sử dụng <strong>Ma trận phân quyền</strong>.
        </p>
      </div>

      {/* Permission Cards by Module */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {modules.map((module) => {
          const modulePermissions = filteredPermissions.filter((permission) => permission.module === module);
          if (modulePermissions.length === 0) return null;

          return (
            <div key={module} className="glass-dark border border-slate-200 dark:border-white/5 rounded-[42px] p-8 space-y-8 overflow-hidden relative group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-white/5 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase">{module}</h2>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.18em] mt-1">
                    Nhóm quyền theo chức năng
                  </p>
                </div>
                <div className="ml-auto text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
                  {modulePermissions.length} quyền
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 relative z-10">
                {modulePermissions.map((permission) => {
                  const assignedRoles = getAssignedRoles(permission.code);

                  return (
                    <div
                      key={permission.id}
                      className="flex items-start justify-between p-5 rounded-[24px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all hover:bg-indigo-50/50 dark:hover:bg-white/[0.07] relative gap-4"
                    >
                      <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{permission.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest font-mono">
                          {permission.code}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-2 text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.18em]">
                            <Network className="w-3.5 h-3.5" />
                            Role đang dùng
                          </span>
                          {assignedRoles.length > 0 ? (
                            assignedRoles.map((roleName) => (
                              <span
                                key={`${permission.code}-${roleName}`}
                                className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 text-[8px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-[0.18em]"
                              >
                                {roleName}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] font-bold text-slate-300 dark:text-white/20 uppercase tracking-[0.16em]">
                              Chưa role nào gắn
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-600 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 blur-[100px] transition-opacity duration-1000 rounded-full" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
