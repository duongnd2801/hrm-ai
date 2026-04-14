'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/AuthProvider';
import api from '@/lib/api';
import { Project } from '@/types';
import ProjectDialog from '@/components/projects/ProjectDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast, { ToastState } from '@/components/Toast';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const { session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  
  const permissions = session?.permissions ?? [];
  const canView = permissions.includes('PRJ_VIEW');
  const canCreate = permissions.includes('PRJ_CREATE');
  const canUpdate = permissions.includes('PRJ_UPDATE');
  const canDelete = permissions.includes('PRJ_DELETE');

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/projects');
      setProjects(res.data || []);
    } catch {
      pushToast('error', 'Không thể tải danh sách dự án.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      void fetchProjects();
    } else {
      setLoading(false);
      setProjects([]);
    }
  }, [canView]);

  const handleSave = async (data: Partial<Project>) => {
    try {
      if (selectedProject) {
        await api.put(`/api/projects/${selectedProject.id}`, data);
        pushToast('success', 'Đã cập nhật dự án thành công.');
      } else {
        await api.post('/api/projects', data);
        pushToast('success', 'Đã tạo dự án mới thành công.');
      }
      setShowCreate(false);
      setSelectedProject(null);
      fetchProjects();
    } catch {
      pushToast('error', 'Không thể lưu thông tin dự án.');
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      await api.delete(`/api/projects/${projectToDelete}`);
      pushToast('success', 'Đã xóa dự án thành công.');
      fetchProjects();
    } catch {
      pushToast('error', 'Không thể xóa dự án.');
    } finally {
      setShowConfirm(false);
      setProjectToDelete(null);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Hoạt động</span>;
      case 'OVERDUE': return <span className="bg-rose-500/20 text-rose-500 border border-rose-500/20 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Quá hạn</span>;
      case 'COMPLETED': return <span className="bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Hoàn thành</span>;
      default: return <span className="bg-slate-400/20 text-slate-400 border border-slate-400/20 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{status}</span>;
    }
  };

  if (!session) return null;
  if (!canView) {
    return <div className="p-12 text-center text-rose-500 font-black uppercase tracking-[0.2em] bg-rose-500/5 rounded-[32px] mx-6">Bạn không có quyền xem dự án.</div>;
  }

  return (
    <div className="space-y-12 pb-20">
      <Toast toast={toast} onClose={() => setToast(t => ({ ...t, show: false }))} />
      <ConfirmDialog 
        isOpen={showConfirm} 
        title="Xác nhận xóa" 
        message="Dữ liệu về dự án và thành viên liên quan sẽ bị gỡ bỏ vĩnh viễn. Bạn có chắc chắn không?" 
        onConfirm={handleDelete} 
        onCancel={() => { setShowConfirm(false); setProjectToDelete(null); }} 
      />

      {/* Hero Section - Synced with Payroll style */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between pt-10 gap-8 px-2">
         <div>
            <h1 className="text-6xl md:text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-none" style={{ textShadow: '0 2px 15px rgba(0,0,0,0.4)' }}>Dự án</h1>
            <p className="text-lg font-bold uppercase tracking-[0.3em] mt-6 ml-1 text-white/90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>Điều phối nhân sự & tiến độ tập trung</p>
         </div>

         {canCreate && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-2xl p-3 rounded-[32px] border border-white/10 shadow-2xl mt-6 md:mt-0">
               <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/40 active:scale-95"
               >
                  <Plus className="w-4 h-4" strokeWidth={3} />
                  THÊM DỰ ÁN
               </button>
            </div>
         )}
      </div>

      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-3xl rounded-[48px] p-8 md:p-10 border border-black/5 dark:border-white/10 shadow-3xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-indigo-500/5 opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-8 relative z-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider px-1">Danh mục Projects</h2>
          </div>
          
          <div className="relative group">
             <input 
               type="text" 
               placeholder="Tìm theo tên/mã..." 
               value={search} 
               onChange={(e) => setSearch(e.target.value)} 
               className="bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-3 px-8 text-[11px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-white/10 transition-all w-64 shadow-inner font-bold uppercase tracking-widest" 
             />
             <Search className="absolute right-6 top-3.5 w-4 h-4 text-slate-400 dark:text-white/20" />
          </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 pb-4 bg-transparent border-none relative z-10">
           <table className="min-w-[1200px] w-full text-left border-separate border-spacing-0">
             <thead className="text-[11px] uppercase tracking-[0.2em] bg-white/90 dark:bg-black/20 text-slate-600 dark:text-white/70 font-black sticky top-0 z-20 backdrop-blur-md border-b border-black/5 dark:border-white/5">
               <tr>
                 <th className="px-6 py-5 rounded-tl-3xl whitespace-nowrap">DỰ ÁN</th>
                 <th className="px-6 py-5 whitespace-nowrap">MÔ TẢ</th>
                 <th className="px-6 py-5 whitespace-nowrap text-center">TRẠNG THÁI</th>
                 <th className="px-6 py-5 whitespace-nowrap text-center">NGÀY BẮT ĐẦU</th>
                 <th className="px-6 py-5 whitespace-nowrap text-center">NGÀY KẾT THÚC</th>
                 <th className="px-8 py-5 text-right pr-6 rounded-tr-3xl whitespace-nowrap">TÁC VỤ</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-black/5 dark:divide-white/5 bg-white/5 text-[11px]">
               {loading ? (
                 <tr><td colSpan={6} className="py-20 text-center text-slate-400 dark:text-white/10 font-bold uppercase tracking-widest animate-pulse">ĐANG TRUY XUẤT...</td></tr>
               ) : filteredProjects.length === 0 ? (
                 <tr><td colSpan={6} className="py-20 text-center text-slate-400 dark:text-white/10 font-bold uppercase tracking-widest italic font-medium opacity-40">KHÔNG CÓ DỰ ÁN NÀO</td></tr>
               ) : (
                 filteredProjects.map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300">
                      <td className="px-6 py-2.5 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-105 transition-transform">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-[12px] uppercase tracking-wider">{p.name}</h3>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{p.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2.5 border-b border-black/5 dark:border-white/5 max-w-[200px] truncate italic text-slate-600 dark:text-white/40 font-medium text-[10px]">
                        {p.description || '...'}
                      </td>
                      <td className="px-6 py-2.5 border-b border-black/5 dark:border-white/5 text-center leading-none">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="px-6 py-2.5 border-b border-black/5 dark:border-white/5 font-black text-slate-900 dark:text-white text-[11px] tracking-tight uppercase">
                        {new Date(p.startDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-2.5 border-b border-black/5 dark:border-white/5 font-black text-indigo-600 dark:text-sky-400 text-[11px] tracking-tight uppercase">
                        {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : ''}
                      </td>
                      <td className="px-8 py-2.5 border-b border-black/5 dark:border-white/5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-all">
                          <Link 
                            href={`/projects/${p.id}`}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-lg active:scale-90"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-5 h-5" strokeWidth={2.5} />
                          </Link>
                          
                          {canUpdate && (
                            <button 
                              onClick={() => setSelectedProject(p)} 
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-lg active:scale-90"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                          )}
                          
                          {canDelete && (
                            <button 
                              onClick={() => { setProjectToDelete(p.id); setShowConfirm(true); }} 
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg active:scale-90"
                              title="Xóa dự án"
                            >
                              <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      </div>

      {showCreate && canCreate && <ProjectDialog project={null} onClose={() => setShowCreate(false)} onSave={handleSave} />}
      {selectedProject && canUpdate && <ProjectDialog project={selectedProject} onClose={() => setSelectedProject(null)} onSave={handleSave} />}
    </div>
  );
}
