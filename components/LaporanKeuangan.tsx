
import React, { useState, useMemo } from 'react';
import { Transaksi } from '../types';

interface LaporanKeuanganProps {
  listTransaksi: Transaksi[];
  // Fix: changed Omit<Transaksi, 'id'> to Omit<Transaksi, 'id' | 'timestamp'> to match App.tsx implementation
  onAddTransaksi: (t: Omit<Transaksi, 'id' | 'timestamp'>) => void;
}

const LaporanKeuangan: React.FC<LaporanKeuanganProps> = ({ listTransaksi, onAddTransaksi }) => {
  const [showModal, setShowModal] = useState(false);
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

  const totalMasuk = listTransaksi.filter(t => t.kategori === 'masuk').reduce((acc, t) => acc + t.jumlah, 0);
  const totalKeluar = listTransaksi.filter(t => t.kategori === 'keluar').reduce((acc, t) => acc + t.jumlah, 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  // Menghitung saldo berjalan untuk setiap transaksi (dari bawah ke atas)
  const listDenganSaldo = useMemo(() => {
    const reversed = [...listTransaksi].reverse();
    let currentRunningSaldo = 0;
    const computed = reversed.map(t => {
      if (t.kategori === 'masuk') currentRunningSaldo += t.jumlah;
      else currentRunningSaldo -= t.jumlah;
      return { ...t, runningSaldo: currentRunningSaldo };
    });
    return computed.reverse(); // Kembalikan ke urutan terbaru di atas
  }, [listTransaksi]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-10 max-w-7xl mx-auto w-full relative">
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
        <h1 className="text-2xl font-bold uppercase">Laporan Kas Jimpitan Digital</h1>
        <p className="text-sm">RT 05 / RW 12 - Lingkungan Aman Damai</p>
        <p className="text-xs mt-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
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

      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-600 dark:text-white">Buku Kas RT</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Pencatatan transparan semua alur keuangan lingkungan.</p>
        </div>
        <div className="flex gap-4 no-print">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white font-black hover:scale-105 transition-all shadow-xl"
          >
            <span className="material-symbols-outlined">print</span>
            Cetak PDF
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-black hover:scale-105 transition-all shadow-xl shadow-primary/20"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Transaksi Baru
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 card-container">
        <div className="bg-white dark:bg-card-dark rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md border-b-4 border-b-primary">
          <div className="flex items-center gap-4 mb-3">
             <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
               <span className="material-symbols-outlined">account_balance_wallet</span>
             </div>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Saldo Akhir</p>
          </div>
          <p className="text-3xl font-black dark:text-white tracking-tight">Rp {saldoAkhir.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-[32px] p-8 border border-emerald-100 dark:border-emerald-900/30 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-3">
             <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
               <span className="material-symbols-outlined">arrow_downward</span>
             </div>
             <p className="text-emerald-600/60 dark:text-emerald-400/60 text-[10px] font-black uppercase tracking-widest">Total Masuk</p>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">Rp {totalMasuk.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-[32px] p-8 border border-rose-100 dark:border-rose-900/30 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-3">
             <div className="size-10 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-500">
               <span className="material-symbols-outlined">arrow_upward</span>
             </div>
             <p className="text-rose-600/60 dark:text-rose-400/60 text-[10px] font-black uppercase tracking-widest">Total Keluar</p>
          </div>
          <p className="text-3xl font-black text-rose-500 tracking-tight">Rp {totalKeluar.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md card-container">
        <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-transparent no-print">
          <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
             <span className="material-symbols-outlined text-primary">list_alt</span>
             Riwayat Arus Kas
          </h3>
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full uppercase tracking-widest">
            {listTransaksi.length} Transaksi
          </span>
        </div>
        <div className="overflow-x-auto">
          {listTransaksi.length === 0 ? (
            <div className="p-24 text-center">
              <span className="material-symbols-outlined text-slate-200 text-6xl mb-4">account_balance</span>
              <p className="italic text-slate-300 font-bold uppercase tracking-widest text-xs">Belum ada transaksi tercatat</p>
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
                    <td className="px-10 py-7 text-xs font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">{row.tanggal}</td>
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
          Sistem Digital Jimpitan RT v2.0 • Data Tersimpan Secara Real-time
        </p>
      </div>
    </div>
  );
};

export default LaporanKeuangan;
