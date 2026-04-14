import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type SelectOption = {
  id: string;
  label: string;
  subLabel?: string;
};

export default function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  onSelect,
  disabled = false,
  allowClear = false,
  clearLabel = '-- Chưa chọn --',
  helperText,
}: {
  label: string;
  value?: string;
  options: SelectOption[];
  placeholder: string;
  onSelect: (id?: string) => void;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  helperText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function onDocumentClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setDropdownStyle(null);
      return;
    }

    const updatePosition = () => {
      if (!boxRef.current) return;

      const rect = boxRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const openUpward = spaceBelow < 320 && rect.top > spaceBelow;

      setDropdownStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        top: openUpward ? undefined : rect.bottom + 12,
        bottom: openUpward ? viewportHeight - rect.top + 12 : undefined,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const selected = useMemo(() => options.find((o) => o.id === value) || null, [options, value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.subLabel || ''}`.toLowerCase().includes(q));
  }, [options, query]);

  const dropdown =
    open && !disabled && dropdownStyle && typeof document !== 'undefined'
      ? createPortal(
          <div
            style={dropdownStyle}
            className="z-[1000] rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800"
          >
            <div className="p-3 border-b border-black/5 dark:border-white/10">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm danh mục..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
              />
            </div>
            <div className="max-h-64 overflow-auto p-1.5 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10">
              {allowClear && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect(undefined);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  {clearLabel}
                </button>
              )}
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest text-center">Không tìm thấy</div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all mb-1 ${
                      value === item.id ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-sm truncate">{item.label}</div>
                    {item.subLabel ? <div className="text-[10px] opacity-60 mt-0.5 truncate tracking-widest">{item.subLabel}</div> : null}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={boxRef} className="relative">
      <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 ml-1">{label} <span className="text-red-500">*</span></label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full relative overflow-hidden bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-3.5 px-6 text-left transition-all duration-300 group flex items-center justify-between shadow-sm hover:shadow-xl hover:border-indigo-500/50 hover:bg-white dark:hover:bg-white/10 active:scale-[0.98] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {selected ? (
          <div className="flex flex-col relative z-10 overflow-hidden">
            <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-tight truncate">
              {selected.label}
            </span>
            {selected.subLabel && (
              <span className="text-indigo-600 dark:text-indigo-400 text-[9px] font-bold tracking-widest truncate uppercase opacity-60">
                {selected.subLabel}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 dark:text-white/20 font-bold italic text-xs tracking-widest relative z-10">{placeholder}</span>
        )}

        <svg
          className={`w-4 h-4 text-slate-400 dark:text-white/20 transition-transform duration-500 ease-elastic relative z-10 ${open ? 'rotate-180 text-indigo-500' : 'group-hover:text-indigo-500'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {dropdown}

      {helperText ? <p className="text-[10px] text-white/20 mt-2 ml-1 italic">{helperText}</p> : null}
    </div>
  );
}
