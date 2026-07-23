-- ============================================================
-- KSA MART - SQL MIGRATION UPDATE
-- Versi: 2.0 (Update Fitur Baru)
-- Tanggal: 2026-07-19
-- ============================================================
-- CARA PENGGUNAAN:
--   1. Login ke Supabase Dashboard (supabase.com)
--   2. Pilih project KSA Mart / KSADZZIKRA
--   3. Pergi ke menu SQL Editor
--   4. Copy-paste seluruh isi file ini
--   5. Klik Run / Ctrl+Enter
-- ============================================================


-- ============================================================
-- BAGIAN 1: UPDATE TABEL `attendance`
-- Menambah kolom untuk fitur Koreksi / Pengajuan Absensi
-- ============================================================

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS correction_status   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS correction_reason   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS correction_type     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS requested_clock_in  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS requested_clock_out TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS leave_type          TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by         TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at         TIMESTAMPTZ DEFAULT NULL;

-- Index untuk mempercepat query pengajuan yang pending
CREATE INDEX IF NOT EXISTS idx_attendance_correction_status
  ON public.attendance(tenant_id, correction_status);

-- Index untuk query absensi per karyawan
CREATE INDEX IF NOT EXISTS idx_attendance_user_date
  ON public.attendance(tenant_id, user_id, date);


-- ============================================================
-- BAGIAN 2: UPDATE TABEL `ksa_users`
-- Memastikan kolom debt_amount dan employee_id tersedia
-- ============================================================

ALTER TABLE public.ksa_users
  ADD COLUMN IF NOT EXISTS debt_amount   NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employee_id   TEXT DEFAULT NULL;

-- Index untuk ksa_users per tenant
CREATE INDEX IF NOT EXISTS idx_ksa_users_tenant
  ON public.ksa_users(tenant_id, is_active);


-- ============================================================
-- BAGIAN 3: UPDATE TABEL `store_settings`
-- Menambah kolom operational_hours untuk Shift Mingguan
-- (shifts & shiftAssignments disimpan sebagai JSONB)
-- ============================================================

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS operational_hours  JSONB DEFAULT NULL;


-- ============================================================
-- BAGIAN 4: VERIFIKASI (opsional, jalankan setelah migration)
-- ============================================================

-- Cek kolom attendance:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'attendance'
ORDER BY ordinal_position;

-- Cek kolom ksa_users:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ksa_users'
ORDER BY ordinal_position;


-- ============================================================
-- SELESAI! Semua kolom baru sudah siap.
-- ============================================================
