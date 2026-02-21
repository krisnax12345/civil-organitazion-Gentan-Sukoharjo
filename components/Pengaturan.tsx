
import React, { useState } from 'react';

interface PengaturanProps {
  instansiName: string;
  instansiAddress: string;
  instansiLogo: string;
  onUpdateInstansiProfile: (name: string, address: string, logo: string) => void;
}

const Pengaturan: React.FC<PengaturanProps> = ({ instansiName, instansiAddress, instansiLogo, onUpdateInstansiProfile }) => {
  const [tempName, setTempName] = useState(instansiName);
  const [tempAddress, setTempAddress] = useState(instansiAddress);
  const [tempLogo, setTempLogo] = useState(instansiLogo);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateInstansiProfile(tempName, tempAddress, tempLogo);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto w-full">
      {showSuccess && (
        <div className="fixed top-10 right-10 z-50 bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-black flex items-center gap-4 animate-in fade-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined">verified</span>
          Pengaturan Disimpan
        </div>
      )}

      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-600 dark:text-white">Pengaturan Sistem</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base md:text-lg">Konfigurasi identitas dan preferensi aplikasi.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
              <h2 className="text-lg font-black dark:text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">business</span>
                Profil Instansi / Kelompok
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
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
                    <p className="text-[9px] text-slate-400 text-center">Format: PNG, JPG (Maks 1MB)<br/>Logo akan tampil di Dashboard & KOP Laporan</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  className="bg-primary text-white font-black px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined">save</span>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white dark:bg-card-dark rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden opacity-50 grayscale pointer-events-none">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
              <h2 className="text-lg font-black dark:text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">lock</span>
                Keamanan & Akses
              </h2>
            </div>
            <div className="p-8">
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Fitur ini akan segera hadir</p>
            </div>
          </section>
        </div>

        <div className="space-y-8">
           <div className="bg-primary/10 rounded-3xl p-8 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-4xl mb-4">info</span>
              <h3 className="text-lg font-black text-primary mb-2">Tentang Profil</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Nama instansi atau kelompok yang Anda masukkan di sini akan muncul di bagian atas Dashboard dan pada kop laporan saat dicetak. Pastikan menggunakan nama yang resmi untuk keperluan administrasi.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Pengaturan;
