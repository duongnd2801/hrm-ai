'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  kind?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  kind = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colorClasses = 
    kind === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' :
    kind === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
    'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20';

  const iconColor = 
    kind === 'danger' ? 'text-rose-500 bg-rose-500/10' :
    kind === 'warning' ? 'text-amber-500 bg-amber-500/10' :
    'text-indigo-500 bg-indigo-500/10';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onCancel}
      />
      
      {/* Dialog Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-3xl w-full max-w-md overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex items-start gap-5">
            <div className={`p-4 rounded-2xl shrink-0 ${iconColor}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                {title}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50/50 dark:bg-white/5 flex gap-3 border-t border-black/5 dark:border-white/5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-black text-slate-600 dark:text-white/60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 uppercase tracking-widest"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-sm font-black text-white rounded-2xl transition-all shadow-xl active:scale-95 uppercase tracking-widest ${colorClasses}`}
          >
            {confirmText}
          </button>
        </div>

        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
