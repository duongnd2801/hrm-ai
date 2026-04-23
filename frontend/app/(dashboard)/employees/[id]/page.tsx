'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios, { type AxiosResponse } from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Avatar from '@/components/Avatar';
import Toast, { ToastState } from '@/components/Toast';
import { Department, Employee, EmployeeProject, Position } from '@/types';
import { useSession } from '@/components/AuthProvider';
import { projectApi } from '@/lib/projectApi';

// Sub-components
import PersonalInfoSection from './components/PersonalInfoSection';
import IdentitySection from './components/IdentitySection';
import EmergencyContactSection from './components/EmergencyContactSection';
import EducationSection from './components/EducationSection';
import WorkStructureSection from './components/WorkStructureSection';
import ProjectSection from './components/ProjectSection';
import AccountStatusCard from './components/AccountStatusCard';
import { SelectOption } from '@/components/SearchableSelect';

type EmployeePageProps = {
  params: Promise<{ id: string }>;
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
  const [currentProjects, setCurrentProjects] = useState<EmployeeProject[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const permissions = session?.permissions ?? [];
  const isSelf = session?.employeeId === id;
  const canView = permissions.includes('EMP_VIEW');
  const canEditPersonal = isSelf || permissions.includes('EMP_UPDATE');
  const canEditStructure = permissions.includes('EMP_UPDATE');
  const canViewProjects = permissions.includes('PRJ_VIEW');
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
      const employees = (employeeRes.data.content || employeeRes.data) as Employee[];
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

        if (canViewProjects) {
          try {
            setCurrentProjects(await projectApi.getEmployeeCurrentProjects(id));
          } catch {
            setCurrentProjects([]);
            pushToast('error', 'Không thể tải danh sách dự án hiện tại của nhân viên.');
          }
        }
        
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
  }, [mounted, id, canEditStructure, canViewProjects, fetchMeta, forceCompleteProfile]);

  const manager1SelectOptions = useMemo<SelectOption[]>(() => {
    if (!emp) return [];
    const currentRank = getPositionRank(emp.positionName);
    return managerOptions
      .filter((candidate) => {
        if (candidate.status !== 'ACTIVE') return false;

        // System roles (Admin/Manager/HR) can manage each other (rank >= current)
        if (candidate.role === 'ADMIN' || candidate.role === 'MANAGER' || candidate.role === 'HR') {
           const candidateRank = getPositionRank(candidate.positionName);
           return currentRank >= 70 ? candidateRank >= currentRank : candidateRank > currentRank;
        }

        // Regular employees must be PM/Lead or above AND strictly higher rank
        const candidateRank = getPositionRank(candidate.positionName);
        return candidateRank >= 50 && candidateRank > currentRank;
      })
      .map((m) => ({
        id: m.id,
        label: m.fullName,
        subLabel: `${m.email}${m.positionName ? ` | ${m.positionName}` : ''}`,
      }));
  }, [emp, managerOptions]);

  const manager2SelectOptions = useMemo<SelectOption[]>(() => {
    if (!emp) return [];
    
    const m1 = managerOptions.find(o => o.id === emp.managerId);
    const m1Rank = m1 ? getPositionRank(m1.positionName) : getPositionRank(emp.positionName);
    
    return managerOptions
      .filter((candidate) => {
        if (candidate.id === emp.managerId) return false; // Vẫn nên tránh chọn trùng Level 1 và Level 2
        if (candidate.status !== 'ACTIVE') return false;

        const candidateRank = getPositionRank(candidate.positionName);

        if (candidate.role === 'ADMIN' || candidate.role === 'MANAGER' || candidate.role === 'HR') {
           return m1Rank >= 70 ? candidateRank >= m1Rank : candidateRank > m1Rank;
        }

        return candidateRank >= 50 && candidateRank > m1Rank;
      })
      .map((m) => ({
        id: m.id,
        label: m.fullName,
        subLabel: `${m.email}${m.positionName ? ` | ${m.positionName}` : ''}`,
      }));
  }, [emp, managerOptions]);

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
      const res = await api.get(`/api/employees/${id}`);
      setEmp(res.data as Employee);
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, 'Lỗi khi lưu trữ dữ liệu.'));
    } finally {
      setSaving(false);
    }
  }

  const handleUpdate = (updates: Partial<Employee>) => {
    if (emp) setEmp({ ...emp, ...updates });
  };

  if (!mounted || !session) return null;
  if (!canView) return <div className="text-rose-400 p-20 text-center font-black uppercase tracking-widest">Bạn không có quyền xem hồ sơ nhân viên.</div>;
  if (loading) return <div className="text-white/20 p-20 text-center font-black uppercase tracking-[0.2em]">Đang đồng bộ hồ sơ...</div>;
  if (error) return <div className="text-rose-400 p-20 text-center font-black uppercase tracking-widest">{error}</div>;
  if (!emp) return null;

  return (
    <div className="relative isolate space-y-10 pb-20">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      <div className="relative pt-10 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8 text-center sm:text-left">
            <div className="relative group flex-shrink-0">
              <Avatar name={emp.fullName} size="xl" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-0 group-hover:opacity-30 transition-all duration-300" />
            </div>
            <div className="space-y-4 min-w-0">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight break-words">
                {emp.fullName}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 whitespace-nowrap">
                  {emp.positionName || 'Nhân viên'}
                </span>
                <span className="px-4 py-2 rounded-full bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/20 text-slate-900/70 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                  {emp.departmentName || 'Chung'}
                </span>
                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${
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

          <div className="flex gap-3 mt-4 md:mt-0 self-center md:self-end shrink-0">
            <button
              type="button"
              onClick={() => router.push('/employees')}
              className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 border border-white/10 hover:border-white/20 whitespace-nowrap"
            >
              ← QUAY LẠI
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-10">
            <PersonalInfoSection 
              emp={emp} 
              onChange={handleUpdate} 
              disabled={!canEditPersonal} 
              canEditStructure={canEditStructure} 
            />
            
            <IdentitySection 
              emp={emp} 
              onChange={handleUpdate} 
              disabledPersonal={!canEditPersonal} 
              disabledStructure={!canEditStructure} 
            />

            <EmergencyContactSection 
              emp={emp} 
              onChange={handleUpdate} 
              disabled={!canEditPersonal} 
            />

            <EducationSection 
              emp={emp} 
              onChange={handleUpdate} 
              disabled={!canEditStructure} 
            />
         </div>

         <div className="space-y-10">
            <WorkStructureSection 
              emp={emp} 
              onChange={handleUpdate}
              departments={departments}
              positions={positions}
              manager1Options={manager1SelectOptions}
              manager2Options={manager2SelectOptions}
              canEditStructure={canEditStructure}
              disabledSave={saving || !canEditPersonal}
            />

            {canViewProjects && <ProjectSection projects={currentProjects} />}

            <AccountStatusCard emp={emp} />

            <button
              type="submit"
              disabled={saving || !canEditPersonal}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 disabled:from-white/10 disabled:via-white/10 disabled:to-white/10 disabled:text-white/20 text-white rounded-[24px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-purple-500/40 active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-3"
            >
              {saving && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'ĐANG LƯU...' : '💾 LƯU HỒ SƠ'}
            </button>
         </div>
      </form>
    </div>
  );
}
