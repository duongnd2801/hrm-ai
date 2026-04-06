import React, { useState, useEffect, useRef, useMemo } from 'react';

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

  const selected = useMemo(() => options.find((o) => o.id === value) || null, [options, value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.subLabel || ''}`.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={boxRef} className="relative">
      <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 ml-1">{label} <span className="text-red-500">*</span></label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/0 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent border border-indigo-500/20 dark:border-indigo-500/25 rounded-2xl py-3 px-4 text-left text-slate-900 dark:text-white font-bold hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selected ? (
          <span className="text-slate-900 dark:text-white">
            {selected.label}
            {selected.subLabel ? <span className="text-slate-500 dark:text-white/40 text-[11px] font-bold ml-2 tracking-widest">({selected.subLabel})</span> : null}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-white/20 font-normal italic">{placeholder}</span>
        )}
      </button>

      {open && !disabled && (
        <div className="absolute z-[100] mt-3 w-full rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800">
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
        </div>
      )}

      {helperText ? <p className="text-[10px] text-white/20 mt-2 ml-1 italic">{helperText}</p> : null}
    </div>
  );
}
