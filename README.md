
# Jimpitan RT Digital - Supabase Integrated

Aplikasi manajemen keuangan RT yang sudah terintegrasi dengan Cloud Database (Supabase).

## 🚀 Persiapan Supabase

1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Jalankan perintah SQL berikut di **SQL Editor** Supabase Anda:

```sql
-- Tabel Master Warga
CREATE TABLE warga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    no_kk TEXT NOT NULL,
    whatsapp TEXT,
    blok TEXT,
    terdaftar_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Transaksi (Buku Kas)
CREATE TABLE transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal_tampilan TEXT NOT NULL,
    keterangan TEXT NOT NULL,
    sub_keterangan TEXT,
    kategori TEXT CHECK (kategori IN ('masuk', 'keluar')),
    jumlah NUMERIC NOT NULL DEFAULT 0,
    timestamp_ms BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Iuran Harian
CREATE TABLE iuran_harian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warga_id UUID REFERENCES warga(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    jumlah NUMERIC NOT NULL DEFAULT 0,
    UNIQUE(warga_id, tanggal)
);

-- Tabel Pengaturan
CREATE TABLE pengaturan (
    kunci TEXT PRIMARY KEY,
    nilai TEXT NOT NULL
);

-- Data Awal
INSERT INTO pengaturan (kunci, nilai) VALUES ('nominal_wajib', '500');

-- Aktifkan RLS (Row Level Security)
ALTER TABLE warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE iuran_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;

-- Policy (Akses Publik - Gunakan Authenticated di Produksi)
CREATE POLICY "Public Access" ON warga FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON transaksi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON iuran_harian FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON pengaturan FOR ALL USING (true) WITH CHECK (true);
```

## 🛠 Konfigurasi Environment

Buat file `.env.local` di folder root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📦 Cara Menjalankan

1. Install dependensi:
   ```bash
   npm install
   ```
2. Jalankan mode pengembangan:
   ```bash
   npm run dev
   ```

## ✨ Fitur Terintegrasi
- **Auto-Sync**: Setiap kali Anda menambah warga atau mencatat iuran, data langsung tersimpan di Cloud.
- **Persistent Settings**: Nominal wajib iuran tersimpan di database.
- **Real-time Rehydration**: Saat aplikasi dibuka, ia akan mengambil state terbaru dari Supabase.
