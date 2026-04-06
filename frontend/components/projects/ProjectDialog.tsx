import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Project, ProjectStatus, ProjectType } from '@/types';

interface ProjectDialogProps {
  project: Project | null;
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
}

export default function ProjectDialog({ project, onClose, onSave }: ProjectDialogProps) {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    code: '',
    color: '#3b82f6', // Default blue
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'ACTIVE',
    type: 'PRODUCT_DEVELOPMENT',
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        code: project.code,
        color: project.color || '#3b82f6',
        description: project.description || '',
        startDate: project.startDate,
        endDate: project.endDate || '',
        status: project.status,
        type: project.type,
      });
    }
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // clean empty end date so it maps to null if empty
    const payload = {
      ...formData,
      endDate: formData.endDate ? formData.endDate : undefined
    };
    await onSave(payload);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            {project ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm rounded font-medium text-slate-700 dark:text-slate-300">Tên dự án <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="Nhập tên dự án"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mã dự án <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="code"
                  required
                  value={formData.code || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="VD: PRJ_ABC"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả dự án</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                placeholder="Nhập mô tả dự án..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày bắt đầu dự án <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="startDate"
                  required
                  value={formData.startDate || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ngày kết thúc dự án</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="ON_HOLD">Tạm dừng</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="OVERDUE">Đã quá hạn</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Loại dự án</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="PRODUCT_DEVELOPMENT">Phát triển sản phẩm</option>
                  <option value="OUTSOURCING">Outsourcing</option>
                  <option value="INTERNAL">Nội bộ</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                </select>
              </div>

              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Màu chủ đạo</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="color"
                    value={formData.color || '#3b82f6'}
                    onChange={handleChange}
                    className="w-10 h-10 p-0 border-0 rounded-lg cursor-pointer bg-transparent"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400 uppercase font-mono">
                    {formData.color}
                  </span>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Lưu dự án'}
          </button>
        </div>

      </div>
    </div>
  );
}
