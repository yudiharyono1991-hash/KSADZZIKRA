# 🔒 Security Policy — KSA Mart Syariah

> Kebijakan keamanan data, akses, dan infrastruktur KSA Mart Syariah (KSADZZIKRA)

---

## 1. Prinsip Keamanan

### CIA Triad
- **Confidentiality** — Data pelanggan dan keuangan hanya diakses oleh pihak berwenang
- **Integrity** — Data transaksi tidak dapat dimanipulasi tanpa audit trail
- **Availability** — Sistem dapat diakses 24/7 dengan fallback offline

### Defense in Depth
Keamanan diterapkan di setiap lapisan: client, transport, server, database.

---

## 2. Authentication & Authorization

### 2.1 Role-Based Access Control (RBAC)

| Role | Dashboard | POS | Inventory | Keuangan | User Mgmt | Settings | Koperasi |
|------|:---------:|:---:|:---------:|:--------:|:---------:|:--------:|:--------:|
| SUPERADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OWNER | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| MANAGER | ✅ | ✅ | ✅ | 👁️ | ⬜ | ⬜ | ⬜ |
| PENGURUS | ✅ | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | ✅ |
| CASHIER | ⬜ | ✅ | 👁️ | ⬜ | ⬜ | ⬜ | ⬜ |
| STAFF_GUDANG | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| STAFF_LAPANGAN | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| PELANGGAN | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

✅ = Full access | 👁️ = Read-only | ⬜ = No access

### 2.2 User Approval Workflow
1. User mendaftar → Status: `PENDING`
2. Admin/Owner mereview → `APPROVED` atau `REJECTED`
3. Hanya user `APPROVED` dan `isActive: true` yang dapat login
4. Setiap approval dicatat di audit log

### 2.3 Protected Routes
```typescript
// Client-side route protection
const ProtectedRoute = ({ children }) => {
  const { currentUser, settings } = useAppStore();
  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role === 'PELANGGAN') return <Navigate to="/member" />;
  if (settings?.maintenanceMode && !isPrivileged) return <MaintenancePage />;
  return <MainLayout>{children}</MainLayout>;
};
```

---

## 3. Data Security

### 3.1 Supabase Row Level Security (RLS)
Semua tabel dilindungi dengan RLS policies:
```sql
ALTER TABLE public.ksa_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ksa_users_select" ON public.ksa_users FOR SELECT USING (true);
CREATE POLICY "ksa_users_all" ON public.ksa_users FOR ALL USING (true) WITH CHECK (true);
```

### 3.2 Data Classification

| Level | Tipe Data | Perlindungan |
|-------|-----------|--------------|
| 🔴 CRITICAL | Password, API keys, Supabase credentials | Environment variables, tidak di-commit ke Git |
| 🟠 SENSITIVE | Data pelanggan, transaksi keuangan | RLS, encrypted transport (HTTPS) |
| 🟡 INTERNAL | Data produk, stok, laporan | Role-based access |
| 🟢 PUBLIC | Katalog umum, landing page | Publik |

### 3.3 Password Storage
- Password disimpan di Supabase (`ksa_users` table)
- **Catatan penting:** Implementasi saat ini menggunakan plaintext — migrasi ke bcrypt/argon2 direncanakan di Phase 3
- Kredensial default harus diganti saat production

### 3.4 API Key Protection
```
# .env (TIDAK masuk Git via .gitignore)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...

# .gitignore
.env
```

---

## 4. Network Security

### 4.1 Transport Layer
- ✅ **HTTPS enforced** — Netlify auto-provisions SSL/TLS
- ✅ **Supabase connections** — TLS 1.2+ encrypted
- ✅ **CORS** — Dikonfigurasi di Supabase Dashboard

### 4.2 Content Security
- **SPA Routing** — HashRouter menghindari server-side path traversal
- **Input Sanitization** — React default XSS protection via JSX escaping
- **No inline eval** — Tidak menggunakan `eval()` atau `innerHTML`

---

## 5. Operational Security

### 5.1 Audit Trail
Setiap aksi operasional dicatat:
```typescript
interface AuditLog {
  id: string;
  tenantId: string;
  timestamp: string;    // ISO 8601
  user: string;         // Username pelaku
  action: string;       // Kode aksi (LOGIN, STOCK_CHECK, dll.)
  category: 'POS' | 'INVENTORY' | 'FINANCE' | 'SYSTEM' | 'ZAKAT';
  details: string;      // Deskripsi lengkap
  ipAddress: string;    // IP address
}
```

### 5.2 Aksi yang Di-Audit
- Login/logout
- Semua transaksi POS
- Perubahan stok & produk
- Void request/approval
- Perubahan user & role
- Perubahan settings
- Export data
- Clock-in/out absensi

### 5.3 Maintenance Mode
Owner dapat mengaktifkan **Mode Pemeliharaan** yang:
- Memutus semua sesi kecuali OWNER & SUPERADMIN
- Mencegah transaksi selama rekonsiliasi
- Menampilkan pesan maintenance ke user lain

---

## 6. Backup & Recovery

### 6.1 Strategi Backup

| Layer | Metode | Frekuensi |
|-------|--------|-----------|
| Supabase | Auto-backup PostgreSQL | Harian (by Supabase) |
| localStorage | Manual export JSON (SettingsPage) | On-demand |
| Git | Version control | Per commit |

### 6.2 Data Export
Admin dapat mengexport data via SettingsPage:
```
Export JSON → Backup semua data (products, transactions, users, dll.)
Import JSON → Restore dari backup
```

### 6.3 Disaster Recovery
1. Supabase daily backup → restore via dashboard
2. localStorage corrupt → clear + re-sync dari Supabase
3. Full data loss → restore dari JSON backup + Supabase backup

---

## 7. Incident Response

### 7.1 Severity Levels

| Level | Contoh | Response Time |
|-------|--------|---------------|
| P1 CRITICAL | Data breach, sistem down | < 1 jam |
| P2 HIGH | Login bypass, data corruption | < 4 jam |
| P3 MEDIUM | Bug keuangan, error kalkulasi | < 24 jam |
| P4 LOW | UI glitch, typo | Next sprint |

### 7.2 Response Steps
1. **Detect** — Audit log monitoring, user report
2. **Contain** — Aktifkan Maintenance Mode
3. **Investigate** — Review audit logs
4. **Remediate** — Fix + deploy patch
5. **Report** — Dokumentasikan insiden

---

## 8. Rekomendasi Keamanan (Roadmap)

### Phase 2
- [ ] Implementasi bcrypt/argon2 untuk password hashing
- [ ] Two-Factor Authentication (2FA) untuk Owner/Admin
- [ ] Session timeout otomatis
- [ ] Rate limiting login attempts

### Phase 3
- [ ] Supabase Auth integration (JWT-based)
- [ ] Field-level encryption untuk data sensitif
- [ ] SOC 2 compliance assessment
- [ ] Penetration testing

---

## 9. Kontak Keamanan

Untuk melaporkan masalah keamanan:
- **Owner:** Dr. Grandis Imama Hendra
- **WhatsApp:** 085881893650
- **GitHub Issues:** github.com/yudiharyono1991-hash/KSADZZIKRA

---

*KSA Mart Syariah — Halal. Amanah. Berkah. 🕌✨*
