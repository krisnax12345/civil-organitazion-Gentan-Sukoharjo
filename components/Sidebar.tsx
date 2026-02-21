
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onLogout?: () => void;
  currentUser?: string;
  instansiName?: string;
  instansiLogo?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  isDarkMode, 
  toggleDarkMode, 
  onLogout, 
  currentUser = 'Admin', 
  instansiName = 'Jimpitan RT',
  instansiLogo = ''
}) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dasbor', icon: 'dashboard' },
    { id: AppView.MANAJEMEN_WARGA, label: 'Input Warga', icon: 'person_add' },
    { id: AppView.IURAN_HARIAN, label: 'Iuran', icon: 'payments' },
    { id: AppView.PENGELUARAN_KAS, label: 'Belanja', icon: 'shopping_cart' },
    { id: AppView.LAPORAN_KEUANGAN, label: 'Laporan', icon: 'analytics' },
    { id: AppView.CLOUD_BACKUP, label: 'Cloud Backup', icon: 'cloud_sync' },
    { id: AppView.MASTER_DATA, label: 'Master Data', icon: 'database' },
    { id: AppView.PENGATURAN, label: 'Pengaturan', icon: 'settings' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white dark:bg-card-dark border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 transition-colors duration-300">
        <div className="p-8 flex flex-col gap-10 h-full">
          <div className="flex items-center gap-4">
            {instansiLogo ? (
              <img src={instansiLogo} alt="Logo" className="size-11 object-contain rounded-xl bg-white p-1 shadow-sm" />
            ) : (
              <div className="bg-primary/20 p-2.5 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl font-bold">savings</span>
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-slate-600 dark:text-white text-lg font-black tracking-tight leading-none truncate max-w-[160px]">{instansiName}</h1>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Digital System</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-left group ${
                  activeView === item.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className={`material-symbols-outlined text-xl ${activeView === item.id ? 'fill-1' : ''}`}>
                  {item.icon}
                </span>
                <p className="text-sm font-bold">{item.label}</p>
              </button>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-6">
            <button 
              onClick={toggleDarkMode}
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                  {isDarkMode ? 'light_mode' : 'dark_mode'}
                </span>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {isDarkMode ? 'Mode Terang' : 'Mode Malam'}
                </p>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-300'}`}>
                 <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </button>

            <div className="flex items-center gap-4 p-2 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
              <img 
                src="https://picsum.photos/seed/admin/100/100" 
                className="size-11 rounded-full border-2 border-primary/20" 
                alt="Profile"
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black truncate dark:text-white">{currentUser}</p>
                <button 
                  onClick={onLogout}
                  className="text-[9px] text-rose-400 hover:text-rose-500 uppercase font-black tracking-widest flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">logout</span>
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-2 py-3 z-[100] transition-colors duration-300 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] overflow-x-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center gap-1 min-w-[64px] flex-1 py-1 transition-all ${
              activeView === item.id ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className={`material-symbols-outlined text-2xl ${activeView === item.id ? 'fill-1' : ''}`}>
              {item.icon}
            </span>
            <p className="text-[10px] font-black uppercase tracking-tighter leading-none">{item.label.split(' ')[0]}</p>
            {activeView === item.id && (
              <div className="w-1 h-1 bg-primary rounded-full mt-1"></div>
            )}
          </button>
        ))}
        <button 
          onClick={onLogout}
          className="flex flex-col items-center gap-1 min-w-[64px] flex-1 py-1 text-rose-400 dark:text-rose-500"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
          <p className="text-[10px] font-black uppercase tracking-tighter leading-none">Keluar</p>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
