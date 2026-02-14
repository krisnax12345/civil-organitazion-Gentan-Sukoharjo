
import React, { useState, useMemo } from 'react';
import { Warga } from '../types';

interface ManajemenWargaProps {
  listWarga: Warga[];
  onAdd: (w: Omit<Warga, 'id' | 'terdaftarAt'>) => void;
  onDelete: (id: string) => void;
}

const ManajemenWarga: React.FC<ManajemenWargaProps> = ({ listWarga, onAdd, onDelete }) => {
  const [formData, setFormData] = useState({ nama: '', noKK: '', whatsapp: '', blok: '' });
  const [showNotification, setShowNotification] = useState(false);

  // Mengurutkan warga berdasarkan nama secara alfabetis
  const sortedWarga = useMemo(() => {
    return [...listWarga].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [listWarga]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.noKK) return;
    onAdd(formData);
    setFormData({ nama: '', noKK: '', whatsapp: '', blok: '' });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto w-full relative">
      {showNotification && (
        <div className="fixed top-5 md:top-10 right-5 md:right-10 z-[110] bg-primary text-white px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl shadow-2xl font-black flex items-center gap-4 animate-in fade-in slide-in-from-top duration-300 text-sm md:text-base">
          <span className="material-symbols-outlined">verified</span>
          Berhasil Didaftarkan
        </div>
      )}

      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-600 dark:text-white">Database Warga</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base md:text-lg">Kelola data administrasi lingkungan.</p>
      </header>

      <section className="bg-white dark:bg-card-dark rounded-[24px] md:rounded-[32px] border border-slate-200 dark:border-slate-800 mb-8 md:mb-12 overflow-hidden shadow-sm transition-all hover:shadow-md">
        <div className="px-6 md:px-10 py-5 md:py-7 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
          <h2 className="text-lg md:text-xl font-black flex items-center gap-3 text-slate-600 dark:text-white">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            Pendaftaran Baru
          </h2>
        </div>
        <form className="p-6 md:p-10" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Lengkap</label>
              <input 
                required
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                placeholder="Budi Santoso" 
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor KK</label>
              <input 
                required
                value={formData.noKK}
                onChange={(e) => setFormData({...formData, noKK: e.target.value})}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                placeholder="16 Digit KK" 
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp</label>
              <input 
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                placeholder="0812..." 
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Blok</label>
              <input 
                value={formData.blok}
                onChange={(e) => setFormData({...formData, blok: e.target.value})}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-300" 
                placeholder="A-12" 
              />
            </div>
          </div>
          <div className="mt-8 md:mt-10 flex justify-end">
            <button className="w-full sm:w-auto bg-primary text-white font-black px-12 py-4 rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20" type="submit">
              <span className="material-symbols-outlined">save</span>
              Simpan Data
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white dark:bg-card-dark rounded-[24px] md:rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all hover:shadow-md mb-8">
        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-black dark:text-white">Daftar Warga (Urut Abjad)</h2>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            {listWarga.length} Jiwa
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          {listWarga.length === 0 ? (
            <div className="p-16 md:p-24 text-center">
               <span className="material-symbols-outlined text-slate-200 dark:text-slate-800 text-6xl mb-4">person_search</span>
               <p className="italic text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">Belum ada warga terdaftar</p>
            </div>
          ) : (
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 md:px-10 py-5 md:py-6">Profil</th>
                  <th className="px-6 md:px-10 py-5 md:py-6">No KK</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {sortedWarga.map((warga) => (
                  <tr key={warga.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 md:px-10 py-5 md:py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-xs text-primary shrink-0">
                          {warga.nama.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-black text-slate-600 dark:text-white truncate">{warga.nama}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{warga.blok || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-6">
                      <p className="font-mono text-xs dark:text-slate-300 font-bold text-slate-500 tracking-tighter truncate max-w-[120px]">{warga.noKK}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{warga.whatsapp || '-'}</p>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-6">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => onDelete(warga.id)}
                          className="p-3 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 rounded-2xl transition-all text-slate-300"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default ManajemenWarga;
