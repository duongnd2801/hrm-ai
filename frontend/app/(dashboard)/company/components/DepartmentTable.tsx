"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import DraggableModal from "@/components/DraggableModal";
import { Department } from "@/types";

function getErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data;
  if (typeof data === "string") return data;
  return (data as { message?: string } | undefined)?.message || fallback;
}

export default function DepartmentTable() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

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
      alert(getErrorMessage(err, "Không thể tải danh sách phòng ban."));
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
      setError("Tn phòng ban không c - trêng.");
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
      alert(getErrorMessage(err, "Không thể xóa phòng ban."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Danh sách phòng ban</h3>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
        >
          + Thêm phòng ban
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-gray-300">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-gray-700 bg-white/5">
            <thead>
              <tr className="bg-black/40 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Tn phòng ban</th>
                <th className="px-6 py-4 text-right">Thao tc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-6 text-center text-gray-500">Chưa có dữ liệu</td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr key={department.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{department.name}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                      <button onClick={() => openEditModal(department)} className="text-blue-400 hover:text-blue-300">
                        Sửa
                      </button>
                      <button onClick={() => openDeleteModal(department)} className="text-red-400 hover:text-red-300">
                        Xóa
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tn phòng ban</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-white"
                placeholder="V- d: IT, Nhơn s, K- toàn"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              >
                {submitting ? "ang lưu..." : editingDepartment ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </form>
        </DraggableModal>
      )}

      {showDeleteModal && targetDelete && (
        <DraggableModal title="Xc nhơn xóa" onClose={() => setShowDeleteModal(false)}>
          <p className="text-sm text-gray-300 mb-5">
            Bạn c- chắc muốn xóa phòng ban <span className="font-semibold text-white">{targetDelete.name}</span> không?
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
            >
              {submitting ? "ang xóa..." : "Xóa"}
            </button>
          </div>
        </DraggableModal>
      )}
    </div>
  );
}
