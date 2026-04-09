'use client';

import { useState, useEffect } from 'react';
import { roleApi } from '@/lib/roleApi';
import type { RoleDTO, PermissionDTO } from '@/types';
import { X, Shield, Check, Search } from 'lucide-react';

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDTO | null;
  onSuccess: () => void;
}

export default function RoleDialog({ open, onOpenChange, role, onSuccess }: RoleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name);
        setDescription(role.description || '');
        setSelectedPermissions(role.permissions || []);
      } else {
        setName('');
        setDescription('');
        setSelectedPermissions([]);
      }
      fetchPermissions();
    }
  }, [open, role]);

  const fetchPermissions = async () => {
    try {
      const perms = await roleApi.getAllPermissions();
      setAllPermissions(perms);
    } catch {
      console.error('Không thể tải danh sách quyền');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const payload: RoleDTO = {
        name,
        description,
        permissions: selectedPermissions,
      };

      if (role?.id) {
        await roleApi.updateRole(role.id, payload);
      } else {
        await roleApi.createRole(payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (code: string) => {
    setSelectedPermissions(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  if (!open) return null;

  const modules = Array.from(new Set(allPermissions.map(p => p.module)));
  const filteredPermissions = allPermissions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 dark:bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                <Shield className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{role ? 'Chỉnh sửa Role' : 'Thêm Role mới'}</h2>
                <p className="text-xs font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mt-1">Cấu hình định danh & quyền hạn</p>
             </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] ml-1">Định danh Role</label>
              <input
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="VD: ADMIN, MANAGER..."
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-5 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all uppercase font-bold tracking-widest"
                disabled={!!(role && ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'].includes(role.name))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] ml-1">Mô tả chức năng</label>
              <input
                type="text"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn gọn..."
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-5 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] ml-1">Danh sách quyền hạn</label>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 dark:text-white/20" />
                   <input 
                     type="text" 
                     placeholder="Tìm quyền..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-full py-1.5 pl-9 pr-4 text-[10px] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-40"
                   />
                </div>
             </div>

             <div className="space-y-6">
                {modules.map(module => {
                  const modulePerms = filteredPermissions.filter(p => p.module === module);
                  if (modulePerms.length === 0) return null;
                  
                  return (
                    <div key={module} className="space-y-3">
                      <div className="flex items-center gap-3">
                         <div className="h-[1px] flex-1 bg-slate-200 dark:bg-white/5" />
                         <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-[0.3em]">{module}</span>
                         <div className="h-[1px] flex-1 bg-slate-200 dark:bg-white/5" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {modulePerms.map(permission => {
                          const isSelected = selectedPermissions.includes(permission.code);
                          return (
                            <div 
                              key={permission.code} 
                              onClick={() => togglePermission(permission.code)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                                isSelected 
                                  ? 'bg-indigo-100 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500/40 text-slate-900 dark:text-white' 
                                  : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/10'
                              }`}
                            >
                               <div className="flex flex-col">
                                  <span className={`text-[11px] font-bold uppercase tracking-widest ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/70'}`}>{permission.name}</span>
                                  <span className="text-[9px] opacity-40 font-mono mt-0.5">{permission.code}</span>
                               </div>
                               <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                 isSelected ? 'bg-indigo-500 border-indigo-400' : 'border-slate-300 dark:border-white/20'
                               }`}>
                                 {isSelected && <Check className="w-3 h-3 text-white" />}
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-4">
          <button onClick={() => onOpenChange(false)} className="px-6 py-3 rounded-2xl text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-all">Hủy bỏ</button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Xác nhận lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
