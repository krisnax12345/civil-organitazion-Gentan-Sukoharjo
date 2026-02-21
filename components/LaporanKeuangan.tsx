
import React, { useState, useMemo } from 'react';
import { Transaksi, Warga } from '../types';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  isWithinInterval, 
  parseISO, 
  format,
  subMonths,
  startOfDay,
  endOfDay
} from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Calendar, 
  Filter, 
  Printer, 
  PlusCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface LaporanKeuanganProps {
  listTransaksi: Transaksi[];
  onAddTransaksi: (t: Omit<Transaksi, 'id' | 'timestamp'>) => void;
  listWarga: Warga[];
  iuranData: Record<string, Record<string, number>>;
  nominalWajib: number;
  instansiName?: string;
  instansiAddress?: string;
  instansiLogo?: string;
}

type PeriodType = 'all' | 'this_month' | 'last_month' | 'this_year' | 'custom';

const LaporanKeuangan: React.FC<LaporanKeuanganProps> = ({ 
  listTransaksi, 
  onAddTransaksi, 
  listWarga,
  iuranData,
  nominalWajib,
  instansiName = 'Jimpitan RT', 
  instansiAddress = 'Lingkungan Aman Damai',
  instansiLogo = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('this_month');
  const [customRange, setCustomRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    keterangan: '',
    subKeterangan: '',
    kategori: 'masuk' as 'masuk' | 'keluar',
    jumlah: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaksi(formData);
    setShowModal(false);
    setFormData({ ...formData, keterangan: '', subKeterangan: '', jumlah: 0 });
  };

  // Filtering Logic
  const filteredTransaksi = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (selectedPeriod) {
      case 'this_month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'this_year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'custom':
        start = startOfDay(parseISO(customRange.start));
        end = endOfDay(parseISO(customRange.end));
        break;
      default:
        return listTransaksi;
    }

    return listTransaksi.filter(t => {
      const tDate = new Date(t.timestamp);
      return isWithinInterval(tDate, { start, end });
    });
  }, [listTransaksi, selectedPeriod, customRange]);

  const totalMasuk = filteredTransaksi.filter(t => t.kategori === 'masuk').reduce((acc, t) => acc + t.jumlah, 0);
  const totalKeluar = filteredTransaksi.filter(t => t.kategori === 'keluar').reduce((acc, t) => acc + t.jumlah, 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  // Calculation for Arrears (Kekurangan Bayar) in selected period
  const dataTunggakan = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (selectedPeriod) {
      case 'this_month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'this_year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'custom':
        start = startOfDay(parseISO(customRange.start));
        end = endOfDay(parseISO(customRange.end));
        break;
      default:
        return { total: 0, list: [] };
    }

    // Calculate days in period
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const kewajibanPerWarga = diffDays * nominalWajib;

    const list = listWarga.map(warga => {
      let terbayar = 0;
      const logWarga = iuranData[warga.id] || {};
      
      Object.entries(logWarga).forEach(([date, val]) => {
        const d = parseISO(date);
        if (isWithinInterval(d, { start, end })) {
          terbayar += (val as number);
        }
      });

      const sisa = kewajibanPerWarga - terbayar;
      return { ...warga, terbayar, sisa: sisa > 0 ? sisa : 0 };
    }).filter(w => w.sisa > 0);

    const total = list.reduce((acc, w) => acc + w.sisa, 0);
    return { total, list };
  }, [listWarga, iuranData, nominalWajib, selectedPeriod, customRange]);

  // Menghitung saldo berjalan untuk setiap transaksi (berdasarkan data yang terfilter)
  const listDenganSaldo = useMemo(() => {
    const sorted = [...filteredTransaksi].sort((a, b) => a.timestamp - b.timestamp);
    let currentRunningSaldo = 0;
    const computed = sorted.map(t => {
      if (t.kategori === 'masuk') currentRunningSaldo += t.jumlah;
      else currentRunningSaldo -= t.jumlah;
      return { ...t, runningSaldo: currentRunningSaldo };
    });
    return computed.reverse(); // Urutan terbaru di atas
  }, [filteredTransaksi]);

  const handlePrint = () => {
    window.print();
  };

  const periodLabels: Record<PeriodType, string> = {
    all: 'Semua Waktu',
    this_month: 'Bulan Ini',
    last_month: 'Bulan Lalu',
    this_year: 'Tahun Ini',
    custom: 'Rentang Kustom'
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full relative">
      <style>{`
        @media print {
          aside, button, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 2rem;
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 1rem;
          }
          .card-container {
            border: none !important;
            box-shadow: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            color: black !important;
          }
          .text-primary, .text-rose-400, .text-rose-500 {
            color: black !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
        .print-header { display: none; }
      `}</style>

      {/* Header Khusus Print */}
      <div className="print-header">
        <div className="flex items-center justify-center gap-6 mb-4">
          {instansiLogo && <img src={instansiLogo} alt="Logo" className="size-20 object-contain" />}
          <div className="text-center">
            <h1 className="text-2xl font-bold uppercase">{instansiName}</h1>
            <p className="text-sm max-w-md mx-auto">{instansiAddress}</p>
          </div>
        </div>
        <div className="border-b-4 border-double border-black mb-6"></div>
        <h2 className="text-xl font-bold uppercase text-center mb-2">Laporan Kas Jimpitan Digital</h2>
        <p className="text-sm text-center font-bold mb-2">Periode: {periodLabels[selectedPeriod]}</p>
        {selectedPeriod === 'custom' && (
          <p className="text-xs text-center mb-4">{format(parseISO(customRange.start), 'dd MMM yyyy')} s/d {format(parseISO(customRange.end), 'dd MMM yyyy')}</p>
        )}
        <p className="text-xs text-center">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white dark:bg-card-dark rounded-[40px] w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-transparent">
              <h3 className="text-2xl font-black dark:text-white tracking-tight uppercase">Transaksi Manual</h3>
              <button onClick={() => setShowModal(false)} className="size-10 flex items-center justify-center rounded-2xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, kategori: 'masuk'})}
                  className={`py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${
                    formData.kategori === 'masuk' ? 'bg-primary/10 border-primary text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-300'
                  }`}
                >Setoran</button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, kategori: 'keluar'})}
                  className={`py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${
                    formData.kategori === 'keluar' ? 'bg-rose-100/30 border-rose-400 text-rose-500' : 'border-slate-100 dark:border-slate-800 text-slate-300'
                  }`}
                >Belanja</button>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Keterangan</label>
                  <input required value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Mis: Konsumsi Rapat" />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Jumlah (Rp)</label>
                  <input required type="number" value={formData.jumlah} onChange={e => setFormData({...formData, jumlah: Number(e.target.value)})} className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 text-lg dark:text-white outline-none focus:ring-2 focus:ring-primary font-black" placeholder="0" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">CATAT TRANSAKSI</button>
            </form>
          </div>
        </div>
      )}

      <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-600 dark:text-white">Buku Kas RT</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Pencatatan transparan semua alur keuangan lingkungan.</p>
        </div>
        <div className="flex flex-wrap gap-4 no-print">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
          >
            <Printer size={18} />
            Cetak PDF
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
          >
            <PlusCircle size={18} />
            Transaksi Baru
          </button>
        </div>
      </header>

      {/* Period Selector */}
      <div className="mb-10 no-print">
        <div className="bg-white dark:bg-card-dark p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Filter size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter Laporan</p>
                <p className="text-sm font-bold dark:text-white">Pilih Periode Data</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {(['this_month', 'last_month', 'this_year', 'all', 'custom'] as PeriodType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                    selectedPeriod === p 
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-primary/30'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>

          {selectedPeriod === 'custom' && (
            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex flex-wrap items-center gap-6 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mulai Dari</label>
                <input 
                  type="date" 
                  value={customRange.start}
                  onChange={e => setCustomRange({...customRange, start: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sampai Dengan</label>
                <input 
                  type="date" 
                  value={customRange.end}
                  onChange={e => setCustomRange({...customRange, end: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button 
                onClick={() => setSelectedPeriod('custom')}
                className="mt-auto mb-0.5 flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                <RefreshCw size={14} />
                Restore Data
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 card-container">
        <div className="bg-white dark:bg-card-dark rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md border-b-4 border-b-primary">
          <div className="flex items-center gap-4 mb-3">
             <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <Wallet size={20} />
             </div>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Saldo Periode</p>
          </div>
          <p className="text-3xl font-black dark:text-white tracking-tight">Rp {saldoAkhir.toLocaleString('id-ID')}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            {periodLabels[selectedPeriod]}
          </p>
        </div>
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-[32px] p-8 border border-emerald-100 dark:border-emerald-900/30 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-3">
             <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
               <ArrowDownCircle size={20} />
             </div>
             <p className="text-emerald-600/60 dark:text-emerald-400/60 text-[10px] font-black uppercase tracking-widest">Total Masuk</p>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">Rp {totalMasuk.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-[32px] p-8 border border-rose-100 dark:border-rose-900/30 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-3">
             <div className="size-10 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-500">
               <ArrowUpCircle size={20} />
             </div>
             <p className="text-rose-600/60 dark:text-rose-400/60 text-[10px] font-black uppercase tracking-widest">Total Keluar</p>
          </div>
          <p className="text-3xl font-black text-rose-500 tracking-tight">Rp {totalKeluar.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-[32px] p-8 border border-amber-100 dark:border-amber-900/30 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-3">
             <div className="size-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-500">
               <span className="material-symbols-outlined">warning</span>
             </div>
             <p className="text-amber-600/60 dark:text-amber-400/60 text-[10px] font-black uppercase tracking-widest">Kekurangan Bayar</p>
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">Rp {dataTunggakan.total.toLocaleString('id-ID')}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            {dataTunggakan.list.length} Warga Belum Lunas
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md card-container">
        <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30 dark:bg-transparent no-print">
          <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
             <Calendar className="text-primary" size={24} />
             Riwayat Arus Kas
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full uppercase tracking-widest">
              {filteredTransaksi.length} Transaksi
            </span>
            <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full uppercase tracking-widest">
              {periodLabels[selectedPeriod]}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredTransaksi.length === 0 ? (
            <div className="p-24 text-center">
              <RefreshCw className="text-slate-200 size-16 mx-auto mb-4 animate-spin-slow" />
              <p className="italic text-slate-300 font-bold uppercase tracking-widest text-xs">Tidak ada data untuk periode ini</p>
              <button 
                onClick={() => setSelectedPeriod('all')}
                className="mt-4 text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                Tampilkan Semua Data
              </button>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-10 py-6">Tanggal</th>
                  <th className="px-10 py-6">Keterangan</th>
                  <th className="px-10 py-6 text-right">Debit (+)</th>
                  <th className="px-10 py-6 text-right">Kredit (-)</th>
                  <th className="px-10 py-6 text-right bg-slate-100/50 dark:bg-slate-800/20">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {listDenganSaldo.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-10 py-7 text-xs font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                      {format(new Date(row.timestamp), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="px-10 py-7">
                      <p className="font-black text-slate-600 dark:text-white leading-tight">{row.keterangan}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{row.subKeterangan}</p>
                    </td>
                    <td className="px-10 py-7 text-right">
                      {row.kategori === 'masuk' ? (
                        <span className="font-black text-primary text-sm whitespace-nowrap">+Rp {row.jumlah.toLocaleString('id-ID')}</span>
                      ) : '-'}
                    </td>
                    <td className="px-10 py-7 text-right">
                      {row.kategori === 'keluar' ? (
                        <span className="font-black text-rose-500 text-sm whitespace-nowrap">-Rp {row.jumlah.toLocaleString('id-ID')}</span>
                      ) : '-'}
                    </td>
                    <td className="px-10 py-7 text-right font-black text-slate-600 dark:text-white bg-slate-100/20 dark:bg-slate-800/10 whitespace-nowrap">
                      Rp {row.runningSaldo.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-8 text-center no-print">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Sistem Digital Jimpitan RT v2.5 • Data Tersimpan Secara Real-time
        </p>
      </div>
    </div>
  );
};

export default LaporanKeuangan;
