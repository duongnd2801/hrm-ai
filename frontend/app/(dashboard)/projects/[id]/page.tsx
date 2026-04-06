'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Trash2, Calendar, LayoutTemplate } from 'lucide-react';
import { projectApi } from '@/lib/projectApi';
import { hasRole } from '@/lib/auth';
import type { Project, ProjectMember, ProjectRole } from '@/types';
import ProjectMemberDialog from '@/components/projects/ProjectMemberDialog';
import Toast, { ToastState } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean, id: string, name: string }>({ 
    show: false, id: '', name: '' 
  });

  const showToast = (kind: ToastState['kind'], message: string) => 
    setToast({ show: true, kind, message });

  useEffect(() => {
    setCanManage(hasRole('ADMIN', 'HR', 'MANAGER'));
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projData, membersData] = await Promise.all([
        projectApi.getProjectById(projectId),
        projectApi.getProjectMembers(projectId)
      ]);
      setProject(projData);
      setMembers(membersData);
    } catch (err) {
      showToast('error', 'Không thể tải dữ liệu chi tiết dự án');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (data: { employeeId: string; role: string; joinedAt?: string; leftAt?: string }) => {
    try {
      await projectApi.addOrUpdateMember(projectId, data);
      showToast('success', 'Đã thêm nhân sự vào dự án thành công');
      setIsMemberDialogOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi thêm thành viên');
    }
  };

  const initiateRemoveMember = (employeeId: string, employeeName: string) => {
    setConfirmDelete({ show: true, id: employeeId, name: employeeName });
  };

  const handleRemoveMember = async () => {
    const { id, name } = confirmDelete;
    try {
      await projectApi.removeMember(projectId, id);
      showToast('success', `Đã xóa nhân sự ${name} khỏi dự án`);
      loadData();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi xóa thành viên');
    } finally {
      setConfirmDelete({ show: false, id: '', name: '' });
    }
  };

  const getRoleBadge = (role: ProjectRole) => {
    switch (role) {
      case 'PM': return <span className="px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">Quản lý (PM)</span>;
      case 'DEV': return <span className="px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Lập trình (DEV)</span>;
      case 'QA': return <span className="px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Kiểm thử (QA)</span>;
      case 'TESTER': return <span className="px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">Tester</span>;
      case 'BA': return <span className="px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Phân tích (BA)</span>;
      default: return <span className="px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">{role}</span>;
    }
  };

  if (loading && !project) return <div className="p-12 text-center uppercase tracking-[0.3em] font-black text-slate-400 animate-pulse">Đang nạp chi tiết dự án...</div>;
  if (!project) return <div className="p-12 text-center text-rose-500 font-black uppercase tracking-[0.2em] bg-rose-500/5 rounded-[32px] mx-6">Dự án không tồn tại hoặc đã bị xóa!</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Toast toast={toast} onClose={() => setToast({ ...toast, show: false })} />
      
      <ConfirmDialog
        isOpen={confirmDelete.show}
        title="Xóa nhân sự?"
        message={`Bạn có chắc muốn xóa nhân sự "${confirmDelete.name}" khỏi dự án này?`}
        onConfirm={handleRemoveMember}
        onCancel={() => setConfirmDelete({ show: false, id: '', name: '' })}
        confirmText="XÓA KHỎI DỰ ÁN"
        cancelText="Quay lại"
      />
      
      {/* Header card */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-black/5 dark:border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <button 
          onClick={() => router.push('/projects')}
          className="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-6">
            <div 
              className="w-20 h-20 rounded-[28px] shadow-2xl flex items-center justify-center text-white font-black text-3xl uppercase rotate-3 group-hover:rotate-0 transition-transform duration-500"
              style={{ backgroundColor: project.color || '#3b82f6', boxShadow: `0 12px 30px -10px ${project.color || '#3b82f6'}` }}
            >
              {project.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  {project.name}
                </h1>
                <span className="text-[10px] font-black px-3 py-1 bg-black/5 dark:bg-white/10 text-indigo-500 dark:text-indigo-400 rounded-lg border border-black/5 dark:border-white/5 tracking-[0.2em]">
                  {project.code}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-xl leading-relaxed">{project.description || 'Dự án này chưa có mô tả chi tiết từ quản lý.'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 border-l border-black/5 dark:border-white/5 pl-8">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 opacity-50"><Calendar className="w-4 h-4" /> Bắt đầu</div>
              <div className="text-slate-900 dark:text-emerald-400 text-sm tracking-widest font-black uppercase">{project.startDate}</div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 opacity-50"><LayoutTemplate className="w-4 h-4" /> Loại hình</div>
              <div className="text-slate-900 dark:text-indigo-400 text-sm tracking-widest font-black uppercase">{project.type}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-[48px] shadow-3xl overflow-hidden relative">
        <div className="p-8 md:p-10 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">Thành viên tham gia</h2>
            <p className="text-[10px] font-black text-indigo-400 tracking-[0.2em] mt-1">{members.length} NHÂN SỰ ĐANG TRONG DỰ ÁN</p>
          </div>
          {canManage && (
            <button
              onClick={() => setIsMemberDialogOpen(true)}
              className="group flex items-center gap-3 px-6 py-4 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all rounded-2xl text-xs font-black uppercase tracking-widest border border-indigo-500/20 active:scale-95 shadow-lg shadow-indigo-500/5"
            >
              <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Thêm nhân sự
            </button>
          )}
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5">
                <th className="p-6 pl-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30">Nhân viên</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30">Email liên hệ</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30">Vị trí trong dự án</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30">Ngày gia nhập</th>
                {canManage && (
                  <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30 text-right pr-10 whitespace-nowrap">Dự án</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-24 text-center text-slate-400 font-black uppercase tracking-[0.4em] text-lg">Chưa có nhân sự</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 group">
                    <td className="p-6 pl-10">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg group-hover:scale-110 transition-transform duration-500">
                          <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-500 font-black text-sm uppercase">
                            {member.employeeName?.charAt(0) || 'U'}
                          </div>
                        </div>
                        <div>
                          <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-wider block">
                            {member.employeeName}
                          </span>
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1 block">MEMBER ID: {member.employeeId.split('-')[0].toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-[12px] font-bold text-slate-500 dark:text-white/40 tracking-widest">{member.employeeEmail}</td>
                    <td className="p-6">{getRoleBadge(member.role)}</td>
                    <td className="p-6 text-[12px] font-black text-slate-500 dark:text-emerald-400 tracking-widest uppercase">{member.joinedAt || 'KHÔNG RÕ'}</td>
                    {canManage && (
                      <td className="p-6 text-right pr-10">
                        <button
                          onClick={() => initiateRemoveMember(member.employeeId, member.employeeName || '')}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Xóa khỏi dự án"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isMemberDialogOpen && (
        <ProjectMemberDialog 
          projectId={projectId}
          currentMemberIds={members.map(m => m.employeeId)}
          onClose={() => setIsMemberDialogOpen(false)}
          onSave={handleAddMember}
        />
      )}

    </div>
  );
}
