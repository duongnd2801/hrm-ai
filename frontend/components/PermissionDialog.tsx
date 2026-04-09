'use client';

import { useState, useEffect } from 'react';
import { permissionApi } from '@/lib/permissionApi';
import type { PermissionDTO } from '@/types';
import { X, Key, AlertCircle } from 'lucide-react';

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: PermissionDTO | null;
  onSuccess: () => void;
}

export default function PermissionDialog({ open, onOpenChange, permission, onSuccess }: PermissionDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [module, setModule] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (permission) {
        setName(permission.name);
        setCode(permission.code);
        setModule(permission.module);
      } else {
        setName('');
        setCode('');
        setModule('');
      }
      setError('');
    }
  }, [open, permission]);

  const handleSave = async () => {
    if (!name.trim() || !code.trim() || !module.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const dto: PermissionDTO = { id: permission?.id, name, code, module };
      
      if (permission?.id) {
        await permissionApi.updatePermission(permission.id, dto);
      } else {
        await permissionApi.createPermission(dto);
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md space-y-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {permission ? 'Sửa Quyền' : 'Tạo Quyền Mới'}
              </h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400 font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-black text-white/40 uppercase tracking-wider mb-2 block">
                Tên quyền
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Xem quyền"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            {/* Code */}
            <div>
              <label className="text-xs font-black text-white/40 uppercase tracking-wider mb-2 block">
                Mã code (không chứa dấu cách)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                placeholder="VD: PERM_VIEW"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm"
              />
            </div>

            {/* Module */}
            <div>
              <label className="text-xs font-black text-white/40 uppercase tracking-wider mb-2 block">
                Module / Danh mục
              </label>
              <input
                type="text"
                value={module}
                onChange={(e) => setModule(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                placeholder="VD: PERMISSION, ROLE, EMPLOYEE"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-xs tracking-wider transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-xs tracking-wider transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : permission ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </div>
      </div>
    )
  );
}
