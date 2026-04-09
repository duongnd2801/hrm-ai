"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import DraggableModal from "@/components/DraggableModal";
import Toast, { ToastState } from "@/components/Toast";
import { Department } from "@/types";
import { Pencil, Trash2 } from "lucide-react";

function getErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data;
  if (typeof data === "string") return data;
  return (data as { message?: string } | undefined)?.message || fallback;
}

export default function DepartmentTable() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const pushToast = (kind: ToastState['kind'], message: string) =>
    setToast({ show: true, kind, message });

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [targetDelete, setTargetDelete] = useState<Department | null>(null);

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchDepartments() {
    try {
      const res = await api.get("/api/company/departments");
      setDepartments(res.data as Department[]);
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, "Không thể tải danh sách phòng ban."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchDepartments();
  }, []);

  function openCreateModal() {
    setEditingDepartment(null);
    setName("");
    setError("");
    setShowFormModal(true);
  }

  function openEditModal(department: Department) {
    setEditingDepartment(department);
    setName(department.name);
    setError("");
    setShowFormModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên phòng ban không được để trống.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (editingDepartment) {
        await api.put(`/api/company/departments/${editingDepartment.id}`, { name: name.trim() });
      } else {
        await api.post("/api/company/departments", { name: name.trim() });
      }
      setShowFormModal(false);
      await fetchDepartments();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể lưu phòng ban."));
    } finally {
      setSubmitting(false);
    }
  }

  function openDeleteModal(department: Department) {
    setTargetDelete(department);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!targetDelete) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/company/departments/${targetDelete.id}`);
      setShowDeleteModal(false);
      setTargetDelete(null);
      await fetchDepartments();
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, "Không thể xóa phòng ban."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <Toast toast={toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
      <div className="flex items-center justify-between px-2 lg:px-6 pt-4">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Cấu trúc phòng ban</h3>
        <button
          onClick={openCreateModal}
          className="px-8 py-3.5 rounded-2xl bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/30 transition-all duration-300"
        >
          + Thêm phòng ban
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500/60 dark:text-white/50 font-black uppercase tracking-widest animate-pulse">Đang đồng bộ dữ liệu...</div>
      ) : (
        <div className="overflow-x-auto rounded-[32px] border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl bg-white/40 dark:bg-white/5 backdrop-blur-3xl mx-2 lg:mx-6 overflow-hidden">
          <table className="min-w-full divide-y divide-black/5 dark:divide-white/5">
            <thead className="text-[11px] uppercase tracking-[0.2em] bg-white/90 dark:bg-black/40 text-slate-600 dark:text-white/70 font-black sticky top-0 z-20 backdrop-blur-md border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="px-8 py-6 rounded-tl-3xl text-left whitespace-nowrap">MÃ & TÊN PHÒNG BAN</th>
                <th className="px-8 py-6 text-right pr-10 rounded-tr-3xl whitespace-nowrap">QUẢN LÝ THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-8 py-10 text-center text-slate-500/60 dark:text-white/50 font-bold uppercase text-xs">Hiện tại chưa có phòng ban nào được thiết lập</td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr key={department.id} className="group hover:bg-indigo-500/[0.05] dark:bg-slate-900/40 dark:hover:bg-indigo-500/10 transition-all duration-300">
                    <td className="px-8 py-3.5">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-white/5 flex items-center justify-center text-indigo-600 dark:text-white text-xs font-black ring-1 ring-indigo-500/20">
                             {department.name.substring(0,2).toUpperCase()}
                          </div>
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{department.name}</span>
                       </div>
                    </td>
                    <td className="px-8 py-3.5 text-right space-x-2">
                       <button 
                         onClick={() => openEditModal(department)} 
                         className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 shadow-lg transition-all active:scale-95"
                         title="Sửa phòng ban"
                       >
                         <Pencil className="w-5 h-5" />
                       </button>
                       <button 
                         onClick={() => openDeleteModal(department)} 
                         className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-rose-500 text-white hover:bg-rose-600 shadow-lg transition-all active:scale-95"
                         title="Xóa phòng ban"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showFormModal && (
        <DraggableModal
          title={editingDepartment ? "Sửa phòng ban" : "Thêm phòng ban"}
          onClose={() => setShowFormModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30 mb-2 ml-1">Tên định danh phòng ban</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm tracking-tight uppercase"
                placeholder="Ví dụ: IT, Nhân sự, Kế toán..."
              />
            </div>
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 dark:text-rose-400 text-xs font-black uppercase tracking-widest animate-shake">
                {error}
              </div>
            )}
            <div className="flex justify-between items-center pt-8">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 text-white shadow-2xl shadow-indigo-500/30 transition-all disabled:opacity-30 active:scale-95 duration-300"
              >
                {submitting ? "Đang đồng bộ..." : editingDepartment ? "Cập nhật hồ sơ" : "Xác nhận thêm mới"}
              </button>
            </div>
          </form>
        </DraggableModal>
      )}

      {showDeleteModal && targetDelete && (
        <DraggableModal title="Xác nhận gỡ bỏ" onClose={() => setShowDeleteModal(false)}>
           <div className="text-center py-4">
              <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 animate-bounce">
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-500 dark:text-white/60 mb-10 leading-relaxed uppercase tracking-widest">
                Bạn có chắc chắn muốn xóa phòng ban <br/> 
                <span className="font-black text-slate-900 dark:text-white mt-2 block text-xl tracking-tighter italic ring-1 ring-rose-500/20 bg-rose-500/5 py-2 px-4 rounded-xl">{targetDelete.name}</span> <br/>
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={submitting}
                  className="px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-500 text-white shadow-2xl shadow-rose-500/30 transition-all active:scale-95 duration-300"
                >
                  {submitting ? "Đang xóa..." : "Xác nhận xóa"}
                </button>
              </div>
           </div>
        </DraggableModal>
      )}
    </div>
  );
}
