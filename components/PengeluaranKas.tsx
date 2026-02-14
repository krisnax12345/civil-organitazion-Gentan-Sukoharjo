
import React, { useState, useMemo } from 'react';
import { Transaksi } from '../types';

interface PengeluaranKasProps {
  listTransaksi: Transaksi[];
  onAddPengeluaran: (t: Omit<Transaksi, 'id' | 'timestamp'>) => void;
}

const PengeluaranKas: React.FC<PengeluaranKasProps> = ({ listTransaksi, onAddPengeluaran }) => {
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth(); // 0-11
  
  const [formData, setFormData] = useState({
    keterangan: '',
    kategori_pengeluaran: 'Konsumsi',
    jumlah: 0,
    tanggal: todayISO
  });
  
  const [showSuccess, setShowSuccess] = useState(false);

  // State untuk Filter
  const [filterMonth, setFilterMonth] = useState<string>(String(currentMonthIdx + 1));
  const [filterYear, setFilterYear] = useState<string>(String(currentYear));

  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const monthNamesFull = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const listPengeluaran = useMemo(() => {
    return listTransaksi.filter(t => t.kategori === 'keluar');
  }, [listTransaksi]);

  // Fungsi untuk mengecek apakah transaksi sesuai dengan filter
  const filteredPengeluaran = useMemo(() => {
    const filtered = listPengeluaran.filter(item => {
      // item.tanggal format: "10 Okt 2023"
      const parts = item.tanggal.split(' ');
      if (parts.length < 3) return true; // Fallback jika format salah

      const itemMonthName = parts[1];
      const itemYear = parts[2];

      const itemMonthIdx = monthNamesShort.indexOf(itemMonthName) + 1;
      
      const matchesMonth = filterMonth === 'Semua' || String(itemMonthIdx) === filterMonth;
      const matchesYear = filterYear === 'Semua' || itemYear === filterYear;

      return matchesMonth && matchesYear;
    });

    // URUTKAN BERDASARKAN TIMESTAMP (JAM INPUT) - TERBARU DI ATAS
    return filtered.sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });
  }, [listPengeluaran, filterMonth, filterYear]);

  const totalPengeluaranFiltered = filteredPengeluaran.reduce((acc, t) => acc + t.jumlah, 0);

  // Mendapatkan daftar tahun unik dari transaksi untuk dropdown filter
  const availableYears = useMemo(() => {
    const years = listPengeluaran.map(t => t.tanggal.split(' ')[2]).filter(Boolean);
    const uniqueYears = Array.from(new Set([String(currentYear), ...years])).sort((a, b) => b.localeCompare(a));
    return uniqueYears;
  }, [listPengeluaran, currentYear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keterangan || formData.jumlah <= 0) return;

    const dateObj = new Date(formData.tanggal);
    const formattedDate = dateObj.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

    onAddPengeluaran({
      tanggal: formattedDate,
      keterangan: formData.keterangan,
      subKeterangan: formData.kategori_pengeluaran,
      kategori: 'keluar',
      jumlah: formData.jumlah
    });

    setFormData({ ...formData, keterangan: '', jumlah: 0, tanggal: todayISO });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto w-full relative">
      {showSuccess && (
        <div className="fixed top-5 md:top-10 right-5 md:right-10 z-[110] bg-rose-500 text-white px-6 md:px-8 py-4 md:py-5 rounded-2xl shadow-2xl font-black flex items-center gap-4 animate-in fade-in slide-in-from-right text-sm md:text-base">
          <span className="material-symbols-outlined">receipt_long</span>
          Pengeluaran Dicatat
        </div>
      )}

      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-600 dark:text-white">Pengeluaran Kas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base md:text-lg">Catat setiap pengeluaran dana untuk keperluan warga.</p>
        </div>
        <div className="bg-white dark:bg-card-dark px-8 py-5 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 border-l-4 border-l-rose-400">
          <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-2xl text-rose-500">
             <span className="material-symbols-outlined">shopping_cart</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Total {filterMonth !== 'Semua' || filterYear !== 'Semua' ? 'Periode' : 'Pengeluaran'}
            </p>
            <p className="text-2xl md:text-3xl font-black text-rose-500">Rp {totalPengeluaranFiltered.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <section className="lg:col-span-5 bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md h-fit">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
            <h2 className="text-lg font-black dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-rose-400">add_shopping_cart</span>
              Input Belanja
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Item / Keperluan</label>
              <input 
                required
                value={formData.keterangan}
                onChange={e => setFormData({...formData, keterangan: e.target.value})}
                placeholder="Mis: Snack Rapat RT"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-rose-400 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
              <select 
                value={formData.kategori_pengeluaran}
                onChange={e => setFormData({...formData, kategori_pengeluaran: e.target.value})}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-rose-400 outline-none transition-all"
              >
                <option value="Konsumsi">Konsumsi</option>
                <option value="Perbaikan">Perbaikan Fasilitas</option>
                <option value="Alat Tulis">Alat Tulis & Kantor</option>
                <option value="Sosial">Santunan Sosial</option>
                <option value="Lainnya">Lain-lain</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Tanggal</label>
                <input 
                  type="date"
                  value={formData.tanggal}
                  onChange={e => setFormData({...formData, tanggal: e.target.value})}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-rose-400 outline-none cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nominal (Rp)</label>
                <input 
                  type="number"
                  value={formData.jumlah}
                  onChange={e => setFormData({...formData, jumlah: parseInt(e.target.value) || 0})}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-rose-400 outline-none font-black text-rose-500"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-rose-500 text-white font-black rounded-2xl shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined">save</span>
              SIMPAN PENGELUARAN
            </button>
          </form>
        </section>

        <section className="lg:col-span-7 bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="font-black text-slate-600 dark:text-white uppercase tracking-tight flex items-center gap-3 shrink-0">
              <span className="material-symbols-outlined text-rose-400">list_alt</span>
              Riwayat Belanja
            </h3>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 w-full sm:w-auto">
               <div className="relative flex-1 sm:flex-initial">
                 <select 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-[10px] font-black uppercase bg-white dark:bg-slate-800 border-none rounded-xl dark:text-white outline-none appearance-none cursor-pointer"
                 >
                   <option value="Semua">Semua Bulan</option>
                   {monthNamesFull.map((m, idx) => (
                     <option key={m} value={String(idx + 1)}>{m}</option>
                   ))}
                 </select>
                 <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-sm">expand_more</span>
               </div>

               <div className="relative flex-1 sm:flex-initial">
                 <select 
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-[10px] font-black uppercase bg-white dark:bg-slate-800 border-none rounded-xl dark:text-white outline-none appearance-none cursor-pointer"
                 >
                   <option value="Semua">Semua Tahun</option>
                   {availableYears.map(y => (
                     <option key={y} value={y}>{y}</option>
                   ))}
                 </select>
                 <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-sm">expand_more</span>
               </div>

               {(filterMonth !== 'Semua' || filterYear !== 'Semua') && (
                 <button 
                  onClick={() => { setFilterMonth('Semua'); setFilterYear('Semua'); }}
                  className="px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Reset Filter"
                 >
                   <span className="material-symbols-outlined text-sm">close</span>
                 </button>
               )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
            {filteredPengeluaran.length === 0 ? (
              <div className="p-24 text-center">
                 <span className="material-symbols-outlined text-slate-100 dark:text-slate-800 text-7xl mb-4">receipt</span>
                 <p className="text-slate-300 dark:text-slate-500 text-xs font-bold uppercase tracking-widest italic">
                    {listPengeluaran.length === 0 ? 'Belum ada pengeluaran kas' : 'Tidak ada data untuk periode ini'}
                 </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800">
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-8 py-5">Item</th>
                    <th className="px-8 py-5">Kategori</th>
                    <th className="px-8 py-5 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredPengeluaran.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-sm font-black dark:text-white leading-tight">{item.keterangan}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.tanggal}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase px-3 py-1 rounded-full text-slate-500 dark:text-slate-400">
                          {item.subKeterangan}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-sm font-black text-rose-500">
                          -Rp {item.jumlah.toLocaleString('id-ID')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PengeluaranKas;
