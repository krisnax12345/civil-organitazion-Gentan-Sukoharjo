
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Warga, Transaksi } from '../types';

interface DashboardProps {
  listWarga: Warga[];
  listTransaksi: Transaksi[];
  iuranData?: Record<string, Record<string, number>>;
  nominalWajib?: number;
  currentUser?: string;
  instansiName?: string;
  instansiLogo?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  listWarga, 
  listTransaksi, 
  iuranData = {}, 
  nominalWajib = 500, 
  currentUser = 'Pengurus', 
  instansiName = 'Jimpitan RT',
  instansiLogo = ''
}) => {
  const currentYear = new Date().getFullYear();
  const [matrixYear, setMatrixYear] = useState(currentYear);
  const [selectedCheckId, setSelectedCheckId] = useState<string>('');
  
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];

  const today = new Date();
  const currentMonth = today.getMonth();
  const startOfYear = new Date(currentYear, 0, 1);
  const diffTime = Math.abs(today.getTime() - startOfYear.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const kewajibanYTD = diffDays * (nominalWajib || 500);

  const totalSaldo = listTransaksi.reduce((acc, t) => acc + (t.kategori === 'masuk' ? t.jumlah : -t.jumlah), 0);
  
  const filteredBulanIni = listTransaksi.filter(t => {
    const tDate = new Date(t.timestamp);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const pemasukanBulanIni = filteredBulanIni
    .filter(t => t.kategori === 'masuk')
    .reduce((acc, t) => acc + t.jumlah, 0);
    
  const pengeluaranBulanIni = filteredBulanIni
    .filter(t => t.kategori === 'keluar')
    .reduce((acc, t) => acc + t.jumlah, 0);

  // Perhitungan Data Tunggakan AKUMULASI DARI AWAL TAHUN
  const dataTunggakanYTD = useMemo(() => {
    return listWarga.map(warga => {
      let terbayarTahunIni = 0;
      const logWarga = iuranData[warga.id] || {};
      Object.entries(logWarga).forEach(([date, val]) => {
        if (date.startsWith(`${currentYear}-`)) {
          terbayarTahunIni += (val as number);
        }
      });
      const sisa = kewajibanYTD - terbayarTahunIni;
      return { ...warga, terbayar: terbayarTahunIni, sisa: sisa > 0 ? sisa : 0 };
    }).filter(w => w.sisa > 0).sort((a, b) => b.sisa - a.sisa); 
  }, [listWarga, iuranData, kewajibanYTD, currentYear]);

  const totalTunggakanValue = dataTunggakanYTD.reduce((acc, w) => acc + w.sisa, 0);

  const paymentMatrix = useMemo(() => {
    return [...listWarga]
      .sort((a, b) => a.nama.localeCompare(b.nama))
      .map(warga => {
        const logWarga = iuranData[warga.id] || {};
        const monthlyStatus = months.map((_, index) => {
          const monthStr = String(index + 1).padStart(2, '0');
          const prefix = `${matrixYear}-${monthStr}`;
          const hasPaid = Object.keys(logWarga).some(date => date.startsWith(prefix));
          return hasPaid;
        });
        return { ...warga, monthlyStatus };
      });
  }, [listWarga, iuranData, matrixYear]);

  // Kalkulasi detail warga terpilih dari dropdown
  const selectedWargaData = useMemo(() => {
    if (!selectedCheckId) return null;
    const warga = listWarga.find(w => w.id === selectedCheckId);
    if (!warga) return null;

    let terbayar = 0;
    const logWarga = iuranData[warga.id] || {};
    Object.entries(logWarga).forEach(([date, val]) => {
      if (date.startsWith(`${currentYear}-`)) {
        terbayar += (val as number);
      }
    });

    const sisa = kewajibanYTD - terbayar;
    const persentase = Math.min(100, Math.round((terbayar / (kewajibanYTD || 1)) * 100));

    return {
      ...warga,
      terbayar,
      sisa: sisa > 0 ? sisa : 0,
      kewajiban: kewajibanYTD,
      persentase
    };
  }, [selectedCheckId, listWarga, iuranData, kewajibanYTD, currentYear]);

  const chartData = [{ name: 'Kas RT', income: pemasukanBulanIni, expense: pengeluaranBulanIni }];

  const StatCard: React.FC<{ 
    title: string; value: string; trend: string; isUp: boolean; icon: string; color: string; subValue?: string;
  }> = ({ title, value, trend, isUp, icon, color, subValue }) => (
    <div className="bg-white dark:bg-card-dark flex flex-col gap-5 rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 ${color}`}>
           <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-slate-600 dark:text-white tracking-tight text-2xl md:text-3xl font-black">{value}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`material-symbols-outlined text-xs font-bold ${isUp ? 'text-blue-500' : 'text-rose-500'}`}>
            {isUp ? 'trending_up' : 'trending_down'}
          </span>
          <p className={`text-[10px] font-bold ${isUp ? 'text-blue-500' : 'text-rose-500'}`}>
            {trend} <span className="text-slate-400 font-medium ml-1">{subValue || 'aktivitas'}</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto w-full">
      <header className="mb-8 md:mb-10">
        <div className="flex items-center gap-4 mb-4">
           {instansiLogo ? (
             <img src={instansiLogo} alt="Logo" className="size-12 object-contain rounded-lg bg-white p-1 shadow-sm" />
           ) : (
             <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">savings</span>
             </div>
           )}
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{instansiName}</p>
             <h2 className="text-3xl md:text-4xl font-black text-slate-600 dark:text-white tracking-tight leading-none mt-1">Halo, {currentUser}</h2>
           </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">Ringkasan kondisi keuangan dan partisipasi warga (Tahun {currentYear}).</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-10">
        <StatCard title="Total Saldo Kas" value={`Rp ${totalSaldo.toLocaleString('id-ID')}`} trend="Aktif" isUp={true} icon="account_balance" color="text-primary" />
        <StatCard title="Pemasukan Bulan Ini" value={`Rp ${pemasukanBulanIni.toLocaleString('id-ID')}`} trend={`${listTransaksi.filter(t => t.kategori === 'masuk').length}`} isUp={true} icon="payments" color="text-emerald-500" />
        <StatCard title="Pengeluaran Bulan Ini" value={`Rp ${pengeluaranBulanIni.toLocaleString('id-ID')}`} trend={`${listTransaksi.filter(t => t.kategori === 'keluar').length}`} isUp={false} icon="receipt_long" color="text-rose-400" />
        <StatCard title="Tunggakan s/d Hari Ini" value={`Rp ${totalTunggakanValue.toLocaleString('id-ID')}`} trend={`${dataTunggakanYTD.length} Warga`} isUp={false} icon="warning" color="text-amber-500" subValue="sejak Jan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
            <h3 className="text-slate-600 dark:text-white text-lg font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Arus Kas Bulan Ini
            </h3>
            <div className="h-[200px] md:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="income" name="Masuk" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={50} />
                  <Bar dataKey="expense" name="Keluar" fill="#f87171" radius={[10, 10, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-slate-600 dark:text-white text-lg font-black flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500">grid_view</span>
                  Matriks Setoran {matrixYear}
                </h3>
                
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                  <button 
                    onClick={() => setMatrixYear(prev => prev - 1)}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-primary transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <p className="px-2 text-xs font-black dark:text-white min-w-[50px] text-center">{matrixYear}</p>
                  <button 
                    onClick={() => setMatrixYear(prev => prev + 1)}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-primary transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  {matrixYear !== currentYear && (
                    <button 
                      onClick={() => setMatrixYear(currentYear)}
                      className="ml-1 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-white dark:bg-slate-700 text-primary rounded-lg shadow-sm"
                    >
                      Sekarang
                    </button>
                  )}
                </div>
             </div>
             <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left min-w-[800px]">
                 <thead className="bg-slate-50 dark:bg-slate-800/40 text-[9px] font-black uppercase tracking-widest text-slate-400">
                   <tr>
                     <th className="px-6 py-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Warga (A-Z)</th>
                     {months.map(m => (
                       <th key={m} className="px-4 py-4 text-center">{m}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                   {paymentMatrix.map(row => (
                     <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 sticky left-0 bg-white dark:bg-card-dark z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                           <p className="text-xs font-black dark:text-white truncate max-w-[120px]">{row.nama}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{row.blok}</p>
                        </td>
                        {row.monthlyStatus.map((hasPaid, i) => (
                          <td key={i} className="px-4 py-4 text-center">
                             {hasPaid ? (
                               <span className="material-symbols-outlined text-emerald-500 text-lg fill-1">check_circle</span>
                             ) : (
                               <span className="text-slate-200 dark:text-slate-800 font-bold text-lg">—</span>
                             )}
                          </td>
                        ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          {/* New Feature: Cek Tunggakan Warga Dropdown */}
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm">
             <h4 className="text-[10px] font-black dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
               <span className="material-symbols-outlined text-amber-500 text-sm">person_search</span>
               Cek Tunggakan Warga
             </h4>
             <select 
               value={selectedCheckId}
               onChange={(e) => setSelectedCheckId(e.target.value)}
               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20 mb-6"
             >
               <option value="">Pilih Nama Warga...</option>
               {[...listWarga].sort((a,b) => a.nama.localeCompare(b.nama)).map(w => (
                 <option key={w.id} value={w.id}>{w.nama} ({w.blok})</option>
               ))}
             </select>

             {selectedWargaData ? (
               <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Status Pembayaran YTD</p>
                       <p className={`text-xl font-black mt-1 ${selectedWargaData.sisa > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                         {selectedWargaData.sisa > 0 ? 'Ada Tunggakan' : 'Lunas Terbayar'}
                       </p>
                    </div>
                    <p className="text-lg font-black dark:text-white">{selectedWargaData.persentase}%</p>
                  </div>

                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${selectedWargaData.persentase === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                      style={{ width: `${selectedWargaData.persentase}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Terbayar</p>
                       <p className="text-sm font-black text-emerald-500 mt-1">Rp {selectedWargaData.terbayar.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sisa</p>
                       <p className="text-sm font-black text-rose-500 mt-1">Rp {selectedWargaData.sisa.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
               </div>
             ) : (
               <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-slate-200 dark:text-slate-800 text-4xl mb-2">person</span>
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">Pilih warga untuk lihat detail</p>
               </div>
             )}
          </div>

          <div className="bg-primary/10 border border-primary/20 p-6 md:p-8 rounded-3xl">
             <div className="flex items-center gap-4 mb-6">
                <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 shrink-0">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <div>
                  <p className="text-2xl font-black dark:text-white leading-none">{listWarga.length}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mt-1">Total Warga</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                  <span className="text-slate-400">Patuh Bayar YTD</span>
                  <span className="text-emerald-500">{Math.round(((listWarga.length - dataTunggakanYTD.length) / (listWarga.length || 1)) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${((listWarga.length - dataTunggakanYTD.length) / (listWarga.length || 1)) * 100}%` }}
                   ></div>
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm overflow-hidden">
             <h4 className="text-[10px] font-black dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
               <span className="material-symbols-outlined text-primary text-sm">history</span>
               Mutasi Terbaru
             </h4>
             <div className="space-y-4">
                {listTransaksi.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center gap-3">
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-black dark:text-white truncate">{t.keterangan}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{t.tanggal}</p>
                    </div>
                    <p className={`text-[11px] font-black shrink-0 ${t.kategori === 'masuk' ? 'text-primary' : 'text-rose-500'}`}>
                      {t.kategori === 'masuk' ? '+' : '-'} {t.jumlah.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
