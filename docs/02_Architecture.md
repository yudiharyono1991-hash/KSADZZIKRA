# 🏗️ Arsitektur Sistem — KSA Mart Syariah

> Dokumen teknis arsitektur aplikasi KSA Mart Syariah (KSADZZIKRA)

---

## 1. Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser/PWA)                  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  React   │  │  Zustand  │  │  React   │  │ Vite   │ │
│  │  Router  │  │  Store    │  │  Pages   │  │ PWA    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │             │             │             │       │
│       └─────────────┴─────────────┴─────────────┘       │
│                         │                               │
│              ┌──────────┴──────────┐                    │
│              │   localStorage      │                    │
│              │   (Offline Cache)   │                    │
│              └──────────┬──────────┘                    │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   SUPABASE CLOUD                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │PostgreSQL│  │   Auth   │  │   RLS    │             │
│  │   DB     │  │ (future) │  │ Policies │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Teknologi | Versi | Fungsi |
|-------|-----------|-------|--------|
| **Framework** | React | 19.x | UI Component Library |
| **Language** | TypeScript | 5.8.x | Type-safe JavaScript |
| **Bundler** | Vite | 6.x | Build tool & dev server |
| **Styling** | TailwindCSS | 4.x | Utility-first CSS |
| **State** | Zustand | 5.x | Global state management |
| **Routing** | React Router | 7.x | Client-side routing (HashRouter) |
| **Charts** | Recharts | 3.x | Data visualization |
| **Icons** | Lucide React | 0.5x | SVG icon library |
| **Animation** | Motion (Framer) | 12.x | UI animations |
| **Database** | Supabase | 2.x | PostgreSQL cloud DB |
| **AI** | Google GenAI | 2.x | Gemini AI integration |
| **PWA** | vite-plugin-pwa | 1.x | Service worker & manifest |
| **Export** | SheetJS (xlsx) | 0.18 | Excel export |
| **PDF** | html2pdf.js | 0.14 | PDF generation |
| **Utils** | date-fns | 4.x | Date manipulation |
| **Merge** | clsx + tailwind-merge | — | Conditional classnames |

---

## 3. Arsitektur Komponen

### 3.1 Layer Diagram

```
┌─────────────────────────────────────────────┐
│                 PAGES LAYER                  │
│  (40 halaman: KasirPOS, Inventory, dll.)    │
├─────────────────────────────────────────────┤
│              COMPONENTS LAYER                │
│  (Layout: Sidebar, TopBar, MainLayout)      │
│  (Shared: ErrorBoundary, JadwalShalat)      │
├─────────────────────────────────────────────┤
│               HOOKS LAYER                    │
│  (useBranchData)                            │
├─────────────────────────────────────────────┤
│          STATE MANAGEMENT LAYER              │
│  (Zustand Store: store/index.ts)            │
│  (94KB+ single store with all logic)        │
├─────────────────────────────────────────────┤
│             SERVICE LAYER                    │
│  (lib/supabase.ts: Supabase CRUD)           │
├─────────────────────────────────────────────┤
│              TYPES LAYER                     │
│  (types/index.ts: TypeScript interfaces)    │
├─────────────────────────────────────────────┤
│             UTILS LAYER                      │
│  (utils/distance.ts: GPS helpers)           │
└─────────────────────────────────────────────┘
```

### 3.2 Routing Architecture

Aplikasi menggunakan `HashRouter` dengan 2 kategori route:

**Public Routes** (tanpa login):
- `/` — Landing Page
- `/login` — Login
- `/register` — Registrasi Tenant
- `/katalog` — Katalog Umum
- `/member` — Portal Pelanggan
- `/quran`, `/jadwal-shalat`, `/artikel-islami` — Konten Islami

**Protected Routes** (wajib login, wrapped `MainLayout`):
- `/kasir` — POS Kasir
- `/inventory` — Manajemen Stok
- `/trend` — Analitik & Tren
- `/jurnal-umum`, `/coa`, `/arus-kas`, `/neraca-rugi` — Akuntansi
- `/zakat` — Kalkulasi Zakat
- `/settings` — Pengaturan Sistem
- Dan 20+ route lainnya

### 3.3 State Management (Zustand)

Seluruh state aplikasi dikelola dalam **single Zustand store** (`src/store/index.ts`):

```typescript
// State utama
tenants, products, cart, customerCart, transactions,
onlineOrders, chatMessages, auditLogs, zakatRecords,
zakatDistributions, currentUser, expenses, closings,
users, purchaseOrders, journalEntries, branches,
customers, suppliers, promos, attendances, settings,
stockMovements, notifications, coaList

// Actions: 60+ methods
checkout(), addProduct(), adjustStock(), login(), logout(),
addZakatRecord(), addJournalEntry(), forceSyncAllToCloud()...
```

**Persistensi:**
- **localStorage** — Cache lokal dengan prefix `ksa_` (contoh: `ksa_products`, `ksa_transactions`)
- **Supabase** — Sinkronisasi cloud via `supabaseService`
- **Hybrid mode** — Offline-first, sync saat koneksi tersedia

---

## 4. Data Architecture

### 4.1 Database Schema (Supabase PostgreSQL)

| Tabel | Fungsi | RLS |
|-------|--------|-----|
| `products` | Katalog produk & stok | ✅ |
| `transactions` | Riwayat transaksi POS | ✅ |
| `journal_entries` | Jurnal akuntansi | ✅ |
| `expenses` | Pencatatan beban operasional | ✅ |
| `customers` | Data pelanggan & member | ✅ |
| `suppliers` | Data supplier | ✅ |
| `online_orders` | Pesanan online | ✅ |
| `purchase_orders` | Pemesanan ke supplier | ✅ |
| `zakat_records` | Kalkulasi zakat niaga | ✅ |
| `zakat_distributions` | Distribusi zakat ESG | ✅ |
| `audit_logs` | Log aktivitas sistem | ✅ |
| `attendance` | Absensi karyawan | ✅ |
| `ksa_users` | Akun pengguna | ✅ |
| `ksa_branches` | Cabang/toko | ✅ |
| `coa_accounts` | Chart of Accounts | ✅ |
| `store_settings` | Konfigurasi toko | ✅ |
| `stock_movements` | Pergerakan stok | ✅ |

### 4.2 localStorage Keys

Semua key menggunakan prefix `ksa_`:
```
ksa_products, ksa_transactions, ksa_users, ksa_branches,
ksa_settings, ksa_current_user, ksa_tenants, ksa_coa_list,
ksa_journal_entries, ksa_expenses, ksa_closings,
ksa_audit_logs, ksa_zakat_records, ksa_zakat_distributions,
ksa_customers, ksa_suppliers, ksa_promos, ksa_attendances,
ksa_stock_movements, ksa_online_orders, ksa_chat_messages,
ksa_purchase_orders, ksa_notifications,
ksa_neraca_receivables, ksa_neraca_payables, ksa_neraca_equity,
ksa_neraca_auto_balanced
```

---

## 5. Deployment Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Developer  │────▶│   GitHub     │────▶│   Netlify    │
│   (VS Code)  │push │  Repository  │ CI  │  CDN/Edge    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                           ┌──────▼───────┐
                                           │   Browser    │
                                           │   (PWA)      │
                                           └──────┬───────┘
                                                  │
                                           ┌──────▼───────┐
                                           │  Supabase    │
                                           │  Cloud DB    │
                                           └──────────────┘
```

- **Hosting:** Netlify (SPA + redirects)
- **Database:** Supabase Cloud (PostgreSQL)
- **CDN:** Netlify Edge Network
- **SSL:** Auto-provisioned by Netlify
- **CI/CD:** GitHub → Netlify auto-deploy on push

---

## 6. Security Architecture

Lihat [06_Security.md](06_Security.md) untuk detail lengkap.

**Ringkasan:**
- Row Level Security (RLS) pada semua tabel Supabase
- Role-Based Access Control (RBAC) dengan 9 role
- Protected Routes di client-side
- Maintenance Mode untuk lockdown darurat
- Audit trail lengkap di setiap aksi

---

*KSA Mart Syariah — Halal. Amanah. Berkah. 🕌✨*
