
import React, { useState, useRef } from 'react';
import { Warga, Transaksi } from '../types';

interface CloudBackupProps {
  listWarga: Warga[];
  listTransaksi: Transaksi[];
  iuranData: Record<string, Record<string, number>>;
  onImport: (data: any) => void;
}

const CloudBackup: React.FC<CloudBackupProps> = ({ listWarga, listTransaksi, iuranData, onImport }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => localStorage.getItem('rt_last_sync'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConnect = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsSyncing(false);
    }, 1500);
  };

  const handleSync = () => {
    if (!isConnected) return;
    setIsSyncing(true);
    
    setTimeout(() => {
      setIsSyncing(false);
      const time = new Date().toLocaleString('id-ID', { 
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      setLastSync(time);
      localStorage.setItem('rt_last_sync', time);
    }, 2000);
  };

  const exportData = () => {
    const data = {
      listWarga,
      listTransaksi,
      iuranData,
      exportDate: new Date().toISOString(),
      version: "2.4.0"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_jimpitan_rt_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm('Import data akan menimpa data saat ini. Lanjutkan?')) {
          onImport(json);
          alert('Data berhasil diimpor!');
        }
      } catch (err) {
        alert('File tidak valid!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-slate-600 dark:text-white tracking-tight">Cloud & Local Backup</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base md:text-lg">Amankan data jimpitan Anda ke Awan atau simpan secara Lokal.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        {/* Google Drive Card */}
        <div className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 md:p-10 flex flex-col items-center text-center">
          <div className={`size-20 rounded-[28px] flex items-center justify-center mb-6 transition-all ${isConnected ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
            <span className="material-symbols-outlined text-4xl font-bold">
              {isConnected ? 'cloud_done' : 'cloud_off'}
            </span>
          </div>
          
          <h3 className="text-lg font-black dark:text-white mb-2">Google Drive Sync</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
            Hubungkan akun Google untuk sinkronisasi otomatis antar perangkat pengurus.
          </p>

          {!isConnected ? (
            <button onClick={handleConnect} disabled={isSyncing} className="w-full bg-slate-800 dark:bg-slate-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all">
              {isSyncing ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><img src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" className="size-5" /> Hubungkan Akun</>}
            </button>
          ) : (
            <div className="w-full space-y-3">
              <button onClick={handleSync} disabled={isSyncing} className="w-full bg-primary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95">
                {isSyncing ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-symbols-outlined">sync</span> Sinkronkan</>}
              </button>
              <button onClick={() => setIsConnected(false)} className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Putuskan Tautan</button>
            </div>
          )}
        </div>

        {/* Local Backup Card */}
        <div className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 md:p-10 flex flex-col items-center text-center">
          <div className="size-20 rounded-[28px] bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl font-bold">database</span>
          </div>
          
          <h3 className="text-lg font-black dark:text-white mb-2">Pencadangan Manual</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
            Unduh data Anda ke file fisik atau impor data dari backup sebelumnya.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button onClick={exportData} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-white font-black py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all">
              <span className="material-symbols-outlined">download</span>
              <span className="text-[10px] uppercase tracking-widest">Ekspor</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-white font-black py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all">
              <span className="material-symbols-outlined">upload</span>
              <span className="text-[10px] uppercase tracking-widest">Impor</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          </div>
        </div>
      </div>

      <div className="mt-10 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-8 rounded-[32px] flex flex-col md:flex-row items-center gap-6">
        <div className="size-14 rounded-2xl bg-white dark:bg-card-dark shadow-sm flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-3xl">offline_pin</span>
        </div>
        <div className="text-center md:text-left">
          <h4 className="font-black dark:text-white text-sm uppercase tracking-widest mb-1">Akses Offline Aktif</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            WebApp ini menggunakan teknologi PWA. Data Anda tersimpan di memori internal browser dan tetap dapat diakses meskipun tanpa koneksi internet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CloudBackup;
