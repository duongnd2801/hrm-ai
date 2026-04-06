import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';
import type { Employee } from '@/types';
import SearchableSelect from '@/components/SearchableSelect';

interface ProjectMemberDialogProps {
  projectId: string;
  currentMemberIds?: string[];
  onClose: () => void;
  onSave: (data: { employeeId: string; role: string; joinedAt?: string; leftAt?: string }) => Promise<void>;
}

export default function ProjectMemberDialog({ projectId, currentMemberIds = [], onClose, onSave }: ProjectMemberDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    role: 'DEV',
    joinedAt: new Date().toISOString().split('T')[0],
    leftAt: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch employee list for select dropdown
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/api/employees?size=1000');
        setEmployees(response.data.content || response.data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách nhân viên", err);
      }
    };
    fetchEmployees();
  }, []);

  const employeeOptions = useMemo(() => {
    return employees
      .filter(emp => !currentMemberIds.includes(emp.id))
      .map(emp => ({
        id: emp.id,
        label: emp.fullName,
        subLabel: `${emp.email} ${emp.positionName ? `- ${emp.positionName}` : ''}`
      }));
  }, [employees, currentMemberIds]);

  const roleOptions = [
    { id: 'DEV', label: 'Lập trình viên (DEV)' },
    { id: 'PM', label: 'Quản lý dự án (PM)' },
    { id: 'QA', label: 'Kiểm thử (QA)' },
    { id: 'TESTER', label: 'Kiểm thử (Tester)' },
    { id: 'BA', label: 'Phân tích (BA)' },
    { id: 'DESIGNER', label: 'Thiết kế (Designer)' },
    { id: 'COMTER', label: 'Biên phiên dịch (Comter)' },
    { id: 'GUEST', label: 'Khách (Guest)' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave({
      ...formData,
      leftAt: formData.leftAt ? formData.leftAt : undefined
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg flex flex-col pt-2 relative">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Thêm nhân sự vào dự án</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form id="member-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-4">
              <SearchableSelect
                label="Nhân viên"
                value={formData.employeeId}
                options={employeeOptions}
                placeholder="--- Bấm để tìm kiếm nhân viên ---"
                onSelect={(id) => setFormData(prev => ({ ...prev, employeeId: id || '' }))}
              />
            </div>

            <div className="space-y-4">
              <SearchableSelect
                label="Vai trò"
                value={formData.role}
                options={roleOptions}
                placeholder="--- Chọn vai trò ---"
                onSelect={(id) => setFormData(prev => ({ ...prev, role: id || 'DEV' }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày tham gia</label>
                <input
                  type="date"
                  name="joinedAt"
                  value={formData.joinedAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày rời dự án</label>
                <input
                  type="date"
                  name="leftAt"
                  value={formData.leftAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="member-form"
            disabled={loading || !formData.employeeId}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang thêm...' : 'Lưu thành viên'}
          </button>
        </div>

      </div>
    </div>
  );
}
