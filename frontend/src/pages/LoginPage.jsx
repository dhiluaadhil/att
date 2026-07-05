import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        username: username.trim(),
        password: password
      });

      const { access_token, username: returnedUser } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('username', returnedUser);
      navigate('/');
    } catch (err) {
      console.error("Login failed:", err);
      const detail = err.response?.data?.detail || 'Incorrect username or password. Please try again.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-950/40 p-8 backdrop-blur-md shadow-2xl shadow-blue-500/5">
        <div>
          {/* Logo Icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-extrabold text-white text-2xl shadow-xl shadow-blue-500/20">
            ₹
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            Dashboard Login
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sign in to access daily pay automation dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="flex items-center space-x-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-900/50 py-2.5 pl-10 pr-3 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g. admin"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-900/50 py-2.5 pl-10 pr-3 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
