export interface Santri {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  asrama: string;
  no_hp_wali: string | null;
  status_aktif: boolean;
  created_at: string;
}

export interface Paket {
  id: string;
  kode_paket: string;
  santri_id: string;
  pengirim: string;
  ekspedisi: string;
  nomor_resi: string | null;
  foto_paket: string | null;
  catatan: string | null;
  tanggal_masuk: string;
  tanggal_diambil: string | null;
  status: string;
  petugas_menerima: string;
  petugas_mengambil: string | null;
  created_at: string;
  santri?: Santri;
}

export interface Petugas {
  id: string;
  nama: string;
  nomor_hp: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tabel: string;
  aksi: string;
  data_lama: Record<string, unknown> | null;
  data_baru: Record<string, unknown> | null;
  petugas: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_hari_ini: number;
  belum_diambil: number;
  sudah_diambil: number;
  total_bulan_ini: number;
}

export interface PaketHarian {
  tanggal: string;
  total: number;
  diambil: number;
  belum_diambil: number;
}

export interface PaketBulanan {
  bulan: string;
  total: number;
  diambil: number;
  belum_diambil: number;
}

export interface PaketTerlama {
  id: string;
  kode_paket: string;
  nama_santri: string;
  kelas: string;
  asrama: string;
  ekspedisi: string;
  tanggal_masuk: string;
  hari_tertunda: number;
}
