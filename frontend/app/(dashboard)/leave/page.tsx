'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/AuthProvider';
import { LeaveRequestDTO, LeaveType, ApologyStatus } from '@/types';
import { leaveApi } from '@/lib/leaveApi';
import Toast, { ToastState } from '@/components/Toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function LeavePage() {
  const { session } = useSession();
  const [leaves, setLeaves] = useState<LeaveRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  
  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });
  const [tab, setTab] = useState<'MY' | 'REVIEW'>(
    session?.role === 'ADMIN' || session?.role === 'HR' || session?.role === 'MANAGER' ? 'REVIEW' : 'MY'
  );

  // Form state
  const [formData, setFormData] = useState({
    type: 'ANNUAL' as LeaveType,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = tab === 'MY' ? await leaveApi.getMyLeaves() : await leaveApi.getAllLeaves();
      setLeaves(data);
    } catch (err) {
      pushToast('error', 'Lỗi khi tải danh sách nghỉ phép');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leaveApi.createLeave(formData);
      pushToast('success', 'Gửi đơn nghỉ phép thành công');
      setIsDialogOpen(false);
      fetchData();
    } catch (err) {
      pushToast('error', 'Lỗi khi gửi đơn');
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await leaveApi.approveLeave(id);
      else await leaveApi.rejectLeave(id);
      pushToast('success', `${action === 'approve' ? 'Duyệt' : 'Từ chối'} thành công`);
      fetchData();
    } catch (err) {
      pushToast('error', 'Lỗi khi xử lý đơn');
    }
  };

  const getStatusColor = (status: ApologyStatus) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'REJECTED': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    }
  };

  const getLeaveTypeText = (type: LeaveType) => {
    switch (type) {
      case 'ANNUAL': return 'Nghỉ phép năm';
      case 'SICK': return 'Nghỉ ốm';
      case 'UNPAID': return 'Nghỉ không lương';
      case 'HALF_DAY_AM': return 'Nghỉ nửa sáng';
      case 'HALF_DAY_PM': return 'Nghỉ nửa chiều';
      default: return 'Nghỉ bù';
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full max-w-[1400px] mx-auto pb-20">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-[0.05em] uppercase">
            Quản lý <span className="text-indigo-400">Nghỉ phép</span>
          </h1>
          <p className="text-white/40 font-medium tracking-wide">Đăng ký và duyệt đơn nghỉ phép linh hoạt</p>
        </div>
        
        <div className="flex items-center gap-3">
          {(session?.role === 'ADMIN' || session?.role === 'HR' || session?.role === 'MANAGER') && (
            <div className="glass-dark p-1 rounded-2xl flex gap-1 border border-white/5 shadow-2xl">
              <button
                onClick={() => setTab('MY')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${tab === 'MY' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
              >
                Của tôi
              </button>
              <button
                onClick={() => setTab('REVIEW')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${tab === 'REVIEW' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
              >
                Cần duyệt
              </button>
            </div>
          )}
          
          <button
            onClick={() => setIsDialogOpen(true)}
            className="group flex items-center gap-3 bg-white text-slate-900 px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-indigo-600 hover:text-white transition-all duration-500 active:scale-95"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Đăng ký nghỉ
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex items-center justify-center p-20 glass-dark rounded-3xl border border-white/5">
             <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 glass-dark rounded-3xl border border-white/5 text-center space-y-4">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 15.536c-1.171-1.172-3.071-1.172-4.242 0L6 19.414V5a2 2 0 012-2h8a2 2 0 012 2v14.414l-3.879-3.878z" /></svg>
             </div>
             <p className="text-white/20 font-black uppercase tracking-widest">Chưa có đơn nghỉ phép nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {leaves.map((leave) => (
              <div key={leave.id} className="glass-dark border border-white/5 rounded-3xl p-8 hover:border-indigo-500/30 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all duration-700" />
                
                <div className="flex justify-between items-start gap-4">
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{format(new Date(leave.createdAt || new Date()), 'dd/MM/yyyy')}</span>
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${getStatusColor(leave.status)}`}>
                            {leave.status === 'PENDING' ? 'Chờ duyệt' : leave.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                         </span>
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-indigo-400 transition-colors duration-500">
                         {getLeaveTypeText(leave.type)}
                      </h3>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{leave.employeeName}</p>
                   </div>
                   
                   {tab === 'REVIEW' && leave.status === 'PENDING' && (
                     <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(leave.id, 'reject')}
                          className="p-3 rounded-2xl bg-rose-400/10 text-rose-400 hover:bg-rose-400 hover:text-white transition-all duration-500 active:scale-90 border border-rose-400/20"
                        >
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button 
                          onClick={() => handleAction(leave.id, 'approve')}
                          className="p-3 rounded-2xl bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400 hover:text-white transition-all duration-500 active:scale-90 border border-emerald-400/20"
                        >
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </button>
                     </div>
                   )}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                     <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Bắt đầu</span>
                     <p className="text-white font-bold tracking-widest">{format(new Date(leave.startDate), 'dd MMMM, yyyy', { locale: vi })}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                     <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Kết thúc</span>
                     <p className="text-white font-bold tracking-widest">{format(new Date(leave.endDate), 'dd MMMM, yyyy', { locale: vi })}</p>
                  </div>
                </div>

                <div className="mt-6">
                   <p className="text-white/60 text-sm font-medium leading-relaxed italic border-l-2 border-indigo-500/50 pl-4">
                      "{leave.reason || 'Không có lý do chi tiết'}"
                   </p>
                </div>

                {leave.reviewNote && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                     <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-2">Lời nhắn từ người duyệt ({leave.reviewedByName})</span>
                     <p className="text-white/40 text-xs font-bold">{leave.reviewNote}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 sm:p-10 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setIsDialogOpen(false)} />
          <div className="relative w-full max-w-xl glass-dark border border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">Đăng ký <span className="text-indigo-400">nghỉ phép</span></h2>
                <button onClick={() => setIsDialogOpen(false)} className="text-white/20 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Loại hình nghỉ</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveType })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold tracking-widest uppercase text-sm"
                  >
                    <option value="ANNUAL">Nghỉ phép năm</option>
                    <option value="SICK">Nghỉ ốm</option>
                    <option value="UNPAID">Nghỉ không lương</option>
                    <option value="OT_LEAVE">Nghỉ bù</option>
                    <option value="HALF_DAY_AM">Nghỉ nửa sáng</option>
                    <option value="HALF_DAY_PM">Nghỉ nửa chiều</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Từ ngày</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold tracking-widest"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Đến ngày</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Lý do cụ thể</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="VD: Nghỉ phép về quê, đi khám sức khỏe..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] transition-all duration-500 active:scale-95 mt-4"
                >
                  Xác nhận gửi đơn
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
