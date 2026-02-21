
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MasterData from './components/MasterData';
import ManajemenWarga from './components/ManajemenWarga';
import IuranHarian from './components/IuranHarian';
import LaporanKeuangan from './components/LaporanKeuangan';
import PengeluaranKas from './components/PengeluaranKas';
import Pengaturan from './components/Pengaturan';
import Login from './components/Login';
import { AppView, Warga, Transaksi, User, UserRole } from './types';

// Fungsi pembantu untuk mengambil variabel lingkungan secara aman
const getEnv = (name: string): string => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[name]) return process.env[name];
    // @ts-ignore
    if (import.meta && (import.meta as any).env && (import.meta as any).env[name]) return (import.meta as any).env[name];
  } catch (e) {}
  return '';
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('rt_auth') === 'true');
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('rt_user_id') || '');
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('rt_theme') !== 'light');
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Cloud Config State
  const [cloudConfig, setCloudConfig] = useState(() => {
    const savedUrl = localStorage.getItem('rt_supabase_url') || getEnv('VITE_SUPABASE_URL');
    const savedKey = localStorage.getItem('rt_supabase_key') || getEnv('VITE_SUPABASE_ANON_KEY');
    return { url: savedUrl, key: savedKey };
  });

  // Database Client State
  const supabase = useMemo(() => {
    if (cloudConfig.url && cloudConfig.url.startsWith('http') && cloudConfig.key) {
      return createClient(cloudConfig.url, cloudConfig.key);
    }
    return null;
  }, [cloudConfig.url, cloudConfig.key]);

  // Data State
  const [nominalWajib, setNominalWajib] = useState(500);
  const [instansiName, setInstansiName] = useState(() => localStorage.getItem('rt_instansi_name') || 'Jimpitan RT');
  const [instansiAddress, setInstansiAddress] = useState(() => localStorage.getItem('rt_instansi_address') || 'Lingkungan Aman Damai');
  const [instansiLogo, setInstansiLogo] = useState(() => localStorage.getItem('rt_instansi_logo') || '');
  const [listWarga, setListWarga] = useState<Warga[]>([]);
  const [listUsers, setListUsers] = useState<User[]>([]);
  const [listTransaksi, setListTransaksi] = useState<Transaksi[]>([]);
  const [iuranHarian, setIuranHarian] = useState<Record<string, Record<string, number>>>({});

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    
    // Load instan dari cache lokal
    const savedWarga = localStorage.getItem('rt_warga');
    const savedTrx = localStorage.getItem('rt_transaksi');
    const savedIuran = localStorage.getItem('rt_iuran');
    const savedUsers = localStorage.getItem('rt_users');
    
    if (savedWarga) setListWarga(JSON.parse(savedWarga));
    if (savedTrx) setListTransaksi(JSON.parse(savedTrx));
    if (savedIuran) setIuranHarian(JSON.parse(savedIuran));
    if (savedUsers) setListUsers(JSON.parse(savedUsers));

    if (!supabase) {
      setDbError(null); // Bukan error, hanya belum setup
      setIsLoading(false);
      return;
    }
    
    try {
      setDbError(null);
      // Fetch Warga
      const { data: wargaData, error: wError } = await supabase.from('warga').select('*');
      if (wError) throw wError;
      
      // Fetch Users
      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) {
        setListUsers(usersData.map(u => ({
          id: u.id,
          nama: u.nama,
          jabatan: u.jabatan,
          userId: u.user_id,
          pass: u.pass,
          role: u.role as UserRole
        })));
      }

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

      // Fetch Transaksi
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
          timestamp: Number(t.timestamp_ms)
        })));
      }

      // Fetch Iuran
      const { data: iuranRows, error: iError } = await supabase.from('iuran_harian').select('*');
      if (iError) throw iError;
      if (iuranRows) {
        const nested: Record<string, Record<string, number>> = {};
        iuranRows.forEach(row => {
          if (!nested[row.warga_id]) nested[row.warga_id] = {};
          nested[row.warga_id][row.tanggal] = Number(row.jumlah);
        });
        setIuranHarian(nested);
      }

      // Fetch Settings
      const { data: settingData } = await supabase.from('pengaturan').select('*');
      if (settingData) {
        const nominal = settingData.find(s => s.kunci === 'nominal_wajib');
        const name = settingData.find(s => s.kunci === 'instansi_name');
        const address = settingData.find(s => s.kunci === 'instansi_address');
        const logo = settingData.find(s => s.kunci === 'instansi_logo');
        if (nominal) setNominalWajib(parseInt(nominal.nilai));
        if (name) setInstansiName(name.nilai);
        if (address) setInstansiAddress(address.nilai);
        if (logo) setInstansiLogo(logo.nilai);
      }

    } catch (error: any) {
      console.error('Cloud Sync Error:', error.message);
      setDbError(`Gagal sinkronisasi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    localStorage.setItem('rt_auth', isAuthenticated.toString());
    localStorage.setItem('rt_user_id', currentUser);
    localStorage.setItem('rt_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('rt_warga', JSON.stringify(listWarga));
    localStorage.setItem('rt_users', JSON.stringify(listUsers));
    localStorage.setItem('rt_transaksi', JSON.stringify(listTransaksi));
    localStorage.setItem('rt_iuran', JSON.stringify(iuranHarian));
    localStorage.setItem('rt_supabase_url', cloudConfig.url);
    localStorage.setItem('rt_supabase_key', cloudConfig.key);
    localStorage.setItem('rt_instansi_name', instansiName);
    localStorage.setItem('rt_instansi_address', instansiAddress);
    localStorage.setItem('rt_instansi_logo', instansiLogo);
    
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isAuthenticated, currentUser, isDarkMode, listWarga, listTransaksi, iuranHarian, cloudConfig, instansiName]);

  const updateCloudSettings = (url: string, key: string) => {
    setCloudConfig({ url, key });
    // Trigger refresh setelah state update
    setTimeout(() => fetchAllData(), 100);
  };

  const handleLogout = () => {
    if(confirm('Keluar dari sistem?')) {
      setIsAuthenticated(false);
      setCurrentUser('');
    }
  };

  // Mutasi Data (Cloud + Local)
  const addWarga = async (warga: Omit<Warga, 'id' | 'terdaftarAt'>) => {
    const newId = crypto.randomUUID();
    const localWarga: Warga = { ...warga, id: newId, terdaftarAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) };
    setListWarga(prev => [...prev, localWarga]);
    if (supabase) await supabase.from('warga').insert([{ id: newId, nama: warga.nama, no_kk: warga.noKK, whatsapp: warga.whatsapp, blok: warga.blok }]);
  };

  const updateWarga = async (id: string, updated: Partial<Warga>) => {
    setListWarga(prev => prev.map(w => w.id === id ? { ...w, ...updated } : w));
    if (supabase) {
      const payload: any = {};
      if (updated.nama) payload.nama = updated.nama;
      if (updated.noKK) payload.no_kk = updated.noKK;
      if (updated.whatsapp) payload.whatsapp = updated.whatsapp;
      if (updated.blok) payload.blok = updated.blok;
      await supabase.from('warga').update(payload).eq('id', id);
    }
  };

  const deleteWarga = async (id: string) => {
    if(!confirm('Hapus data warga ini?')) return;
    setListWarga(prev => prev.filter(w => w.id !== id));
    if (supabase) await supabase.from('warga').delete().eq('id', id);
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    const newId = crypto.randomUUID();
    const newUser: User = { ...user, id: newId };
    setListUsers(prev => [...prev, newUser]);
    if (supabase) await supabase.from('users').insert([{ id: newId, nama: user.nama, jabatan: user.jabatan, user_id: user.userId, pass: user.pass, role: user.role }]);
  };

  const updateUser = async (id: string, updated: Partial<User>) => {
    setListUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
    if (supabase) {
      const payload: any = {};
      if (updated.nama) payload.nama = updated.nama;
      if (updated.jabatan) payload.jabatan = updated.jabatan;
      if (updated.userId) payload.user_id = updated.userId;
      if (updated.pass) payload.pass = updated.pass;
      if (updated.role) payload.role = updated.role;
      await supabase.from('users').update(payload).eq('id', id);
    }
  };

  const deleteUser = async (id: string) => {
    if(!confirm('Hapus user ini?')) return;
    setListUsers(prev => prev.filter(u => u.id !== id));
    if (supabase) await supabase.from('users').delete().eq('id', id);
  };

  const addTransaksi = async (t: Omit<Transaksi, 'id' | 'timestamp'>) => {
    const newId = crypto.randomUUID();
    const timestamp = Date.now();
    const newT: Transaksi = { ...t, id: newId, timestamp };
    setListTransaksi(prev => [newT, ...prev]);
    if (supabase) await supabase.from('transaksi').insert([{ id: newId, tanggal_tampilan: t.tanggal, keterangan: t.keterangan, sub_keterangan: t.subKeterangan, kategori: t.kategori, jumlah: t.jumlah, timestamp_ms: timestamp }]);
  };

  const updateNominalGlobal = async (val: number) => {
    setNominalWajib(val);
    if (supabase) await supabase.from('pengaturan').upsert({ kunci: 'nominal_wajib', nilai: val.toString() });
  };

  const updateInstansiProfile = async (name: string, address: string, logo: string) => {
    setInstansiName(name);
    setInstansiAddress(address);
    setInstansiLogo(logo);
    if (supabase) {
      await supabase.from('pengaturan').upsert([
        { kunci: 'instansi_name', nilai: name },
        { kunci: 'instansi_address', nilai: address },
        { kunci: 'instansi_logo', nilai: logo }
      ]);
    }
  };

  const resetAllData = async () => {
    if (!confirm('PERINGATAN KRITIS: Seluruh data Warga, Transaksi, dan Iuran akan dihapus PERMANEN. Tindakan ini tidak bisa dibatalkan. Lanjutkan?')) return;
    
    setListWarga([]);
    setListTransaksi([]);
    setIuranHarian({});
    
    localStorage.removeItem('rt_warga');
    localStorage.removeItem('rt_transaksi');
    localStorage.removeItem('rt_iuran');

    if (supabase) {
      try {
        // Menghapus semua baris dengan filter yang selalu benar
        await supabase.from('iuran_harian').delete().neq('id', 0);
        await supabase.from('transaksi').delete().filter('jumlah', 'gte', 0);
        await supabase.from('warga').delete().filter('nama', 'neq', '___');
        alert('Data di Cloud dan Lokal berhasil dibersihkan.');
      } catch (error: any) {
        console.error('Reset Error:', error.message);
        alert('Data lokal berhasil dihapus, namun gagal membersihkan Cloud: ' + error.message);
      }
    } else {
      alert('Data lokal berhasil dibersihkan.');
    }
    
    setActiveView(AppView.DASHBOARD);
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
      const payload = days.map(day => ({ 
        warga_id: wargaId, 
        tanggal: `${year}-${monthStr}-${String(day).padStart(2, '0')}`, 
        jumlah: amountPerDay 
      }));
      await supabase.from('iuran_harian').upsert(payload, { onConflict: 'warga_id,tanggal' });
    }

    addTransaksi({ 
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), 
      keterangan: `Iuran: ${warga.nama}`, 
      subKeterangan: `Harian (${days.length} hari) - ${new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'short' })} ${year}`, 
      kategori: 'masuk', 
      jumlah: totalAmount 
    });
  };

  const recordIuranBulk = async (wargaId: string, startMonth: number, startYear: number, totalMonths: number, totalAmount: number) => {
    const warga = listWarga.find(w => w.id === wargaId);
    if (!warga) return;

    const monthEntries: {tanggal: string, jumlah: number}[] = [];
    let currentM = startMonth;
    let currentY = startYear;
    const amountPerMonth = Math.floor(totalAmount / totalMonths);

    setIuranHarian(prev => {
      const newWargaIuran = { ...(prev[wargaId] || {}) };
      for (let i = 0; i < totalMonths; i++) {
        const mStr = String(currentM).padStart(2, '0');
        // Kita catat sebagai tanggal 01 di bulan tersebut untuk matriks
        const dateKey = `${currentY}-${mStr}-01`;
        newWargaIuran[dateKey] = (newWargaIuran[dateKey] || 0) + amountPerMonth;
        monthEntries.push({ warga_id: wargaId, tanggal: dateKey, jumlah: amountPerMonth } as any);
        
        currentM++;
        if (currentM > 12) { currentM = 1; currentY++; }
      }
      return { ...prev, [wargaId]: newWargaIuran };
    });

    if (supabase) {
      await supabase.from('iuran_harian').upsert(monthEntries, { onConflict: 'warga_id,tanggal' });
    }

    addTransaksi({ 
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), 
      keterangan: `Iuran Paket: ${warga.nama}`, 
      subKeterangan: `Paket ${totalMonths} Bulan`, 
      kategori: 'masuk', 
      jumlah: totalAmount 
    });
  };

  const recordIuranCustom = async (wargaId: string, totalAmount: number, keterangan?: string) => {
    const warga = listWarga.find(w => w.id === wargaId);
    if (!warga) return;

    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    setIuranHarian(prev => {
      const newWargaIuran = { ...(prev[wargaId] || {}) };
      newWargaIuran[dateKey] = (newWargaIuran[dateKey] || 0) + totalAmount;
      return { ...prev, [wargaId]: newWargaIuran };
    });

    if (supabase) {
      await supabase.from('iuran_harian').upsert([{ warga_id: wargaId, tanggal: dateKey, jumlah: totalAmount }], { onConflict: 'warga_id,tanggal' });
    }

    addTransaksi({ 
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), 
      keterangan: `Iuran Bebas: ${warga.nama}`, 
      subKeterangan: keterangan || 'Pembayaran Custom', 
      kategori: 'masuk', 
      jumlah: totalAmount 
    });
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Menghubungkan...</p>
      </div>
    );

    return (
      <div className="h-full">
        {dbError && (
          <div className="m-5 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-2xl flex items-center gap-4">
            <span className="material-symbols-outlined text-amber-500">cloud_off</span>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-amber-500">Sync Tertunda</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{dbError}</p>
            </div>
          </div>
        )}
        
        {!supabase && !dbError && (
          <div className="m-5 p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
               <span className="material-symbols-outlined text-primary text-3xl">cloud_queue</span>
               <div>
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">Cloud Belum Aktif</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Data saat ini tersimpan di browser Anda. Hubungkan ke Supabase untuk sinkronisasi antar perangkat.</p>
               </div>
            </div>
            <button onClick={() => setActiveView(AppView.PENGATURAN)} className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl whitespace-nowrap">Setup Sekarang</button>
          </div>
        )}
        
        {(() => {
          switch (activeView) {
            case AppView.DASHBOARD: return <Dashboard listWarga={listWarga} listTransaksi={listTransaksi} iuranData={iuranHarian} nominalWajib={nominalWajib} currentUser={currentUser} instansiName={instansiName} />;
            case AppView.MASTER_DATA: return <MasterData listWarga={listWarga} onDelete={deleteWarga} onUpdate={updateWarga} />;
            case AppView.MANAJEMEN_WARGA: return <ManajemenWarga listWarga={listWarga} onAdd={addWarga} onDelete={deleteWarga} />;
            case AppView.IURAN_HARIAN: return <IuranHarian listWarga={listWarga} listTransaksi={listTransaksi} iuranData={iuranHarian} onRecordMulti={recordIuranMulti} onRecordBulk={recordIuranBulk} onRecordCustom={recordIuranCustom} nominalWajib={nominalWajib} setNominalWajib={updateNominalGlobal} />;
            case AppView.PENGELUARAN_KAS: return <PengeluaranKas listTransaksi={listTransaksi} onAddPengeluaran={addTransaksi} />;
            case AppView.LAPORAN_KEUANGAN: return <LaporanKeuangan listTransaksi={listTransaksi} onAddTransaksi={addTransaksi} instansiName={instansiName} instansiAddress={instansiAddress} instansiLogo={instansiLogo} />;
            case AppView.PENGATURAN: return (
              <Pengaturan 
                instansiName={instansiName} 
                instansiAddress={instansiAddress} 
                instansiLogo={instansiLogo} 
                onUpdateInstansiProfile={updateInstansiProfile}
                listWarga={listWarga}
                listTransaksi={listTransaksi}
                iuranData={iuranHarian}
                onImport={fetchAllData}
                onUpdateCloudConfig={updateCloudSettings}
                currentCloudConfig={cloudConfig}
                onResetAllData={resetAllData}
                listUsers={listUsers}
                onAddUser={addUser}
                onUpdateUser={updateUser}
                onDeleteUser={deleteUser}
              />
            );
            default: return <Dashboard listWarga={listWarga} listTransaksi={listTransaksi} iuranData={iuranHarian} nominalWajib={nominalWajib} currentUser={currentUser} instansiName={instansiName} instansiLogo={instansiLogo} />;
          }
        })()}
      </div>
    );
  };

  if (!isAuthenticated) return <Login onLoginSuccess={(uid) => { setCurrentUser(uid); setIsAuthenticated(true); }} listUsers={listUsers} />;

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-600 dark:text-slate-100">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
        onLogout={handleLogout} 
        currentUser={currentUser} 
        instansiName={instansiName} 
        instansiLogo={instansiLogo} 
        showBottomNav={showBottomNav}
        setShowBottomNav={setShowBottomNav}
      />
      <main className={`flex-1 overflow-y-auto custom-scrollbar lg:pb-0 ${showBottomNav ? 'pb-24' : 'pb-0'}`}>
        <div className="fixed top-5 right-5 z-50 pointer-events-none no-print">
            {supabase ? (
               <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg animate-in fade-in zoom-in">
                  <span className="size-2 bg-white rounded-full animate-pulse"></span> Cloud Connected
               </div>
            ) : null}
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
