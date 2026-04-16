'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios, { type AxiosResponse } from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Avatar from '@/components/Avatar';
import Toast, { ToastState } from '@/components/Toast';
import { Department, Employee, Position } from '@/types';
import { formatVND } from '@/lib/utils';
import { useSession } from '@/components/AuthProvider';
import SearchableSelect from '@/components/SearchableSelect';

type EmployeePageProps = {
  params: Promise<{ id: string }>;
};

type SelectOption = {
  id: string;
  label: string;
  subLabel?: string;
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data;
  if (typeof data === 'string') return data;
  return (data as { message?: string } | undefined)?.message || fallback;
}

function getPositionRank(positionName?: string): number {
  const raw = (positionName || '').toUpperCase();
  if (!raw) return 0;
  if (raw.includes('CEO') || raw.includes('DIRECTOR') || raw.includes('ADMIN')) return 90;
  if (raw.includes('HR')) return 80;
  if (raw.includes('MANAGER') || raw.includes('MNG')) return 70;
  if (raw.includes('HEAD') || raw.includes('LEAD')) return 60;
  if (raw.includes('PM')) return 50;
  if (raw.includes('SENIOR')) return 40;
  if (raw.includes('DEV') || raw.includes('ENGINEER')) return 30;
  if (raw.includes('TEST') || raw.includes('QA')) return 20;
  if (raw.includes('INTERN') || raw.includes('COLLAB')) return 10;
  return 15;
}

export default function EmployeeDetailPage({ params }: EmployeePageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSession();

  const [mounted, setMounted] = useState(false);
  const [emp, setEmp] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managerOptions, setManagerOptions] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const permissions = session?.permissions ?? [];
  const isSelf = session?.employeeId === id;
  const canView = permissions.includes('EMP_VIEW');
  const canEditPersonal = isSelf || permissions.includes('EMP_UPDATE');
  const canEditStructure = permissions.includes('EMP_UPDATE');
  const forceCompleteProfile = searchParams.get('completeProfile') === '1';

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  const fetchMeta = useCallback(async (employeeId: string) => {
    try {
      const [deptRes, posRes, employeeRes] = await Promise.all([
        api.get('/api/company/departments'),
        api.get('/api/company/positions'),
        api.get('/api/employees?size=1000'),
      ]);

      setDepartments(deptRes.data as Department[]);
      setPositions(posRes.data as Position[]);
      const employees = ((employeeRes.data.content || employeeRes.data) as Employee[]).filter((e) => e.id !== employeeId);
      setManagerOptions(employees);
    } catch {
      pushToast('error', 'Không thể tải dữ liệu cấu trúc công ty.');
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const tasks: Promise<unknown>[] = [api.get(`/api/employees/${id}`)];
        if (canEditStructure) tasks.push(fetchMeta(id));
        const [res] = await Promise.all(tasks);
        setEmp((res as AxiosResponse<Employee>).data);
        
        if (forceCompleteProfile) {
          pushToast('error', 'Vui lòng bổ sung đầy đủ: Số điện thoại, Ngày sinh và Địa chỉ để hoàn tất hồ sơ!');
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Không thể truy cập hồ sơ nhân viên này.'));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [mounted, id, canEditStructure, fetchMeta, forceCompleteProfile]);

  const departmentSelectOptions = useMemo<SelectOption[]>(
    () => departments.map((d) => ({ id: d.id, label: d.name })),
    [departments]
  );
  const positionSelectOptions = useMemo<SelectOption[]>(
    () => positions.map((p) => ({ id: p.id, label: p.name, subLabel: p.description || undefined })),
    [positions]
  );
  const eligibleManagers = useMemo(() => {
    if (!emp) return [];
    const currentRank = getPositionRank(emp.positionName);
    return managerOptions.filter((candidate) => {
      // Primary managers: ADMIN, MANAGER, or HR roles always eligible
      if (candidate.role === 'ADMIN' || candidate.role === 'MANAGER' || candidate.role === 'HR') return true;
      // Otherwise fallback to position rank comparison
      return getPositionRank(candidate.positionName) > currentRank;
    });
  }, [emp, managerOptions]);
  const managerSelectOptions = useMemo<SelectOption[]>(
    () =>
      eligibleManagers.map((m) => ({
        id: m.id,
        label: m.fullName,
        subLabel: `${m.email}${m.positionName ? ` | ${m.positionName}` : ''}`,
      })),
    [eligibleManagers]
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!emp) return;

    setSaving(true);
    try {
      if (canEditStructure) {
        await api.put(`/api/employees/${id}`, emp);
      } else {
        await api.patch(`/api/employees/${id}/personal`, {
          phone: emp.phone,
          address: emp.address,
          bio: emp.bio,
          gender: emp.gender,
          birthDate: emp.birthDate,
          personalEmail: emp.personalEmail,
          emergencyContactName: emp.emergencyContactName,
          emergencyContactRelationship: emp.emergencyContactRelationship,
          emergencyContactPhone: emp.emergencyContactPhone,
        });
      }
      pushToast('success', 'Đã lưu thay đổi hồ sơ thành công.');
      // Refresh local data instead of hard redirect
      const res = await api.get(`/api/employees/${id}`);
      setEmp(res.data as Employee);
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, 'Lỗi khi lưu trữ dữ liệu.'));
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;
  if (!session) return null;
  if (!canView) return <div className="text-rose-400 p-20 text-center font-black uppercase tracking-widest">Bạn không có quyền xem hồ sơ nhân viên.</div>;
  if (loading) return <div className="text-white/20 p-20 text-center font-black uppercase tracking-[0.2em]">Đang đồng bộ hồ sơ...</div>;
  if (error) return <div className="text-rose-400 p-20 text-center font-black uppercase tracking-widest">{error}</div>;
  if (!emp) return null;

  return (
    <div className="space-y-10 pb-20">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Title Section with Enhanced Styling */}
      <div className="pt-10">
        {/* Gradient Background */}
        <div className="absolute -z-10 top-0 left-1/2 w-full h-96 bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent blur-3xl translate-x-0" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex items-center gap-6 md:gap-8">
            <div className="relative group flex-shrink-0">
              <Avatar name={emp.fullName} size="xl" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-0 group-hover:opacity-30 transition-all duration-300" />
              <div className="absolute inset-2 rounded-full border-2 border-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight">
                {emp.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30">
                  {emp.positionName || 'Nhân viên'}
                </span>
                <span className="px-4 py-2 rounded-full bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/20 text-slate-900/70 dark:text-white/70 text-xs font-bold uppercase tracking-widest">
                  {emp.departmentName || 'Chung'}
                </span>
                <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${
                  emp.status === 'ACTIVE' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' :
                  emp.status === 'INACTIVE' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' :
                  'bg-amber-500/20 border-amber-500/50 text-amber-300'
                }`}>
                  {emp.status === 'ACTIVE' ? 'Đang làm việc' : 
                   emp.status === 'INACTIVE' ? 'Ngưng hoạt động' :
                   emp.status === 'PROBATION' ? 'Thử việc' : emp.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              type="button"
              onClick={() => router.push('/employees')}
              className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black text-xs uppercase tracking-widest transition-all duration-300 border border-white/10 hover:border-white/20"
            >
              ← QUAY LẠI
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Left Column: Essential Info */}
         <div className="lg:col-span-2 space-y-10">
            {/* Personal Info Card */}
            <div className="relative group glass-dark rounded-[40px] p-10 shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-3xl transition-all duration-300 overflow-hidden">
               {/* Gradient overlay on hover */}
               <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[40px] transition-all duration-300" />
               
               <div className="relative z-10 flex items-center gap-3 mb-10">
                  <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Thông tin cá nhân</h3>
               </div>
               
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                  {canEditStructure && (
                      <>
                          <div className="md:col-span-1">
                            <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">👤 Họ và Tên</label>
                            <input
                              type="text"
                              value={emp.fullName || ''}
                              onChange={(e) => setEmp({ ...emp, fullName: e.target.value })}
                              className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">✉️ Email đăng nhập</label>
                            <input
                              type="email"
                              value={emp.email || ''}
                              onChange={(e) => setEmp({ ...emp, email: e.target.value })}
                              className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300"
                            />
                          </div>
                      </>
                  )}
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📱 Số điện thoại</label>
                    <input
                      type="text"
                      value={emp.phone || ''}
                      placeholder="Chưa cập nhật"
                      onChange={(e) => setEmp({ ...emp, phone: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🎂 Ngày sinh</label>
                    <input
                      type="date"
                      value={emp.birthDate || ''}
                      onChange={(e) => setEmp({ ...emp, birthDate: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <SearchableSelect
                      label="⚧ Giới tính"
                      value={emp.gender}
                      options={[
                        { id: 'MALE', label: 'Nam' },
                        { id: 'FEMALE', label: 'Nữ' },
                        { id: 'OTHER', label: 'Khác' },
                      ]}
                      placeholder="Chọn giới tính..."
                      allowClear
                      disabled={!canEditPersonal}
                      onSelect={(nextId) => setEmp({ ...emp, gender: (nextId || undefined) as Employee['gender'] })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🏠 Địa chỉ thường trú</label>
                    <input
                      type="text"
                      value={emp.address || ''}
                      placeholder="Chưa cập nhật địa chỉ"
                      onChange={(e) => setEmp({ ...emp, address: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">✍️ Tiểu sử / Ghi chú</label>
                    <textarea
                      rows={4}
                      value={emp.bio || ''}
                      placeholder="Giới thiệu ngắn về bản thân, kỹ năng, thành tựu..."
                      onChange={(e) => setEmp({ ...emp, bio: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-4 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    />
                  </div>
               </div>
            </div>

            {/* CCCD / Căn cước Card */}
            <div className="relative group glass-dark rounded-[40px] p-10 shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-3xl transition-all duration-300 overflow-hidden">
               <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-[40px] transition-all duration-300" />
               <div className="relative z-10 flex items-center gap-3 mb-10">
                  <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">🪪 Căn cước công dân</h3>
               </div>
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📧 Email cá nhân</label>
                    <input type="email" value={emp.personalEmail || ''} placeholder="email.canhan@gmail.com"
                      onChange={(e) => setEmp({ ...emp, personalEmail: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-amber-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🆔 Số CCCD/CMND</label>
                    <input type="text" value={emp.citizenId || ''} placeholder="079095xxxxxx"
                      onChange={(e) => setEmp({ ...emp, citizenId: e.target.value })}
                      disabled={!canEditStructure}
                      className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-amber-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📅 Ngày cấp</label>
                    <input type="date" value={emp.citizenIdDate || ''}
                      onChange={(e) => setEmp({ ...emp, citizenIdDate: e.target.value })}
                      disabled={!canEditStructure}
                      className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-amber-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📍 Nơi cấp</label>
                    <input type="text" value={emp.citizenIdPlace || ''} placeholder="Công an TP. Hà Nội"
                      onChange={(e) => setEmp({ ...emp, citizenIdPlace: e.target.value })}
                      disabled={!canEditStructure}
                      className="w-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-amber-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
               </div>
            </div>

            {/* Người thân liên hệ Card */}
            <div className="relative group glass-dark rounded-[40px] p-10 shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-3xl transition-all duration-300 overflow-hidden">
               <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 rounded-[40px] transition-all duration-300" />
               <div className="relative z-10 flex items-center gap-3 mb-10">
                  <div className="w-2 h-8 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full" />
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">👨‍👩‍👧 Người thân liên hệ</h3>
               </div>
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">👤 Họ tên</label>
                    <input type="text" value={emp.emergencyContactName || ''} placeholder="Nguyễn Thị B"
                      onChange={(e) => setEmp({ ...emp, emergencyContactName: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-rose-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-rose-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">💞 Mối quan hệ</label>
                    <input type="text" value={emp.emergencyContactRelationship || ''} placeholder="Mẹ / Vợ / Chồng..."
                      onChange={(e) => setEmp({ ...emp, emergencyContactRelationship: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-rose-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-rose-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📱 Điện thoại</label>
                    <input type="text" value={emp.emergencyContactPhone || ''} placeholder="0987654321"
                      onChange={(e) => setEmp({ ...emp, emergencyContactPhone: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-rose-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-rose-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
               </div>
            </div>

            {/* Trình độ Card */}
            <div className="relative group glass-dark rounded-[40px] p-10 shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-3xl transition-all duration-300 overflow-hidden">
               <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-[40px] transition-all duration-300" />
               <div className="relative z-10 flex items-center gap-3 mb-10">
                  <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">🎓 Trình độ & Chứng chỉ</h3>
               </div>
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🏫 Trường đào tạo</label>
                    <input type="text" value={emp.university || ''} placeholder="ĐH Bách Khoa Hà Nội"
                      onChange={(e) => setEmp({ ...emp, university: e.target.value })}
                      disabled={!canEditStructure}
                      className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📚 Chuyên ngành</label>
                    <input type="text" value={emp.major || ''} placeholder="Công nghệ phần mềm"
                      onChange={(e) => setEmp({ ...emp, major: e.target.value })}
                      disabled={!canEditStructure}
                      className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🎓 Hệ đào tạo</label>
                    <input type="text" value={emp.educationLevel || ''} placeholder="Đại học / Cao đẳng / Thạc sĩ"
                      onChange={(e) => setEmp({ ...emp, educationLevel: e.target.value })}
                      disabled={!canEditStructure}
                      className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📆 Năm tốt nghiệp</label>
                    <input type="number" value={emp.graduationYear || ''} placeholder="2020"
                      onChange={(e) => setEmp({ ...emp, graduationYear: Number(e.target.value) || undefined })}
                      disabled={!canEditStructure}
                      className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">💻 Ngôn ngữ lập trình</label>
                    <input type="text" value={emp.programmingLanguages || ''} placeholder="Java, Python, TypeScript"
                      onChange={(e) => setEmp({ ...emp, programmingLanguages: e.target.value })}
                      disabled={!canEditStructure}
                      className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🏅 Chứng chỉ CNTT</label>
                    <input type="text" value={emp.itCertificate || ''} placeholder="AWS SAA, CCNA, PMP..."
                      onChange={(e) => setEmp({ ...emp, itCertificate: e.target.value })}
                      disabled={!canEditStructure}
                      className="w-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 font-bold focus:ring-4 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column: Work & System info */}
         <div className="space-y-10">
            {/* Work Structure Card */}
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
                          setEmp({ ...emp, departmentId: nextId, departmentName: selected?.name });
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
                          setEmp({ ...emp, positionId: nextId, positionName: selected?.name, role: autoRole as Employee['role'] });
                        }}
                      />
                      <SearchableSelect
                        label="🔑 Quyền hệ thống (Hệ thống đăng nhập)"
                        value={emp.role}
                        options={[
                          { id: 'EMPLOYEE', label: 'Nhân viên (EMPLOYEE)' },
                          { id: 'MANAGER', label: 'Quản lý (MANAGER)' },
                          { id: 'HR', label: 'Nhân sự (HR)' },
                          { id: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
                        ]}
                        placeholder="Chọn quyền..."
                        onSelect={(nextId) => setEmp({ ...emp, role: nextId as Employee['role'] })}
                      />
                      <SearchableSelect
                        label="👨‍💼 Người quản lý cấp 1"
                        value={emp.managerId}
                        options={managerSelectOptions}
                        placeholder="Chọn người quản lý cấp 1..."
                        allowClear
                        onSelect={(nextId) => {
                          const selected = managerOptions.find((m) => m.id === nextId);
                          setEmp({ ...emp, managerId: nextId, managerName: selected?.fullName });
                        }}
                      />
                      <SearchableSelect
                        label="👨‍💼 Người quản lý cấp 2"
                        value={emp.manager2Id}
                        options={managerSelectOptions}
                        placeholder="Chọn người quản lý cấp 2..."
                        allowClear
                        onSelect={(nextId) => {
                          const selected = managerOptions.find((m) => m.id === nextId);
                          setEmp({ ...emp, manager2Id: nextId, manager2Name: selected?.fullName });
                        }}
                      />
                      <div>
                        <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">📅 Ngày vào công ty</label>
                        <input type="date" value={emp.joinDate || ''}
                          onChange={(e) => setEmp({ ...emp, joinDate: e.target.value })}
                          className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">✍️ Ngày ký HĐ</label>
                        <input type="date" value={emp.contractSigningDate || ''}
                          onChange={(e) => setEmp({ ...emp, contractSigningDate: e.target.value })}
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
                        onSelect={(nextId) => setEmp({ ...emp, status: nextId as Employee['status'] })}
                      />
                      {emp.status === 'INACTIVE' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-rose-500 dark:text-rose-400 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">🚫 Ngày nghỉ việc chính thức</label>
                          <input
                            type="date"
                            value={emp.endDate || ''}
                            onChange={(e) => setEmp({ ...emp, endDate: e.target.value })}
                            className="w-full bg-rose-500/10 border border-rose-500/20 rounded-2xl py-3 px-4 text-rose-600 dark:text-rose-400 font-bold focus:ring-4 focus:ring-rose-500/30 outline-none transition-all duration-300"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">💰 Lương cơ bản (VND)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black">₫</span>
                          <input
                            type="number"
                            value={emp.baseSalary || 0}
                            onChange={(e) => setEmp({ ...emp, baseSalary: Number(e.target.value) })}
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
                        <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent rounded-2xl border border-indigo-500/20 dark:border-indigo-500/25 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                           <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">⚧ Giới tính</p>
                           <p className="text-lg font-black text-slate-900 dark:text-white tracking-widest">
                             {emp.gender === 'MALE' ? 'Nam' : emp.gender === 'FEMALE' ? 'Nữ' : emp.gender === 'OTHER' ? 'Khác' : 'Chưa cập nhật'}
                           </p>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent rounded-2xl border border-indigo-500/20 dark:border-indigo-500/25 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300">
                           <p className="text-[10px] font-black text-slate-400 dark:text-emerald-300/60 uppercase tracking-widest mb-2">💰 Mức lương hiện tại</p>
                           <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{formatVND(emp.baseSalary)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent rounded-2xl border border-indigo-500/20 dark:border-indigo-500/25 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                              <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">📅 Tham gia từ</p>
                              <p className="text-sm font-black text-slate-900 dark:text-white tracking-widest">{new Date(emp.startDate).toLocaleDateString('vi-VN')}</p>
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

                  <hr className="border-white/10 dark:border-white/5 mt-10 mb-8" />

                  <button
                    type="submit"
                    disabled={saving || !canEditPersonal}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 disabled:from-white/10 disabled:via-white/10 disabled:to-white/10 disabled:text-white/20 text-white rounded-[24px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-purple-500/40 active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-3"
                  >
                    {saving && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {saving ? 'ĐANG LƯU...' : '💾 LƯU HỒ SƠ'}
                  </button>
               </div>
            </div>

            {/* Account Status Card */}
            <div className="relative group glass-dark backdrop-blur-3xl rounded-[40px] p-10 shadow-2xl dark:shadow-3xl hover:shadow-3xl dark:hover:shadow-4xl transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[40px] transition-all duration-300" />
                
                <div className="relative z-10 text-center space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-600/60 dark:text-white/30 uppercase tracking-[0.2em] mb-5">🔑 Tài khoản hệ thống</p>
                      


                      <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full border text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                         emp.status === 'ACTIVE' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10' :
                         emp.status === 'INACTIVE' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-500/10' :
                         'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10'
                      }`}>
                         {emp.status === 'ACTIVE' ? '✓ Đang hoạt động' : 
                          emp.status === 'INACTIVE' ? '✕ Ngưng hoạt động / Khóa' :
                          emp.status === 'PROBATION' ? '⏳ Đang thử việc' :
                          '📄 Chính thức / Hợp đồng'}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-black/10 dark:border-white/10">
                      <h4 className="text-slate-900 dark:text-white font-black text-lg truncate mb-2">{emp.email}</h4>
                      <p className="text-slate-700/60 dark:text-white/40 text-xs font-bold tracking-widest">
                        ID: <span className="font-black text-indigo-400">{emp.id.split('-')[0].toUpperCase()}</span>
                      </p>
                    </div>
                </div>
            </div>
         </div>
      </form>
    </div>
  );
}
