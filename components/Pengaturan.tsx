
import React, { useState, useRef, useEffect } from 'react';
import { Warga, Transaksi, User, UserRole } from '../types';

interface PengaturanProps {
  instansiName: string;
  instansiAddress: string;
  instansiLogo: string;
  onUpdateInstansiProfile: (name: string, address: string, logo: string) => void;
  // Cloud & Backup Props
  listWarga: Warga[];
  listTransaksi: Transaksi[];
  iuranData: Record<string, Record<string, number>>;
  onImport: (data: any) => void;
  onUpdateCloudConfig: (url: string, key: string) => void;
  currentCloudConfig: { url: string; key: string };
  onResetAllData: () => void;
  // User Management Props
  listUsers: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (id: string, updated: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

const Pengaturan: React.FC<PengaturanProps> = ({ 
  instansiName, 
  instansiAddress, 
  instansiLogo, 
  onUpdateInstansiProfile,
  listWarga,
  listTransaksi,
  iuranData,
  onImport,
  onUpdateCloudConfig,
  currentCloudConfig,
  onResetAllData,
  listUsers,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [tempName, setTempName] = useState(instansiName);
  const [tempAddress, setTempAddress] = useState(instansiAddress);
  const [tempLogo, setTempLogo] = useState(instansiLogo);
  const [showSuccess, setShowSuccess] = useState(false);

  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<Omit<User, 'id'>>({
    nama: '',
    jabatan: '',
    userId: '',
    pass: '',
    role: UserRole.PENGURUS
  });

  // Cloud State
  const [showCloudForm, setShowCloudForm] = useState(false);
  const [cloudForm, setCloudForm] = useState({ url: '', key: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCloudForm({ url: currentCloudConfig.url || '', key: currentCloudConfig.key || '' });
  }, [currentCloudConfig]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateInstansiProfile(tempName, tempAddress, tempLogo);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSaveCloud = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCloudConfig(cloudForm.url, cloudForm.key);
    setShowCloudForm(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser.id, userForm);
    } else {
      onAddUser(userForm);
    }
    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({ nama: '', jabatan: '', userId: '', pass: '', role: UserRole.PENGURUS });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ nama: user.nama, jabatan: user.jabatan, userId: user.userId, pass: user.pass, role: user.role });
    } else {
      setEditingUser(null);
      setUserForm({ nama: '', jabatan: '', userId: '', pass: '', role: UserRole.PENGURUS });
    }
    setShowUserModal(true);
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
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      } catch (err) { alert('File tidak valid!'); }
    };
    reader.readAsText(file);
  };

  const isCloudConnected = !!(currentCloudConfig.url && currentCloudConfig.key);

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto w-full">
      {showSuccess && (
        <div className="fixed top-10 right-10 z-50 bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-black flex items-center gap-4 animate-in fade-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined">verified</span>
          Pengaturan Disimpan
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-card-dark rounded-[40px] w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-transparent">
              <h3 className="text-xl font-black dark:text-white tracking-tight uppercase">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
              <button onClick={() => setShowUserModal(false)} className="size-10 flex items-center justify-center rounded-2xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Lengkap</label>
                  <input required value={userForm.nama} onChange={e => setUserForm({...userForm, nama: e.target.value})} className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Mis: Ahmad" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Jabatan</label>
                  <input required value={userForm.jabatan} onChange={e => setUserForm({...userForm, jabatan: e.target.value})} className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Mis: Ketua RT" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">User ID</label>
                  <input required value={userForm.userId} onChange={e => setUserForm({...userForm, userId: e.target.value})} className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="Mis: admin01" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Password</label>
                  <input required type="password" value={userForm.pass} onChange={e => setUserForm({...userForm, pass: e.target.value})} className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all" placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Role / Hak Akses</label>
                <select 
                  value={userForm.role}
                  onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                  className="w-full rounded-2xl bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value={UserRole.ADMIN}>Administrator (Full Akses)</option>
                  <option value={UserRole.BENDAHARA}>Bendahara (Keuangan)</option>
                  <option value={UserRole.PENGURUS}>Pengurus (Input Data)</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-widest">Simpan Pengguna</button>
            </form>
          </div>
        </div>
      )}

      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-600 dark:text-white">Pengaturan Sistem</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base md:text-lg">Konfigurasi identitas, manajemen pengguna, cloud database, dan cadangan data.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Profil Section */}
          <section className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
              <h2 className="text-lg font-black dark:text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">business</span>
                Profil Instansi / Kelompok
              </h2>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Kelompok / RT</label>
                    <input 
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="Contoh: RT 05 / RW 12"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Alamat Lengkap</label>
                    <textarea 
                      value={tempAddress}
                      onChange={(e) => setTempAddress(e.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                      placeholder="Contoh: Jl. Merdeka No. 123, Kel. Aman, Kec. Damai"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Logo Instansi</label>
                  <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/30 dark:bg-slate-900/30">
                    {tempLogo ? (
                      <div className="relative group">
                        <img src={tempLogo} alt="Logo Preview" className="size-32 object-contain rounded-xl bg-white p-2 shadow-sm" />
                        <button 
                          type="button"
                          onClick={() => setTempLogo('')}
                          className="absolute -top-2 -right-2 size-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ) : (
                      <div className="size-32 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-4xl">image</span>
                      </div>
                    )}
                    <label className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                      Pilih Gambar
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  className="bg-primary text-white font-black px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined">save</span>
                  Simpan Profil
                </button>
              </div>
            </form>
          </section>

          {/* User Management Section */}
          <section className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent flex justify-between items-center">
              <h2 className="text-lg font-black dark:text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">group</span>
                Manajemen Pengguna
              </h2>
              <button 
                onClick={() => openUserModal()}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Tambah User
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-8 py-4">Nama / Jabatan</th>
                    <th className="px-8 py-4">User ID</th>
                    <th className="px-8 py-4">Role</th>
                    <th className="px-8 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {listUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-10 text-center text-slate-300 italic text-xs uppercase font-bold tracking-widest">Belum ada pengguna tambahan</td>
                    </tr>
                  ) : (
                    listUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-black text-slate-600 dark:text-white text-sm">{user.nama}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.jabatan}</p>
                        </td>
                        <td className="px-8 py-5">
                          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500">{user.userId}</code>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            user.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-500' : 
                            user.role === UserRole.BENDAHARA ? 'bg-emerald-100 text-emerald-500' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openUserModal(user)} className="size-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-primary/10 hover:text-primary transition-all">
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button onClick={() => onDeleteUser(user.id)} className="size-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Cloud Section */}
          <section className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent flex justify-between items-center">
              <h2 className="text-lg font-black dark:text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">cloud_sync</span>
                Sinkronisasi Cloud (Supabase)
              </h2>
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isCloudConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <span className={`size-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                {isCloudConnected ? 'Terhubung' : 'Terputus'}
              </div>
            </div>
            
            <div className="p-8">
              {showCloudForm ? (
                <form onSubmit={handleSaveCloud} className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Supabase URL</label>
                      <input 
                        required 
                        value={cloudForm.url}
                        onChange={e => setCloudForm({...cloudForm, url: e.target.value})}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        placeholder="https://xxx.supabase.co"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Anon API Key</label>
                      <input 
                        required 
                        type="password"
                        value={cloudForm.key}
                        onChange={e => setCloudForm({...cloudForm, key: e.target.value})}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-sm dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        placeholder="eyJhbG..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => setShowCloudForm(false)} className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Batal</button>
                    <button type="submit" className="bg-primary text-white font-black px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-primary/20">Hubungkan Cloud</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                    Gunakan database eksternal untuk sinkronisasi data antar perangkat secara real-time. Data Anda akan aman meskipun browser dibersihkan.
                  </p>
                  <button 
                    onClick={() => setShowCloudForm(true)}
                    className="px-8 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-sm">settings</span>
                    {isCloudConnected ? 'Ubah Koneksi' : 'Setup Cloud'}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Backup Section */}
          <section className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
              <h2 className="text-lg font-black dark:text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">database</span>
                Pencadangan Lokal (Manual)
              </h2>
            </div>
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                    Simpan salinan data Anda ke dalam file fisik di komputer Anda. Sangat disarankan dilakukan secara berkala.
                  </p>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Peringatan: Impor data akan menimpa data saat ini!</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={exportData} className="px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm">download</span>
                    Ekspor
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Impor
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
               </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-rose-50/30 dark:bg-rose-950/10 rounded-[32px] border border-rose-100 dark:border-rose-900/30 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-transparent">
              <h2 className="text-lg font-black text-rose-500 flex items-center gap-3">
                <span className="material-symbols-outlined">warning</span>
                Zona Berbahaya
              </h2>
            </div>
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="space-y-1">
                  <p className="text-sm font-black text-slate-700 dark:text-white">Hapus Seluruh Data</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                    Tindakan ini akan menghapus permanen semua data Warga, Transaksi, dan Iuran baik di Lokal maupun di Cloud.
                  </p>
               </div>
               <button 
                onClick={onResetAllData}
                className="px-8 py-4 rounded-2xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3"
               >
                 <span className="material-symbols-outlined text-sm">delete_forever</span>
                 Reset Semua Data
               </button>
            </div>
          </section>
        </div>

        <div className="space-y-8">
           <div className="bg-primary/10 rounded-3xl p-8 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-4xl mb-4">info</span>
              <h3 className="text-lg font-black text-primary mb-2">Tentang Pengaturan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Halaman ini adalah pusat kendali aplikasi Anda. Semua perubahan di sini akan berdampak langsung pada tampilan Dashboard, KOP Laporan, dan metode penyimpanan data Anda.
              </p>
           </div>
           
           <div className="bg-slate-50 dark:bg-slate-800/30 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Statistik Data</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-500">Total Warga</p>
                    <p className="text-sm font-black dark:text-white">{listWarga.length}</p>
                 </div>
                 <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-500">Total Transaksi</p>
                    <p className="text-sm font-black dark:text-white">{listTransaksi.length}</p>
                 </div>
                 <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-500">Total Pengguna</p>
                    <p className="text-sm font-black dark:text-white">{listUsers.length}</p>
                 </div>
                 <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] text-slate-400 font-medium italic">Versi Aplikasi: 2.5.0</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Pengaturan;
