
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (userId: string) => void;
  listUsers: User[];
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, listUsers }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulasi delay login untuk UX
    setTimeout(() => {
      // Cek default admin atau user dari list
      const user = listUsers.find(u => u.userId === userId && u.pass === password);
      
      if ((userId === 'sinoman01' && password === 'sinoman') || user) {
        onLoginSuccess(userId);
      } else {
        setError('User ID atau Password salah. Silakan coba lagi.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-6 transition-colors duration-500">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center justify-center size-20 rounded-[28px] bg-primary/10 text-primary mb-6 shadow-xl shadow-primary/5">
            <span className="material-symbols-outlined text-4xl font-bold">savings</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-3">Jimpitan RT Digital</h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Sistem Manajemen Warga</p>
        </div>

        <div className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl p-8 md:p-10 animate-in zoom-in duration-500">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">User ID</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">person</span>
                <input 
                  type="text" 
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Masukkan ID Pengurus"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">lock</span>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Masukkan Kata Sandi"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-xl flex items-center gap-3 animate-in shake duration-300">
                <span className="material-symbols-outlined text-rose-500 text-lg">error</span>
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
            >
              {isLoading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">login</span>
                  Masuk Sistem
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
              Lupa akses? Hubungi Admin Lingkungan
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
            RT Digital v2.4.0 • Secured Access
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
