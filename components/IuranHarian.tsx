
import React, { useState, useMemo, useEffect } from 'react';
import { Warga, Transaksi } from '../types';

interface IuranHarianProps {
  listWarga: Warga[];
  listTransaksi: Transaksi[];
  iuranData: Record<string, Record<string, number>>;
  onRecordMulti: (wargaId: string, days: number[], month: number, year: number, amount: number) => void;
  onRecordBulk?: (wargaId: string, startMonth: number, startYear: number, totalMonths: number, amount: number) => void;
  onRecordCustom?: (wargaId: string, amount: number, keterangan?: string) => void;
  nominalWajib: number;
  setNominalWajib: (val: number) => void;
}

const IuranHarian: React.FC<IuranHarianProps> = ({ 
  listWarga, 
  listTransaksi,
  iuranData, 
  onRecordMulti,
  onRecordBulk,
  onRecordCustom,
  nominalWajib, 
  setNominalWajib 
}) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Mode Input: 'hari', 'bulan', atau 'bebas'
  const [inputMode, setInputMode] = useState<'hari' | 'bulan' | 'bebas'>('hari');
  const [rekapMode, setRekapMode] = useState<'bulan' | 'tahun'>('tahun');
  const [activeTab, setActiveTab] = useState<'tunggakan' | 'lunas'>('tunggakan');

  // State untuk Form Input
  const [selectedWarga, setSelectedWarga] = useState('');
  const [inputMonth, setInputMonth] = useState(currentMonth);
  const [inputYear, setInputYear] = useState(currentYear);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [jumlahBulan, setJumlahBulan] = useState(1);
  const [amount, setAmount] = useState(0); 
  const [customKeterangan, setCustomKeterangan] = useState('');
  
  // State untuk Navigasi Matriks & Tunggakan
  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [viewYear, setViewYear] = useState(currentYear);
  
  // Fitur Search
  const [searchTerm, setSearchTerm] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditingNominal, setIsEditingNominal] = useState(false);
  const [tempNominal, setTempNominal] = useState(nominalWajib);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const daysInMonth = (m: number, y: number) => new Date(y, m, 0).getDate();
  
  // Warga diurutkan secara alfabetis untuk dropdown
  const sortedListWarga = useMemo(() => {
    return [...listWarga].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [listWarga]);

  const allDaysForInput = useMemo(() => {
    const count = daysInMonth(inputMonth, inputYear);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [inputMonth, inputYear]);

  // Kalkulasi Otomatis Berdasarkan Mode
  useEffect(() => {
    if (inputMode === 'hari') {
      setAmount(selectedDays.length * nominalWajib);
    } else if (inputMode === 'bulan') {
      let totalDays = 0;
      let m = inputMonth;
      let y = inputYear;
      for (let i = 0; i < jumlahBulan; i++) {
        totalDays += daysInMonth(m, y);
        m++;
        if (m > 12) { m = 1; y++; }
      }
      setAmount(totalDays * nominalWajib);
    }
  }, [selectedDays, nominalWajib, inputMode, jumlahBulan, inputMonth, inputYear]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a,b) => a-b)
    );
  };

  const selectAllInMonth = () => {
    const count = daysInMonth(inputMonth, inputYear);
    const range = Array.from({ length: count }, (_, i) => i + 1);
    setSelectedDays(range);
  };

  // Logic Rekap Tunggakan & Lunas
  const { rekapTunggakan, rekapLunas } = useMemo(() => {
    let targetKewajiban = 0;
    let filterPrefix = "";

    if (rekapMode === 'bulan') {
      filterPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
      if (viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth)) {
        targetKewajiban = daysInMonth(viewMonth, viewYear) * nominalWajib;
      } else if (viewYear === currentYear && viewMonth === currentMonth) {
        targetKewajiban = currentDay * nominalWajib;
      } else {
        targetKewajiban = 0;
      }
    } else {
      filterPrefix = `${currentYear}-`;
      const startOfYear = new Date(currentYear, 0, 1);
      const diffTime = Math.abs(today.getTime() - startOfYear.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      targetKewajiban = diffDays * nominalWajib;
    }

    const allData = listWarga.map(warga => {
      let totalBayar = 0;
      const dataWarga = iuranData[warga.id] || {};
      Object.entries(dataWarga).forEach(([date, val]) => {
        if (date.startsWith(filterPrefix)) totalBayar += (val as number);
      });
      return {
        id: warga.id,
        nama: warga.nama,
        blok: warga.blok,
        terbayar: totalBayar,
        kewajiban: targetKewajiban,
        sisa: Math.max(0, targetKewajiban - totalBayar),
      };
    });

    // Filter berdasarkan search term
    const searchFiltered = allData.filter(item => 
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.blok.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort alfabetis
    const sorted = searchFiltered.sort((a, b) => a.nama.localeCompare(b.nama));

    return {
      rekapTunggakan: sorted.filter(i => i.sisa > 0),
      rekapLunas: sorted.filter(i => i.sisa === 0 && i.terbayar > 0)
    };
  }, [listWarga, iuranData, viewMonth, viewYear, nominalWajib, currentDay, currentMonth, currentYear, rekapMode, searchTerm]);

  const currentSelectedWargaArrears = useMemo(() => {
    if (!selectedWarga) return 0;
    const startOfYear = new Date(currentYear, 0, 1);
    const diffTime = Math.abs(today.getTime() - startOfYear.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const targetKewajibanYTD = diffDays * nominalWajib;
    
    let totalBayarYTD = 0;
    const dataWarga = iuranData[selectedWarga] || {};
    Object.entries(dataWarga).forEach(([date, val]) => {
      if (date.startsWith(`${currentYear}-`)) totalBayarYTD += (val as number);
    });
    
    const sisa = targetKewajibanYTD - totalBayarYTD;
    return sisa > 0 ? sisa : 0;
  }, [selectedWarga, iuranData, nominalWajib, currentYear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarga || amount <= 0) return;

    if (inputMode === 'hari') {
      if (selectedDays.length === 0) return;
      onRecordMulti(selectedWarga, selectedDays, inputMonth, inputYear, amount);
    } else if (inputMode === 'bulan') {
      if (onRecordBulk) {
        onRecordBulk(selectedWarga, inputMonth, inputYear, jumlahBulan, amount);
      }
    } else {
      if (onRecordCustom) {
        onRecordCustom(selectedWarga, amount, customKeterangan);
      }
    }

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    
    setSelectedWarga('');
    setSelectedDays([]);
    setJumlahBulan(1);
    setAmount(0);
    setCustomKeterangan('');
  };

  const handleUpdateNominal = () => {
    setNominalWajib(tempNominal);
    setIsEditingNominal(false);
  };

  const handleQuickSettle = (wargaId: string, arrears: number) => {
    setSelectedWarga(wargaId);
    setInputMode('bebas');
    setAmount(arrears);
    setCustomKeterangan('Pelunasan Tunggakan YTD');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto w-full relative">
      {showSuccess && (
        <div className="fixed top-5 md:top-10 right-5 md:right-10 z-[110] bg-primary text-white px-6 md:px-8 py-4 md:py-5 rounded-2xl shadow-2xl font-black flex items-center gap-4 animate-in fade-in slide-in-from-right text-sm md:text-base">
          <span className="material-symbols-outlined">verified</span>
          Iuran Tercatat
        </div>
      )}

      <header className="mb-8 md:mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-600 dark:text-white">Iuran Warga</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base md:text-lg">Monitoring setoran lintas periode.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-stretch">
          <div className="bg-white dark:bg-card-dark px-6 md:px-8 py-4 md:py-5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5 flex-1 lg:flex-initial">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary shrink-0">
               <span className="material-symbols-outlined">settings_suggest</span>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Wajib/Hari</p>
              {isEditingNominal ? (
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="number"
                    value={tempNominal}
                    onChange={(e) => setTempNominal(parseInt(e.target.value) || 0)}
                    className="w-20 p-1 text-xs rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-700 text-primary font-black outline-none"
                  />
                  <button onClick={handleUpdateNominal} className="size-7 rounded-lg bg-primary text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg md:text-xl font-black text-slate-600 dark:text-white">Rp {nominalWajib.toLocaleString('id-ID')}</p>
                  <button onClick={() => setIsEditingNominal(true)} className="text-slate-300 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden border-t-4 border-t-primary transition-all h-fit">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-slate-50/20 dark:bg-transparent gap-4">
              <h2 className="text-lg font-black dark:text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">add_card</span>
                Catat Setoran
              </h2>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                 <button onClick={() => setInputMode('hari')} className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${inputMode === 'hari' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}>Harian</button>
                 <button onClick={() => setInputMode('bulan')} className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${inputMode === 'bulan' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}>Paket</button>
                 <button onClick={() => setInputMode('bebas')} className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${inputMode === 'bebas' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}>Bebas</button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nama Warga (A-Z)</label>
                   {selectedWarga && currentSelectedWargaArrears > 0 && (
                     <p className="text-[9px] font-black text-rose-500 uppercase">Hutang: Rp {currentSelectedWargaArrears.toLocaleString('id-ID')}</p>
                   )}
                </div>
                <select 
                  required
                  value={selectedWarga}
                  onChange={(e) => setSelectedWarga(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-4 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Pilih Warga...</option>
                  {sortedListWarga.map(w => (
                    <option key={w.id} value={w.id}>{w.nama} ({w.blok})</option>
                  ))}
                </select>
              </div>

              {inputMode !== 'bebas' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Bulan Mulai</label>
                    <select 
                      value={inputMonth}
                      onChange={(e) => setInputMonth(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm font-bold dark:text-white outline-none"
                    >
                      {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tahun</label>
                    <select 
                      value={inputYear}
                      onChange={(e) => setInputYear(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm font-bold dark:text-white outline-none"
                    >
                      {[currentYear-1, currentYear, currentYear+1].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {inputMode === 'hari' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pilih Tanggal</label>
                    <button type="button" onClick={selectAllInMonth} className="text-[9px] font-black text-primary uppercase underline">Pilih Semua</button>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {allDaysForInput.map(day => (
                      <button 
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`size-9 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${
                          selectedDays.includes(day) 
                            ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {inputMode === 'bulan' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Durasi (Bulan)</label>
                  <input 
                    type="number"
                    min="1"
                    max="12"
                    value={jumlahBulan}
                    onChange={(e) => setJumlahBulan(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-4 text-sm font-black dark:text-white outline-none"
                  />
                </div>
              )}

              {inputMode === 'bebas' && (
                <div className="space-y-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nominal Iuran (Rp)</label>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-4 text-lg font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Contoh: 10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Keterangan (Opsional)</label>
                    <input 
                      type="text"
                      value={customKeterangan}
                      onChange={(e) => setCustomKeterangan(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs dark:text-white outline-none"
                      placeholder="Contoh: Pelunasan s/d hari ini"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                   <p className="text-[10px] font-black uppercase text-slate-400">Total Setoran</p>
                   <p className="text-2xl font-black text-primary">Rp {amount.toLocaleString('id-ID')}</p>
                </div>
                <button 
                  type="submit"
                  disabled={amount <= 0 || !selectedWarga}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md h-full">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/20 dark:bg-transparent">
               {/* Tab Headers */}
               <div className="flex items-center justify-between mb-6">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    <button 
                      onClick={() => setActiveTab('tunggakan')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tunggakan' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Tunggakan
                    </button>
                    <button 
                      onClick={() => setActiveTab('lunas')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'lunas' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-sm">verified</span>
                      Sudah Lunas
                    </button>
                  </div>
                  
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button onClick={() => setRekapMode('bulan')} className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${rekapMode === 'bulan' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}>Bulan</button>
                    <button onClick={() => setRekapMode('tahun')} className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${rekapMode === 'tahun' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}>Tahun (YTD)</button>
                  </div>
               </div>

               {/* Search Bar for Table */}
               <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors text-lg">search</span>
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Cari nama warga di daftar ${activeTab === 'tunggakan' ? 'tunggakan' : 'lunas'}...`}
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
              {(activeTab === 'tunggakan' ? rekapTunggakan : rekapLunas).length === 0 ? (
                <div className="p-20 text-center">
                  <span className="material-symbols-outlined text-slate-100 dark:text-slate-800 text-7xl mb-4">
                    {activeTab === 'tunggakan' ? 'verified_user' : 'search_off'}
                  </span>
                  <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] italic">
                    {activeTab === 'tunggakan' 
                      ? 'Semua warga sudah lunas' 
                      : (searchTerm ? 'Warga tidak ditemukan' : 'Belum ada data warga lunas')}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-black uppercase text-slate-400 tracking-widest sticky top-0 z-10">
                    <tr>
                      <th className="px-8 py-5">Nama Warga (A-Z)</th>
                      <th className="px-8 py-5 text-right">Terbayar</th>
                      {activeTab === 'tunggakan' && <th className="px-8 py-5 text-right">Kekurangan</th>}
                      <th className="px-8 py-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {(activeTab === 'tunggakan' ? rekapTunggakan : rekapLunas).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-8 py-6">
                          <p className="text-xs font-black dark:text-white leading-none">{item.nama}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-wider">{item.blok}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className="text-xs font-bold text-emerald-500">Rp {item.terbayar.toLocaleString('id-ID')}</p>
                        </td>
                        {activeTab === 'tunggakan' && (
                          <td className="px-8 py-6 text-right">
                            <p className="text-xs font-black text-rose-500">Rp {item.sisa.toLocaleString('id-ID')}</p>
                          </td>
                        )}
                        <td className="px-8 py-6 text-center">
                           {activeTab === 'tunggakan' ? (
                             <button 
                              onClick={() => handleQuickSettle(item.id, item.sisa)}
                              title="Lunaskan Sekarang"
                              className="size-8 mx-auto rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                             >
                               <span className="material-symbols-outlined text-sm">done_all</span>
                             </button>
                           ) : (
                             <div className="size-8 mx-auto rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                               <span className="material-symbols-outlined text-sm">verified</span>
                             </div>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className={`p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center transition-all duration-500 ${activeTab === 'lunas' ? 'border-t-emerald-400' : 'border-t-amber-400'}`}>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {activeTab === 'tunggakan' ? 'Total Piutang Lingkungan' : 'Total Partisipasi Warga'}
               </p>
               <p className={`text-sm font-black ${activeTab === 'tunggakan' ? 'text-rose-500' : 'text-emerald-500'}`}>
                 Rp {(activeTab === 'tunggakan' ? rekapTunggakan.reduce((acc, i) => acc + i.sisa, 0) : rekapLunas.reduce((acc, i) => acc + i.terbayar, 0)).toLocaleString('id-ID')}
               </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default IuranHarian;
