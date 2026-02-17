
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MasterData from './components/MasterData';
import ManajemenWarga from './components/ManajemenWarga';
import IuranHarian from './components/IuranHarian';
import LaporanKeuangan from './components/LaporanKeuangan';
import PengeluaranKas from './components/PengeluaranKas';
import CloudBackup from './components/CloudBackup';
import Login from './components/Login';
import { AppView, Warga, Transaksi } from './types';

// Fix: Use process.env instead of import.meta.env to satisfy the environment requirements and fix TS errors.
// @ts-ignore
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
// @ts-ignore
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Hanya buat client jika URL valid untuk mencegah crash di level inisialisasi
const supabase = (SUPABASE_URL && SUPABASE_URL.startsWith('http')) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('rt_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('rt_user_id') || '';
  });
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('rt_theme') !== 'light';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Data State
  const [nominalWajib, setNominalWajib] = useState(500);
  const [listWarga, setListWarga] = useState<Warga[]>([]);
  const [listTransaksi, setListTransaksi] = useState<Transaksi[]>([]);
  const [iuranHarian, setIuranHarian] = useState<Record<string, Record<string, number>>>({});

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);

    if (!supabase) {
      console.warn("Konfigurasi Cloud tidak ditemukan. Menggunakan penyimpanan lokal.");
      const savedWarga = localStorage.getItem('rt_warga');
      const savedTrx = localStorage.getItem('rt_transaksi');
      const savedIuran = localStorage.getItem('rt_iuran');
      
      if (savedWarga) setListWarga(JSON.parse(savedWarga));
      if (savedTrx) setListTransaksi(JSON.parse(savedTrx));
      if (savedIuran) setIuranHarian(JSON.parse(savedIuran));
      
      setIsLoading(false);
      return;
    }
    
    try {
      const { data: wargaData, error: wError } = await supabase.from('warga').select('*');
      if (wError) throw wError;
      if (wargaData) {
        setListWarga(wargaData.map(w => ({
          id: w.id,
          nama: w.nama,
          noKK: w.no_kk,
          whatsapp: w.whatsapp,
          blok: w.blok,
          terdaftarAt: new Date(w.terdaftar_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        })));
      }

      const { data: trxData, error: tError } = await supabase.from('transaksi').select('*').order('timestamp_ms', { ascending: false });
      if (tError) throw tError;
      if (trxData) {
        setListTransaksi(trxData.map(t => ({
          id: t.id,
          tanggal: t.tanggal_tampilan,
          keterangan: t.keterangan,
          subKeterangan: t.sub_keterangan,
          kategori: t.kategori,
          jumlah: t.jumlah,
          timestamp: t.timestamp_ms
        })));
      }

      const { data: iuranRows, error: iError } = await supabase.from('iuran_harian').select('*');
      if (iError) throw iError;
      if (iuranRows) {
        const nested: Record<string, Record<string, number>> = {};
        iuranRows.forEach(row => {
          if (!nested[row.warga_id]) nested[row.warga_id] = {};
          nested[row.warga_id][row.tanggal] = row.jumlah;
        });
        setIuranHarian(nested);
      }

      const { data: settingData } = await supabase.from('pengaturan').select('*').eq('kunci', 'nominal_wajib').single();
      if (settingData) {
        setNominalWajib(parseInt(settingData.nilai));
      }

    } catch (error: any) {
      console.error('Koneksi Supabase Gagal:', error.message);
      setDbError(`Sinkronisasi gagal: ${error.message}. Aplikasi tetap berjalan dalam mode lokal.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    localStorage.setItem('rt_auth', isAuthenticated.toString());
    localStorage.setItem('rt_user_id', currentUser);
    localStorage.setItem('rt_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('rt_warga', JSON.stringify(listWarga));
    localStorage.setItem('rt_transaksi', JSON.stringify(listTransaksi));
    localStorage.setItem('rt_iuran', JSON.stringify(iuranHarian));
    
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isAuthenticated, currentUser, isDarkMode, listWarga, listTransaksi, iuranHarian]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLoginSuccess = (userId: string) => {
    setCurrentUser(userId);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if(confirm('Keluar dari sistem?')) {
      setIsAuthenticated(false);
      setCurrentUser('');
    }
  };

  const addWarga = async (warga: Omit<Warga, 'id' | 'terdaftarAt'>) => {
    const newId = crypto.randomUUID();
    const localWarga: Warga = {
      ...warga,
      id: newId,
      terdaftarAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    setListWarga(prev => [...prev, localWarga]);

    if (supabase) {
      const { error } = await supabase.from('warga').insert([{
        id: newId,
        nama: warga.nama,
        no_kk: warga.noKK,
        whatsapp: warga.whatsapp,
        blok: warga.blok
      }]);
      if (error) console.error("Cloud Error:", error.message);
    }
  };

  const deleteWarga = async (id: string) => {
    if(!confirm('Hapus data warga ini?')) return;
    setListWarga(prev => prev.filter(w => w.id !== id));
    if (supabase) {
      await supabase.from('warga').delete().eq('id', id);
    }
  };

  const addTransaksi = async (t: Omit<Transaksi, 'id' | 'timestamp'>) => {
    const newId = crypto.randomUUID();
    const timestamp = Date.now();
    const newT: Transaksi = { ...t, id: newId, timestamp };
    setListTransaksi(prev => [newT, ...prev]);

    if (supabase) {
      await supabase.from('transaksi').insert([{
        id: newId,
        tanggal_tampilan: t.tanggal,
        keterangan: t.keterangan,
        sub_keterangan: t.subKeterangan,
        kategori: t.kategori,
        jumlah: t.jumlah,
        timestamp_ms: timestamp
      }]);
    }
  };

  const updateNominalGlobal = async (val: number) => {
    setNominalWajib(val);
    if (supabase) {
      await supabase.from('pengaturan').upsert({ kunci: 'nominal_wajib', nilai: val.toString() });
    }
  };

  const recordIuranMulti = async (wargaId: string, days: number[], month: number, year: number, totalAmount: number) => {
    const warga = listWarga.find(w => w.id === wargaId);
    if (!warga || days.length === 0) return;
    const amountPerDay = Math.floor(totalAmount / days.length);
    const monthStr = String(month).padStart(2, '0');

    setIuranHarian(prev => {
      const newWargaIuran = { ...(prev[wargaId] || {}) };
      days.forEach(day => {
        const dateKey = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
        newWargaIuran[dateKey] = (newWargaIuran[dateKey] || 0) + amountPerDay;
      });
      return { ...prev, [wargaId]: newWargaIuran };
    });

    if (supabase) {
      const iuranPayload = days.map(day => ({
        warga_id: wargaId,
        tanggal: `${year}-${monthStr}-${String(day).padStart(2, '0')}`,
        jumlah: amountPerDay
      }));
      await supabase.from('iuran_harian').upsert(iuranPayload, { onConflict: 'warga_id,tanggal' });
    }

    addTransaksi({
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      keterangan: `Iuran: ${warga.nama}`,
      subKeterangan: `${new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long' })} ${year}`,
      kategori: 'masuk',
      jumlah: totalAmount
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Menyiapkan Aplikasi...</p>
        </div>
      );
    }

    return (
      <div className="h-full">
        {dbError && (
          <div className="m-5 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top">
            <span className="material-symbols-outlined text-amber-500">cloud_off</span>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-amber-500">Offline / Local Mode</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{dbError}</p>
            </div>
          </div>
        )}
        
        {(() => {
          switch (activeView) {
            case AppView.DASHBOARD: return <Dashboard listWarga={listWarga} listTransaksi={listTransaksi} iuranData={iuranHarian} nominalWajib={nominalWajib} currentUser={currentUser} />;
            case AppView.MASTER_DATA: return <MasterData listWarga={listWarga} onDelete={deleteWarga} />;
            case AppView.MANAJEMEN_WARGA: return <ManajemenWarga listWarga={listWarga} onAdd={addWarga} onDelete={deleteWarga} />;
            case AppView.IURAN_HARIAN: return <IuranHarian listWarga={listWarga} listTransaksi={listTransaksi} iuranData={iuranHarian} onRecordMulti={recordIuranMulti} nominalWajib={nominalWajib} setNominalWajib={updateNominalGlobal} />;
            case AppView.PENGELUARAN_KAS: return <PengeluaranKas listTransaksi={listTransaksi} onAddPengeluaran={addTransaksi} />;
            case AppView.LAPORAN_KEUANGAN: return <LaporanKeuangan listTransaksi={listTransaksi} onAddTransaksi={addTransaksi} />;
            case AppView.CLOUD_BACKUP: return <CloudBackup listWarga={listWarga} listTransaksi={listTransaksi} iuranData={iuranHarian} onImport={fetchAllData} />;
            default: return <Dashboard listWarga={listWarga} listTransaksi={listTransaksi} iuranData={iuranHarian} nominalWajib={nominalWajib} currentUser={currentUser} />;
          }
        })()}
      </div>
    );
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-600 dark:text-slate-100">
      <Sidebar activeView={activeView} setActiveView={setActiveView} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onLogout={handleLogout} currentUser={currentUser} />
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-24 lg:pb-0">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
