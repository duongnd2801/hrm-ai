'use client';

import { useState, useEffect } from 'react';
import { roleApi } from '@/lib/roleApi';
import type { RoleDTO, PermissionDTO } from '@/types';
import { AlertCircle, X, Shield, Check, Search, Copy, Info, CheckCircle2 } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDTO | null;
  roles?: RoleDTO[];
  onSuccess: () => void;
}

export default function RoleDialog({ open, onOpenChange, role, roles = [], onSuccess }: RoleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copyRoleId, setCopyRoleId] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setCopyRoleId(undefined);
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
      setErrorMsg('');
    }
  }, [open, role]);

  const handleCopyPermissions = (id?: string) => {
    setCopyRoleId(id);
    if (!id) return;
    const sourceRole = roles.find(r => r.id === id);
    if (sourceRole && sourceRole.permissions) {
      setSelectedPermissions(sourceRole.permissions);
    }
  };

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
      setErrorMsg(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 md:p-4 bg-black/40 dark:bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 w-full max-w-6xl h-[92vh] rounded-[40px] shadow-[0_22px_70px_4px_rgba(0,0,0,0.56)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Compact Header */}
        <div className="py-6 px-10 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-md">
           <div className="flex items-center gap-5">
              <div className="p-3 rounded-[20px] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
                 <Shield className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{role ? 'Cấu hình Role' : 'Thiết lập Role mới'}</h2>
                 <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mt-1.5 opacity-60">Identity & Granular Permissions Matrix</p>
              </div>
           </div>
           <button onClick={() => onOpenChange(false)} className="p-3 rounded-full hover:bg-rose-500 hover:text-white text-slate-400 dark:text-white/20 transition-all active:scale-90">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Dense Main Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
          
          {/* Top Section: Compact Stacking */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
             
             {/* Left: Identity Stacked */}
             <div className="lg:col-span-3 space-y-5">
                <div className="flex items-center gap-3">
                   <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                   <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Thông tin Role</h3>
                </div>
                
                <div className="flex flex-col gap-4 max-w-2xl">
                   <div className="space-y-1.5">
                     <label className="block text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest ml-1">Mã định danh (ID)</label>
                     <input
                       type="text"
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       placeholder="VD: ADMIN, MANAGER..."
                       className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-5 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase font-black tracking-widest text-xs transition-all shadow-inner"
                       disabled={!!(role && ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'].includes(role.name))}
                     />
                   </div>

                   <div className="space-y-1.5">
                     <label className="block text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest ml-1">Mô tả hiển thị</label>
                     <input
                       type="text"
                       value={description}
                       onChange={(e) => setDescription(e.target.value)}
                       placeholder="Mô tả chức năng & quyền hạn..."
                       className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-5 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs font-medium transition-all shadow-inner"
                     />
                   </div>
                </div>
             </div>

             {/* Right: Narrow Quick Inherit */}
             {!role && (
                <div className="lg:col-span-2 p-6 rounded-[32px] bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent border border-indigo-500/10 dark:border-indigo-500/20 space-y-4 relative flex flex-col justify-center max-w-sm">
                   <div className="flex items-center gap-2 relative z-10">
                      <div className="p-2 bg-indigo-600 rounded-lg text-white">
                        <Copy className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">Thiết lập nhanh</span>
                   </div>
                   <div className="space-y-2">
                     <p className="text-[8px] font-bold text-slate-400 dark:text-white/20 uppercase">Kế thừa toàn bộ quyền từ:</p>
                     <SearchableSelect
                        label="" 
                        value={copyRoleId}
                        placeholder="Chọn role mẫu..."
                        options={roles.map(r => ({ id: r.id!, label: r.name, subLabel: r.description }))}
                        onSelect={handleCopyPermissions}
                        allowClear
                        clearLabel="-- Không kế thừa --"
                     />
                   </div>
                </div>
             )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5" />

          {/* Matrix Section - High Density */}
          <div className="space-y-6">
             
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-400 dark:text-white/20">
                      <Search className="w-4 h-4" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Ma trận quyền hạn</span>
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest italic">{selectedPermissions.length} quyền đã chọn</span>
                   </div>
                </div>
                <input 
                  type="text" 
                  placeholder="Lọc hành động / module..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 rounded-xl py-2.5 px-5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 w-full md:w-72 transition-all font-medium placeholder:italic shadow-inner"
                />
             </div>

             <div className="space-y-8">
                {modules.map(module => {
                  const modulePerms = filteredPermissions.filter(p => p.module === module);
                  if (modulePerms.length === 0) return null;
                  
                  return (
                    <div key={module} className="space-y-4">
                      <div className="flex items-center gap-3 sticky top-[-10px] z-10 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm -mx-2 px-2 rounded-lg">
                         <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                         <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em]">{module}</span>
                         <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {modulePerms.map(permission => {
                          const isSelected = selectedPermissions.includes(permission.code);
                          return (
                            <div 
                              key={permission.code} 
                              onClick={() => togglePermission(permission.code)}
                              className={`p-3.5 rounded-[20px] border transition-all duration-300 cursor-pointer flex items-center justify-between group relative ${
                                isSelected 
                                  ? 'bg-indigo-600 dark:bg-indigo-600 border-indigo-400 dark:border-indigo-400 shadow-lg shadow-indigo-600/20' 
                                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/30 hover:bg-slate-50 dark:hover:bg-indigo-500/5 hover:border-indigo-500/20 shadow-sm'
                              }`}
                            >
                               <div className="flex flex-col relative z-10 overflow-hidden pr-2">
                                  <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white group-hover:text-indigo-500'}`}>{permission.name}</span>
                                  <span className={`text-[8px] font-mono mt-0.5 ${isSelected ? 'text-white/50' : 'text-slate-400 dark:text-white/20'}`}>{permission.code}</span>
                               </div>
                               <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                                 isSelected 
                                   ? 'bg-white border-white' 
                                   : 'border-slate-200 dark:border-white/10 group-hover:border-indigo-500'
                               }`}>
                                 {isSelected ? (
                                   <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />
                                 ) : (
                                   <div className="w-1 h-1 bg-slate-200 dark:bg-white/10 rounded-full" />
                                 )}
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

        {/* Dense Footer */}
        <div className="px-10 py-5 border-t border-black/5 dark:border-white/5 bg-slate-50 dark:bg-black/40 space-y-3 backdrop-blur-2xl">
           {errorMsg && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 transition-all mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase">{errorMsg}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
           <div className="hidden lg:flex items-center gap-3 text-slate-400 dark:text-white/20">
              <Info className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Thay đổi có hiệu lực sau khi tải lại trang</span>
           </div>
           
           <div className="flex items-center gap-4 w-full lg:w-auto">
             <button 
                onClick={() => onOpenChange(false)} 
                className="flex-1 lg:flex-none px-6 py-3 text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Hủy bỏ
              </button>
              
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="flex-1 lg:flex-none relative h-12 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl overflow-hidden transition-all duration-300 shadow-lg shadow-indigo-600/25 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                   <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                   <CheckCircle2 className="w-5 h-5 shrink-0" />
                )}
                <span className="text-[11px] font-black uppercase tracking-widest">
                   {loading ? 'Đang lưu...' : 'Lưu'}
                </span>
              </button>
           </div>
        </div>
      </div>
    </div>
    </div>
  );
}
