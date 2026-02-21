
import React, { useState, useMemo } from 'react';
import { Warga } from '../types';

interface MasterDataProps {
  listWarga: Warga[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updated: Partial<Warga>) => void;
}

const MasterData: React.FC<MasterDataProps> = ({ listWarga, onDelete, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlok, setFilterBlok] = useState('Semua');
  
  // State untuk Edit
  const [editingWarga, setEditingWarga] = useState<Warga | null>(null);
  const [editForm, setEditForm] = useState({ nama: '', noKK: '', whatsapp: '', blok: '' });

  // Mendapatkan daftar blok unik untuk filter
  const uniqueBloks = useMemo(() => {
    const bloks = listWarga.map(w => w.blok || 'Tanpa Blok');
    return ['Semua', ...Array.from(new Set(bloks)).sort()];
  }, [listWarga]);

  // Memfilter dan mengurutkan warga
  const filteredWarga = useMemo(() => {
    return listWarga
      .filter(w => {
        const matchesSearch = 
          w.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
          w.noKK.includes(searchTerm) || 
          w.whatsapp.includes(searchTerm);
        
        const matchesBlok = filterBlok === 'Semua' || (w.blok || 'Tanpa Blok') === filterBlok;
        
        return matchesSearch && matchesBlok;
      })
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [listWarga, searchTerm, filterBlok]);

  const handleEditClick = (warga: Warga) => {
    setEditingWarga(warga);
    setEditForm({
      nama: warga.nama,
      noKK: warga.noKK,
      whatsapp: warga.whatsapp,
      blok: warga.blok
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarga) return;
    onUpdate(editingWarga.id, editForm);
    setEditingWarga(null);
  };

  const exportToCSV = () => {
    if (listWarga.length === 0) return;
    
    const headers = ["Nama", "No KK", "WhatsApp", "Blok", "Tanggal Terdaftar"];
    const rows = listWarga.map(w => [
      w.nama,
      `'${w.noKK}`, // Force string for CSV Excel
      w.whatsapp,
      w.blok,
      w.terdaftarAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `master_data_warga_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto w-full">
      {/* Modal Edit */}
      {editingWarga && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-card-dark rounded-[40px] w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-transparent">
              <h3 className="text-xl font-black dark:text-white tracking-tight uppercase">Edit Data Warga</h3>
              <button onClick={() => setEditingWarga(null)} className="size-10 flex items-center justify-center rounded-2xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Lengkap</label>
                  <input 
                    required 
                    value={editForm.nama} 
                    onChange={e => setEditForm({...editForm, nama: e.target.value})} 
                    className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">No KK</label>
                  <input 
                    required 
                    value={editForm.noKK} 
                    onChange={e => setEditForm({...editForm, noKK: e.target.value})} 
                    className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">WhatsApp</label>
                    <input 
                      value={editForm.whatsapp} 
                      onChange={e => setEditForm({...editForm, whatsapp: e.target.value})} 
                      className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Blok</label>
                    <input 
                      value={editForm.blok} 
                      onChange={e => setEditForm({...editForm, blok: e.target.value})} 
                      className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all" 
                    />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">SIMPAN PERUBAHAN</button>
            </form>
          </div>
        </div>
      )}

      <header className="mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-600 dark:text-white">Master Data Warga</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base md:text-lg">Seluruh arsip data kependudukan RT yang terdaftar.</p>
        </div>
        <button 
          onClick={exportToCSV}
          disabled={listWarga.length === 0}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500 text-white font-black hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:scale-100"
        >
          <span className="material-symbols-outlined">download</span>
          Ekspor CSV (Excel)
        </button>
      </header>

      {/* Ringkasan & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        <div className="md:col-span-8 bg-white dark:bg-card-dark rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4">
           <div className="flex-1 relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary">search</span>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, KK, atau WA..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
              />
           </div>
           <div className="sm:w-48 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">filter_list</span>
              <select 
                value={filterBlok}
                onChange={(e) => setFilterBlok(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold dark:text-white outline-none appearance-none cursor-pointer"
              >
                {uniqueBloks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
           </div>
        </div>
        
        <div className="md:col-span-4 bg-primary/10 rounded-3xl p-6 border border-primary/20 flex items-center justify-between">
           <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Terdata</p>
              <p className="text-3xl font-black text-primary">{listWarga.length} <span className="text-sm font-bold text-primary/60">Jiwa</span></p>
           </div>
           <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-3xl">groups_2</span>
           </div>
        </div>
      </div>

      <section className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all hover:shadow-md">
        <div className="overflow-x-auto custom-scrollbar">
          {filteredWarga.length === 0 ? (
            <div className="p-24 text-center">
               <span className="material-symbols-outlined text-slate-100 dark:text-slate-800 text-7xl mb-4">folder_open</span>
               <p className="italic text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">Data tidak ditemukan</p>
            </div>
          ) : (
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-8 py-6">Informasi Warga</th>
                  <th className="px-8 py-6">Detail Identitas</th>
                  <th className="px-8 py-6">Blok</th>
                  <th className="px-8 py-6">Tgl Terdaftar</th>
                  <th className="px-8 py-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredWarga.map((warga) => (
                  <tr key={warga.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-xs text-primary shrink-0">
                          {warga.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-600 dark:text-white">{warga.nama}</p>
                          <p className="text-[10px] text-primary font-bold uppercase mt-0.5">{warga.whatsapp || 'No WA'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">KK: {warga.noKK}</p>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                        {warga.blok || '-'}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-slate-400 font-medium">{warga.terdaftarAt}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(warga)}
                          className="p-3 hover:bg-primary/10 hover:text-primary rounded-2xl transition-all text-slate-300"
                          title="Edit Data"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button 
                          onClick={() => onDelete(warga.id)}
                          className="p-3 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 rounded-2xl transition-all text-slate-300"
                          title="Hapus Data"
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

      <div className="mt-8 flex justify-center">
         <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
            Arsip Digital RT - Menampilkan {filteredWarga.length} dari {listWarga.length} Warga
         </p>
      </div>
    </div>
  );
};

export default MasterData;
