/*
# Migration: Create Santri, Paket, and Petugas Tables

1. New Tables
- santri: id, nis, nama, kelas, asrama, no_hp_wali, status_aktif, created_at
- petugas: id, nama, nomor_hp, created_at
- paket: id, kode_paket, santri_id, pengirim, ekspedisi, nomor_resi, foto_paket, catatan, tanggal_masuk, tanggal_diambil, status, petugas_menerima, petugas_mengambil, created_at
- audit_log: id, tabel, aksi, data_lama, data_baru, petugas, created_at

2. Security
- RLS enabled on all tables
- Public access policies for anon and authenticated users (single-tenant app)

3. Indexes
- Indexes on frequently queried columns
*/

CREATE TABLE IF NOT EXISTS santri (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nis text UNIQUE NOT NULL,
    nama text NOT NULL,
    kelas text NOT NULL,
    asrama text NOT NULL,
    no_hp_wali text,
    status_aktif boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS petugas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama text NOT NULL,
    nomor_hp text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paket (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_paket text UNIQUE NOT NULL,
    santri_id uuid NOT NULL REFERENCES santri(id) ON DELETE RESTRICT,
    pengirim text NOT NULL,
    ekspedisi text NOT NULL,
    nomor_resi text,
    foto_paket text,
    catatan text,
    tanggal_masuk timestamptz NOT NULL DEFAULT now(),
    tanggal_diambil timestamptz,
    status text NOT NULL DEFAULT 'Menunggu Diambil',
    petugas_menerima text NOT NULL,
    petugas_mengambil text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tabel text NOT NULL,
    aksi text NOT NULL,
    data_lama jsonb,
    data_baru jsonb,
    petugas text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_santri_nis ON santri(nis);
CREATE INDEX IF NOT EXISTS idx_santri_kelas ON santri(kelas);
CREATE INDEX IF NOT EXISTS idx_santri_asrama ON santri(asrama);
CREATE INDEX IF NOT EXISTS idx_paket_kode ON paket(kode_paket);
CREATE INDEX IF NOT EXISTS idx_paket_status ON paket(status);
CREATE INDEX IF NOT EXISTS idx_paket_santri_id ON paket(santri_id);
CREATE INDEX IF NOT EXISTS idx_paket_tanggal_masuk ON paket(tanggal_masuk);
CREATE INDEX IF NOT EXISTS idx_paket_ekspedisi ON paket(ekspedisi);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabel ON audit_log(tabel);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE paket ENABLE ROW LEVEL SECURITY;
ALTER TABLE petugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_santri" ON santri;
CREATE POLICY "anon_select_santri" ON santri FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_santri" ON santri;
CREATE POLICY "anon_insert_santri" ON santri FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_santri" ON santri;
CREATE POLICY "anon_update_santri" ON santri FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_santri" ON santri;
CREATE POLICY "anon_delete_santri" ON santri FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_paket" ON paket;
CREATE POLICY "anon_select_paket" ON paket FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_paket" ON paket;
CREATE POLICY "anon_insert_paket" ON paket FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_paket" ON paket;
CREATE POLICY "anon_update_paket" ON paket FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_paket" ON paket;
CREATE POLICY "anon_delete_paket" ON paket FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_petugas" ON petugas;
CREATE POLICY "anon_select_petugas" ON petugas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_petugas" ON petugas;
CREATE POLICY "anon_insert_petugas" ON petugas FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_petugas" ON petugas;
CREATE POLICY "anon_update_petugas" ON petugas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_petugas" ON petugas;
CREATE POLICY "anon_delete_petugas" ON petugas FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_audit_log" ON audit_log;
CREATE POLICY "anon_select_audit_log" ON audit_log FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audit_log" ON audit_log;
CREATE POLICY "anon_insert_audit_log" ON audit_log FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO petugas (nama, nomor_hp) VALUES ('Petugas Utama', '081234567890') ON CONFLICT DO NOTHING;
