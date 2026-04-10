'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import type { RoleDTO, Department, Position } from '@/types';
import SearchableSelect from '@/components/SearchableSelect';

export default function CreateEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    startDate: new Date().toISOString().split('T')[0],
    role: '',
    departmentId: '',
    positionId: '',
  });
  
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
       try {
          const [rRes, dRes, pRes] = await Promise.all([
             api.get('/api/roles'),
             api.get('/api/company/departments'),
             api.get('/api/company/positions')
          ]);
          setRoles(rRes.data);
          setDepartments(dRes.data);
          setPositions(pRes.data);
          
          if (rRes.data.length > 0) {
            const empRole = rRes.data.find((r: any) => r.name === 'EMPLOYEE');
            setFormData(prev => ({ ...prev, role: empRole ? 'EMPLOYEE' : rRes.data[0].name }));
          }
       } catch (err) {
          console.error('Lỗi khi tải cấu hình:', err);
       }
    }
    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/employees', {
        ...formData,
        departmentId: formData.departmentId || null,
        positionId: formData.positionId || null,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Lỗi tạo nhân viên mới.');
      } else {
        setError('Lỗi tạo nhân viên mới.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-lg p-4 overflow-y-auto">
       <div className="bg-white/95 dark:bg-slate-900 border border-white/20 w-full max-w-[480px] rounded-[64px] p-12 shadow-[0_32px_80px_rgba(0,0,0,0.1)] relative animate-in fade-in zoom-in duration-500 my-auto">
        
        <button onClick={onClose} className="absolute top-10 right-10 text-slate-400 dark:text-white/20 hover:text-indigo-600 dark:hover:text-white transition-all active:scale-90">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-[26px] font-black text-slate-900 dark:text-white mb-10 uppercase tracking-tighter leading-none text-center">
          Thêm nhân viên thủ công
        </h2>

        <div className="space-y-6">
          <div className="space-y-2.5">
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/40 dark:text-white/30 ml-2">Họ tên nhân viên</label>
            <input
              required
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-slate-100/50 dark:bg-white/5 border-none rounded-[24px] py-4 px-8 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-[15px]"
            />
          </div>

          <div className="space-y-2.5">
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/40 dark:text-white/30 ml-2">Email công ty</label>
            <input
              required
              type="email"
              placeholder="email@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-100/50 dark:bg-white/5 border-none rounded-[24px] py-4 px-8 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-[15px]"
            />
          </div>

          <div className="space-y-2.5">
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/40 dark:text-white/30 ml-2">Ngày vào làm</label>
            <input
              required
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full bg-slate-100/50 dark:bg-white/5 border-none rounded-[24px] py-4 px-8 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-sm uppercase tracking-widest"
            />
          </div>

          {/* Use specific Z-indexes to ensure dropdowns stack correctly */}
          <div className="space-y-2.5 relative z-[30]">
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/40 dark:text-white/30 ml-2">Cấp bậc (Role)</label>
            <SearchableSelect
              label=""
              value={formData.role}
              placeholder="Chọn Role..."
              options={roles.map(r => ({ id: r.name, label: r.name, subLabel: r.description }))}
              onSelect={(val) => setFormData({ ...formData, role: val || '' })}
            />
          </div>

          <div className="space-y-2.5 relative z-[20]">
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/40 dark:text-white/30 ml-2">Phòng ban</label>
            <SearchableSelect
              label=""
              value={formData.departmentId}
              placeholder="Chọn phòng ban..."
              options={departments.map(d => ({ id: d.id, label: d.name }))}
              onSelect={(val) => setFormData({ ...formData, departmentId: val || '' })}
              allowClear
              clearLabel="-- Không chọn --"
            />
          </div>

          <div className="space-y-2.5 relative z-[10]">
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900/40 dark:text-white/30 ml-2">Vị trí công việc</label>
            <SearchableSelect
              label=""
              value={formData.positionId}
              placeholder="Chọn vị trí..."
              options={positions.map(p => ({ id: p.id, label: p.name, subLabel: p.description }))}
              onSelect={(val) => setFormData({ ...formData, positionId: val || '' })}
              allowClear
              clearLabel="-- Không chọn --"
            />
          </div>

          {error && (
            <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest leading-relaxed text-center">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 text-center space-y-2">
           <p className="text-slate-400 dark:text-white/20 text-[11px] font-black uppercase tracking-[0.15em] leading-relaxed">
              Tài khoản User sẽ được tạo tự động với mật khẩu
           </p>
           <p className="text-slate-400 dark:text-white/20 text-[11px] font-black uppercase tracking-[0.15em]">
              mặc định <span className="text-indigo-600 dark:text-indigo-400">Emp@123</span>
           </p>
        </div>

        <div className="flex justify-between items-center gap-8 mt-12">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 hover:text-slate-950 dark:hover:text-white transition-all py-4"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading} 
            className="flex-[1.5] py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[28px] text-[12px] font-black uppercase tracking-[0.15em] shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-30"
          >
            {loading ? 'Đang tạo...' : 'Tạo mới hồ sơ'}
          </button>
        </div>
      </div>
    </div>
  );
}
