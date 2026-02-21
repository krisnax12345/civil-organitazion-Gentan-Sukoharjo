
export enum AppView {
  DASHBOARD = 'dashboard',
  MASTER_DATA = 'master_data',
  MANAJEMEN_WARGA = 'manajemen_warga',
  IURAN_HARIAN = 'iuran_harian',
  PENGELUARAN_KAS = 'pengeluaran_kas',
  LAPORAN_KEUANGAN = 'laporan_keuangan',
  PENGATURAN = 'pengaturan'
}

export enum UserRole {
  ADMIN = 'admin',
  BENDAHARA = 'bendahara',
  PENGURUS = 'pengurus'
}

export interface User {
  id: string;
  nama: string;
  jabatan: string;
  userId: string;
  pass: string;
  role: UserRole;
}

export interface Warga {
  id: string;
  nama: string;
  noKK: string;
  whatsapp: string;
  blok: string;
  terdaftarAt: string;
}

export interface Transaksi {
  id: string;
  tanggal: string;
  keterangan: string;
  subKeterangan: string;
  kategori: 'masuk' | 'keluar';
  jumlah: number;
  timestamp: number; // Menambahkan timestamp untuk sorting akurat (termasuk jam/menit)
}
