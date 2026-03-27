'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Avatar from '@/components/Avatar';
import { Employee } from '@/types';
import { formatDate, formatVND } from '@/lib/utils';

function StatusBadge({ status }: { status: Employee['status'] }) {
  const map: Record<Employee['status'], string> = {
    ACTIVE: 'bg-emerald-500 text-emerald-950 px-3',
    INACTIVE: 'bg-slate-500/20 text-slate-300 px-3 border-slate-500/20',
    PROBATION: 'bg-amber-500 text-amber-950 px-3',
    CONTRACT: 'bg-indigo-500 text-white px-3',
    COLLABORATOR: 'bg-purple-500 text-white px-3',
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

export default function EmployeeTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  async function fetchEmployees() {
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data as Employee[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchEmployees();
  }, []);

  if (loading) {
    return <div className="text-white/20 p-20 text-center font-black uppercase tracking-widest">Đang tải dữ liệu hồ sơ...</div>;
  }

  if (!employees.length) {
    return <div className="text-white/20 p-20 text-center font-black uppercase tracking-widest">Không có nhân viên nào trên hệ thống.</div>;
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 pb-4">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="text-[11px] uppercase text-white/30 tracking-widest border-b border-white/5">
          <tr>
            <th className="px-5 py-6 font-black">Hồ sơ</th>
            <th className="px-5 py-6 font-black">Thông tin liên hệ</th>
            <th className="px-5 py-6 font-black">Cấu trúc công ty</th>
            <th className="px-5 py-6 font-black">Trạng thái</th>
            <th className="px-5 py-6 font-black">Gia nhập</th>
            <th className="px-5 py-6 font-black">Lương</th>
            <th className="px-5 py-6 font-black text-right pr-10">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-white/[0.03] transition-all duration-300 group">
              <td className="px-5 py-5">
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="relative">
                    <Avatar name={emp.fullName} size="md" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${emp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  </div>
                  <div>
                    <Link href={`/employees/${emp.id}`} className="font-bold text-white text-base leading-tight hover:text-indigo-400 block transition-colors">{emp.fullName}</Link>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-tighter mt-1">{emp.id.split('-')[0]}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-5">
                <div className="space-y-0.5">
                  <div className="text-white/80 font-bold">{emp.email}</div>
                  <div className="text-white/30 text-xs tracking-tight">{emp.phone || 'Chưa cập nhật SĐT'}</div>
                </div>
              </td>
              <td className="px-5 py-5">
                <div className="space-y-0.5">
                  <div className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest">{emp.departmentName || 'Chung'}</div>
                  <div className="text-white/60 font-medium">{emp.positionName || 'Nhân viên'}</div>
                </div>
              </td>
              <td className="px-5 py-5"><StatusBadge status={emp.status} /></td>
              <td className="px-5 py-5">
                <div className="text-white/60 font-bold tracking-tight">{formatDate(emp.startDate)}</div>
              </td>
              <td className="px-5 py-5">
                <div className="text-emerald-400 font-bold tracking-tighter text-lg">{formatVND(emp.baseSalary)}</div>
              </td>
              <td className="px-5 py-5 text-right pr-10">
                <Link
                  href={`/employees/${emp.id}`}
                  className="inline-flex items-center px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all shadow-lg active:scale-95"
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
