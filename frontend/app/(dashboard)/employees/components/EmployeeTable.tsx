'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Avatar from '@/components/Avatar';
import { Employee } from '@/types';
import { formatDate, formatVND } from '@/lib/utils';

function StatusBadge({ status }: { status: Employee['status'] }) {
  const map: Record<Employee['status'], string> = {
    ACTIVE: 'bg-emerald-500 text-white dark:text-emerald-950 px-3',
    INACTIVE: 'bg-slate-200 dark:bg-slate-500/20 text-slate-500 dark:text-slate-300 px-3 border-transparent dark:border-slate-500/20',
    PROBATION: 'bg-amber-500 text-white dark:text-amber-950 px-3',
    CONTRACT: 'bg-indigo-600 dark:bg-indigo-500 text-white px-3',
    COLLABORATOR: 'bg-purple-600 dark:bg-purple-500 text-white px-3',
  };

  const label: Record<Employee['status'], string> = {
    ACTIVE: 'Đang làm việc',
    INACTIVE: 'Ngưng hoạt động',
    PROBATION: 'Thử việc',
    CONTRACT: 'Hợp đồng',
    COLLABORATOR: 'Cộng tác viên',
  };

  return (
    <span className={`inline-flex items-center py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export default function EmployeeTable({ search = '' }: { search?: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        const res = await api.get('/api/employees', { params: { search } });
        setEmployees(res.data as Employee[]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  if (loading) {
    return <div className="text-slate-400 dark:text-white/20 p-20 text-center font-black uppercase tracking-widest">Đang tải dữ liệu hồ sơ...</div>;
  }

  if (!employees.length) {
    return <div className="text-slate-400 dark:text-white/20 p-20 text-center font-black uppercase tracking-widest">Không có nhân viên nào trên hệ thống.</div>;
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 pb-4 bg-[#0f1123]/75 dark:bg-transparent backdrop-blur-[16px] dark:backdrop-blur-none rounded-[16px] dark:rounded-none border border-white/10 dark:border-none p-1">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="text-[11px] uppercase tracking-widest bg-black/30 dark:bg-transparent border-b border-white/10 dark:border-white/10">
          <tr className="text-[#e2e8f0] dark:text-white/50">
            <th className="px-5 py-6 font-black uppercase tracking-[0.2em]">Hồ sơ</th>
            <th className="px-5 py-6 font-black uppercase tracking-[0.2em]">Thông tin liên hệ</th>
            <th className="px-5 py-6 font-black uppercase tracking-[0.2em]">Cấu trúc công ty</th>
            <th className="px-5 py-6 font-black uppercase tracking-[0.2em]">Trạng thái</th>
            <th className="px-5 py-6 font-black uppercase tracking-[0.2em]">Gia nhập</th>
            <th className="px-5 py-6 font-black uppercase tracking-[0.2em]">Lương</th>
            <th className="px-5 py-6 font-black text-right pr-10 uppercase tracking-[0.2em]">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 dark:divide-white/5">
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-white/5 dark:hover:bg-white/[0.03] transition-all duration-300 group">
              <td className="px-5 py-6">
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="relative shrink-0">
                    <Avatar name={emp.fullName} size="md" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0f1123] dark:border-slate-900 ${emp.status === 'ACTIVE' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-400 dark:bg-slate-500 shadow-slate-500/50'}`} />
                  </div>
                  <div>
                    <Link href={`/employees/${emp.id}`} className="font-black text-[#e2e8f0] dark:text-white text-base leading-tight hover:text-indigo-400 dark:hover:text-indigo-400 block transition-colors uppercase tracking-tight">{emp.fullName}</Link>
                    <div className="text-[10px] font-black text-[#94a3b8] dark:text-white/40 uppercase tracking-tighter mt-1">{emp.id.split('-')[0]}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-6">
                <div className="space-y-1">
                  <div className="text-[#e2e8f0] dark:text-white/90 font-black text-xs uppercase tracking-tight">{emp.email}</div>
                  <div className="text-[#94a3b8] dark:text-white/50 text-[10px] font-bold tracking-widest uppercase">{emp.phone || 'Chưa cập nhật SĐT'}</div>
                </div>
              </td>
              <td className="px-5 py-6">
                <div className="space-y-1">
                  <div className="text-indigo-400 font-black uppercase text-[10px] tracking-widest">{emp.departmentName || 'Chung'}</div>
                  <div className="text-[#e2e8f0] dark:text-white/60 font-bold text-xs uppercase tracking-tight">{emp.positionName || 'Nhân viên'}</div>
                </div>
              </td>
              <td className="px-5 py-6"><StatusBadge status={emp.status} /></td>
              <td className="px-5 py-6">
                <div className="text-[#e2e8f0] dark:text-white/60 font-black tracking-tight text-xs uppercase">{formatDate(emp.startDate)}</div>
              </td>
              <td className="px-5 py-6">
                <div className="text-emerald-400 font-black tracking-tighter text-lg">{formatVND(emp.baseSalary)}</div>
              </td>
              <td className="px-5 py-6 text-right pr-10 whitespace-nowrap">
                <Link
                  href={`/employees/${emp.id}`}
                  className="inline-flex items-center justify-center whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white hover:bg-white hover:text-[#0f1123] transition-all shadow-lg active:scale-95 duration-300"
                >
                  CHI TIẾT
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
