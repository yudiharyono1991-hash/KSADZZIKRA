# 🛠️ Developer Guide — KSA Mart Syariah

> Panduan lengkap untuk developer yang berkontribusi pada proyek KSA Mart Syariah (KSADZZIKRA)

---

## 1. Prerequisites

| Tool | Versi Minimum | Catatan |
|------|--------------|---------|
| Node.js | 18.x LTS | Disarankan v20+ |
| NPM | 9.x | Termasuk dalam Node.js |
| VS Code | Latest | Dengan ekstensi yang direkomendasikan |
| Git | 2.x | Untuk version control |

### VS Code Extensions (Disarankan)
- TypeScript + JavaScript IntelliSense
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Prettier - Code Formatter
- ESLint

---

## 2. Setup Development

```bash
# Clone repository
git clone https://github.com/yudiharyono1991-hash/KSADZZIKRA.git
cd KSAMart

# Install dependencies
npm install

# Setup environment (copy dan edit)
cp .env.example .env

# Jalankan dev server
npm run dev
# → http://localhost:3000
```

---

## 3. Struktur Kode

### 3.1 Konvensi Penamaan

| Tipe | Konvensi | Contoh |
|------|----------|--------|
| File komponen | PascalCase | `KasirPOS.tsx`, `InventoryPage.tsx` |
| File utilitas | camelCase | `distance.ts`, `supabase.ts` |
| File index | lowercase | `index.ts`, `index.css` |
| Interface/Type | PascalCase | `Product`, `Transaction`, `UserRole` |
| Function | camelCase | `addProduct()`, `checkout()` |
| CSS class | kebab-case via Tailwind | `bg-emerald-800 text-white` |
| localStorage key | snake_case + prefix | `ksa_products`, `ksa_users` |
| Supabase table | snake_case + prefix | `ksa_users`, `ksa_branches` |

### 3.2 Arsitektur File

```
src/
├── App.tsx              # Router utama + ProtectedRoute wrapper
├── main.tsx             # ReactDOM entry point
├── index.css            # TailwindCSS global styles
│
├── components/          # Reusable UI components
│   ├── Layout/
│   │   ├── MainLayout.tsx   # Wrapper: Sidebar + TopBar + content
│   │   ├── Sidebar.tsx      # Menu navigasi (18KB)
│   │   ├── TopBar.tsx       # Header bar + KPI widget (22KB)
│   │   └── index.ts         # Re-export
│   ├── ErrorBoundary.tsx    # React error boundary
│   ├── JadwalShalatWidget.tsx
│   └── MiniJadwalShalat.tsx
│
├── pages/               # 40 page components (masing-masing self-contained)
│   ├── KasirPOS.tsx     # 64KB - Halaman kasir utama
│   ├── InventoryPage.tsx # 50KB - Manajemen stok
│   ├── CustomerPortal.tsx # 50KB - Portal pelanggan
│   └── ...
│
├── store/
│   └── index.ts         # 95KB - Zustand store (ALL state + actions)
│
├── lib/
│   └── supabase.ts      # 24KB - Supabase service layer
│
├── types/
│   └── index.ts         # 10KB - Semua TypeScript interfaces
│
├── hooks/
│   └── useBranchData.ts # Custom hook filter data per cabang
│
└── utils/
    └── distance.ts      # Haversine formula GPS distance
```

---

## 4. Patterns & Conventions

### 4.1 State Management (Zustand)

**Menambah state baru:**
```typescript
// 1. Definisikan type di types/index.ts
export interface NewFeature {
  id: string;
  tenantId: string;
  // ...fields
}

// 2. Tambahkan ke AppState interface di store/index.ts
interface AppState {
  newFeatures: NewFeature[];
  addNewFeature: (data: Omit<NewFeature, 'id'>) => void;
}

// 3. Implementasikan di store
newFeatures: getStorage('ksa_new_features', undefined) || [],

addNewFeature: (data) => {
  const newItem = { ...data, id: `nf_${Date.now()}` };
  const updated = [...get().newFeatures, newItem];
  set({ newFeatures: updated });
  saveStorage('ksa_new_features', updated, get().currentUser?.tenantId);
  get().addLog('NEW_FEATURE_ADD', 'SYSTEM', `Added: ${newItem.id}`);
},
```

### 4.2 Supabase Service Pattern

```typescript
// Di lib/supabase.ts
async getNewFeatures(): Promise<any[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('new_features')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err: any) {
    logSync(`Failed to fetch: ${err.message}`, true);
    return null;
  }
},
```

### 4.3 Page Component Pattern

```typescript
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';

export default function NewFeaturePage() {
  const { newFeatures, addNewFeature, currentUser } = useAppStore();
  const [search, setSearch] = useState('');

  // Filter berdasarkan tenant dan cabang aktif
  const filtered = useMemo(() =>
    newFeatures.filter(f =>
      f.tenantId === currentUser?.tenantId &&
      f.name.toLowerCase().includes(search.toLowerCase())
    ),
    [newFeatures, currentUser, search]
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-emerald-800">
        New Feature
      </h1>
      {/* ... content ... */}
    </div>
  );
}
```

### 4.4 localStorage Key Convention

**WAJIB** menggunakan prefix `ksa_`:
```typescript
// ✅ Benar
localStorage.getItem('ksa_products');
saveStorage('ksa_transactions', data);

// ❌ Salah — JANGAN gunakan prefix lama atau tanpa prefix
localStorage.getItem('ba_products');  // ← DILARANG
localStorage.getItem('products');     // ← DILARANG
```

---

## 5. Workflow Pengembangan

### 5.1 Menambah Halaman Baru

1. Buat file di `src/pages/NewPage.tsx`
2. Export di `src/pages/index.ts`:
   ```typescript
   export { default as NewPage } from './NewPage';
   ```
3. Tambahkan route di `src/App.tsx`:
   ```tsx
   <Route path="/new-page" element={<ProtectedRoute><NewPage /></ProtectedRoute>} />
   ```
4. Tambahkan menu di `src/components/Layout/Sidebar.tsx`

### 5.2 Menambah Tabel Supabase Baru

1. Tambahkan DDL di `supabase_schema.sql`
2. Buat service methods di `src/lib/supabase.ts`
3. Tambahkan state + actions di `src/store/index.ts`
4. Jalankan SQL di Supabase Dashboard SQL Editor
5. Test sinkronisasi

---

## 6. Scripts NPM

```bash
npm run dev       # Dev server (port 3000, hot reload)
npm run build     # Production build (dist/)
npm run preview   # Preview production build
npm run clean     # Hapus dist & server.js
npm run lint      # TypeScript type checking
```

---

## 7. Environment Variables

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `VITE_SUPABASE_URL` | ✅ | URL Supabase project |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Anon key Supabase |
| `VITE_APP_PREFIX` | ⬜ | Prefix localStorage (default: `ksa_`) |
| `VITE_DB_PREFIX` | ⬜ | Prefix tabel database (default: `ksa_`) |
| `DISABLE_HMR` | ⬜ | Nonaktifkan hot reload (untuk CI/agent) |

---

## 8. Testing

### 8.1 Manual Testing Checklist
- [ ] Login dengan semua role (SUPERADMIN, OWNER, ADMIN, CASHIER, PELANGGAN)
- [ ] Buat transaksi kasir (Cash, QRIS, BSI)
- [ ] Tambah/edit/hapus produk
- [ ] Cek jurnal otomatis setelah transaksi
- [ ] Void transaksi (request + approval)
- [ ] Export Excel dan PDF
- [ ] Portal pelanggan: order + tracking
- [ ] Supabase sync (push + pull)

### 8.2 Build Verification
```bash
npm run build  # Harus sukses tanpa error
npm run lint   # Harus tanpa TypeScript error
```

---

## 9. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Port 3000 sudah digunakan | Kill proses atau gunakan `--port=3001` |
| Supabase error | Cek `.env`, pastikan URL dan key benar |
| localStorage penuh | Bersihkan data lama via browser DevTools |
| Build gagal | Cek `npm run lint` untuk TypeScript errors |
| PWA tidak update | Clear browser cache + unregister service worker |

---

*KSA Mart Syariah — Halal. Amanah. Berkah. 🕌✨*
