
import React, { useState, useRef, useEffect } from 'react';
import { Warga, Transaksi } from '../types';

interface CloudBackupProps {
  listWarga: Warga[];
  listTransaksi: Transaksi[];
  iuranData: Record<string, Record<string, number>>;
  onImport: (data: any) => void;
  onUpdateCloudConfig?: (url: string, key: string) => void;
  currentConfig?: { url: string; key: string };
}

const CloudBackup: React.FC<CloudBackupProps> = ({ 
  listWarga, 
  listTransaksi, 
  iuranData, 
  onImport, 
  onUpdateCloudConfig,
  currentConfig 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [formConfig, setFormConfig] = useState({ url: '', key: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentConfig) {
      setFormConfig({ url: currentConfig.url || '', key: currentConfig.key || '' });
    }
  }, [currentConfig]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateCloudConfig) {
      onUpdateCloudConfig(formConfig.url, formConfig.key);
      setShowConfigForm(false);
      alert('Konfigurasi disimpan. Mencoba menyambungkan...');
    }
  };

  const exportData = () => {
    const data = { listWarga, listTransaksi, iuranData, exportDate: new Date().toISOString(), version: "2.5.0" };
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
      } catch (err) { alert('File tidak valid!'); }
    };
    reader.readAsText(file);
  };

  const isConnected = !!(currentConfig?.url && currentConfig?.key);

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-slate-600 dark:text-white tracking-tight">Cloud & Local Backup</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base md:text-lg">Amankan data jimpitan Anda ke Awan atau simpan secara Lokal.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        {/* Supabase Cloud Card */}
        <div className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 md:p-10 flex flex-col">
          <div className="flex items-center gap-6 mb-8">
            <div className={`size-16 rounded-2xl flex items-center justify-center shrink-0 transition-all ${isConnected ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
              <span className="material-symbols-outlined text-3xl font-bold">{isConnected ? 'cloud_done' : 'cloud_off'}</span>
            </div>
            <div>
              <h3 className="text-lg font-black dark:text-white leading-none">Database Supabase</h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1.5">
                {isConnected ? 'Terhubung ke Cloud' : 'Belum Terkonfigurasi'}
              </p>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Sinkronisasi otomatis ke cloud database. Data aman meskipun Anda berganti perangkat atau menghapus cache browser.
          </p>

          <div className="mt-auto space-y-4">
            {showConfigForm ? (
              <form onSubmit={handleSaveConfig} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Project URL</label>
                  <input 
                    required 
                    value={formConfig.url} 
                    onChange={e => setFormConfig({...formConfig, url: e.target.value})}
                    placeholder="https://xxx.supabase.co" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-xs dark:text-white outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Anon API Key</label>
                  <input 
                    required 
                    type="password"
                    value={formConfig.key} 
                    onChange={e => setFormConfig({...formConfig, key: e.target.value})}
                    placeholder="eyJhbG..." 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-xs dark:text-white outline-none" 
                  />
                </div>
                <div className="flex gap-2">
                   <button type="submit" className="flex-1 bg-primary text-white text-[10px] font-black py-3 rounded-xl uppercase tracking-widest">Simpan Konfigurasi</button>
                   <button type="button" onClick={() => setShowConfigForm(false)} className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black py-3 rounded-xl uppercase tracking-widest">Batal</button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setShowConfigForm(true)}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                  isConnected 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200' 
                    : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{isConnected ? 'settings' : 'link'}</span>
                {isConnected ? 'Ubah Koneksi Cloud' : 'Hubungkan Database'}
              </button>
            )}
          </div>
        </div>

        {/* Local Backup Card */}
        <div className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 md:p-10 flex flex-col items-center text-center">
          <div className="size-20 rounded-[28px] bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl font-bold">database</span>
          </div>
          
          <h3 className="text-lg font-black dark:text-white mb-2 leading-none">Pencadangan Manual</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 max-w-xs leading-relaxed">
            Unduh data Anda ke file fisik (JSON) atau impor data dari cadangan yang pernah Anda buat sebelumnya.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mt-auto">
            <button onClick={exportData} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-white font-black py-5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
              <span className="material-symbols-outlined">download</span>
              <span className="text-[9px] uppercase tracking-[0.2em]">Ekspor File</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-white font-black py-5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
              <span className="material-symbols-outlined">upload</span>
              <span className="text-[9px] uppercase tracking-[0.2em]">Impor File</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          </div>
        </div>
      </div>

      <div className="mt-10 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-8 rounded-[32px] flex flex-col md:flex-row items-center gap-8">
        <div className="size-16 rounded-2xl bg-white dark:bg-card-dark shadow-sm flex items-center justify-center text-emerald-500 shrink-0">
          <span className="material-symbols-outlined text-4xl">verified_user</span>
        </div>
        <div className="text-center md:text-left flex-1">
          <h4 className="font-black dark:text-white text-sm uppercase tracking-widest mb-1.5">Offline-First Technology</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Aplikasi ini tetap bekerja sepenuhnya meskipun tanpa internet. Sinkronisasi ke Cloud akan terjadi secara otomatis saat koneksi tersedia kembali, memastikan data Anda selalu mutakhir dan transparan bagi pengurus lain.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CloudBackup;
