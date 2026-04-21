'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveSession, isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // If already authenticated, redirect to dashboard immediately
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // D18: Validate email and password before API call
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu');
      setLoading(false);
      return;
    }
    if (!email.includes('@')) {
      setError('Email không hợp lệ');
      setLoading(false);
      return;
    }
    
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const data = res.data;
      
      // Save only non-sensitive metadata locally
      saveSession({
        email: data.email,
        role: data.role,
        employeeId: data.employeeId,
        profileCompleted: data.profileCompleted,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
      });

      const mustComplete =
        data.role === 'EMPLOYEE' &&
        data.employeeId &&
        data.profileCompleted === false;
      const nextUrl = mustComplete
        ? `/employees/${data.employeeId}?completeProfile=1`
        : '/dashboard';

      if (typeof window !== 'undefined') {
        window.location.assign(nextUrl);
        return;
      }

      router.push(nextUrl);
    } catch (err: any) {
      let msg = 'Không thể kết nối đến máy chủ';
      
      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;

        if (status === 401) {
          msg = 'Email hoặc mật khẩu không chính xác';
        } else if (status === 429) {
          // Lấy message từ BE (Tài khoản temporarily bị khóa...)
          msg = serverMessage || 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng quay lại sau.';
        } else if (status === 403) {
          msg = 'Tài khoản của bạn không có quyền truy cập';
        } else if (status === 400) {
          msg = 'Dữ liệu xác thực không hợp lệ';
        } else {
          msg = serverMessage || 'Đã xảy ra lỗi hệ thống';
        }
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Dynamic Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[100px] pointer-events-none animate-pulse delay-700" />

      <div className="glass relative z-10 w-full max-w-md mx-4 rounded-[40px] p-10 shadow-3xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
             <span className="text-white font-black text-3xl tracking-tighter">H</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 leading-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>HRM System</h1>
          <p className="text-slate-500 dark:text-white/30 text-[10px] font-black uppercase tracking-[0.3em]" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>Hệ thống quản trị nhân sự</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 ml-1">Tài khoản Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              required
              className="w-full px-6 py-4 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-white/20 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all tracking-tight"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 ml-1">Mật khẩu bảo mật</label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-6 pr-16 py-4 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-white/20 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all tracking-tight"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute z-20 right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 hover:text-indigo-600 dark:hover:text-white transition-colors p-2 cursor-pointer"
                aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPass ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-black uppercase tracking-widest animate-shake italic">{error}</div>}

          <button
            id="btn-login"
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] text-white bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-600/30 disabled:opacity-60 transition-all hover:scale-[1.02] active:scale-95 duration-300 ring-4 ring-indigo-500/10"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
          </button>
        </form>
      </div>
    </div>
  );
}
