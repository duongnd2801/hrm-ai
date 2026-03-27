'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { saveSession } from '@/lib/auth';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const data = res.data;
      saveSession({
        token: data.token,
        email: data.email,
        role: data.role,
        employeeId: data.employeeId,
        profileCompleted: data.profileCompleted,
      });
      document.cookie = `hrm_token=${data.token}; path=/; max-age=86400`;

      const mustComplete =
        data.role === 'EMPLOYEE' &&
        data.employeeId &&
        data.profileCompleted === false;
      router.push(mustComplete ? `/dashboard/employees/${data.employeeId}?completeProfile=1` : '/dashboard');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.status === 401
          ? 'Email hoặc mật khẩu không đúng'
          : 'Không thể kết nối đến server';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden gradient-bg">
      <div className="orb absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="orb-delay absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

      <div className="glass relative z-10 w-full max-w-md mx-4 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold gradient-text mb-1">HRM System</h1>
          <p className="text-gray-500 theme-dark:text-gray-400 text-sm">Hệ tháng quản trị nhân sự</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 theme-dark:text-gray-400 mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/50 theme-dark:bg-white/5 border border-white/15 text-slate-900 theme-dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 theme-dark:text-gray-400 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/50 theme-dark:bg-white/5 border border-white/15 text-slate-900 theme-dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500/60"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPass ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          <button
            id="btên-login"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 disabled:opacity-60"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
