# 🎨 UI Guidelines — KSA Mart Syariah

> Panduan desain antarmuka pengguna untuk konsistensi visual dan pengalaman pengguna

---

## 1. Design Philosophy

### Prinsip Utama
- **Syariah-First** — Visual yang mencerminkan nilai Islam (emerald, gold, clean)
- **Professional** — Tampilan enterprise-grade, bukan amatir
- **Efficient** — Kasir butuh kecepatan; setiap klik harus bermakna
- **Accessible** — Dapat digunakan oleh semua level user

### Tagline Visual
> *"Emerald Syariah Theme — Premium, Clean, Islamic"*

---

## 2. Color System

### 2.1 Primary Palette

| Nama | Tailwind Class | Hex | Penggunaan |
|------|---------------|-----|------------|
| **Emerald Dark** | `bg-emerald-900` | `#064e3b` | Sidebar, header utama |
| **Emerald Medium** | `bg-emerald-800` | `#065f46` | Sidebar hover, accent |
| **Emerald Light** | `bg-emerald-600` | `#059669` | Button primary, badge |
| **Emerald Soft** | `bg-emerald-50` | `#ecfdf5` | Background highlight |

### 2.2 Accent Colors

| Nama | Tailwind Class | Penggunaan |
|------|---------------|------------|
| **Gold/Amber** | `text-amber-400/500` | Islam accent, premium highlight |
| **Rose** | `text-rose-500` | Error, danger, void |
| **Blue/Indigo** | `bg-indigo-600` | Info, secondary actions |
| **Fuchsia** | `bg-fuchsia-500` | Promo, special badges |

### 2.3 Neutral Colors

| Nama | Tailwind Class | Penggunaan |
|------|---------------|------------|
| **Slate 50** | `bg-slate-50` | Page background |
| **Slate 100** | `bg-slate-100` | Card background |
| **Gray 600** | `text-gray-600` | Secondary text |
| **Gray 800** | `text-gray-800` | Primary text |

### 2.4 Dark Mode (Login/Landing)
```
Background:  bg-slate-900 / bg-green-950
Text:        text-white / text-slate-300
Accent:      text-amber-400 / text-emerald-400
```

---

## 3. Typography

### 3.1 Font Stack
```css
font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```
Menggunakan system font untuk performa optimal tanpa download.

### 3.2 Hierarchy

| Level | Tailwind | Penggunaan |
|-------|----------|------------|
| H1 | `text-2xl font-bold` | Judul halaman |
| H2 | `text-xl font-bold` | Judul section |
| H3 | `text-lg font-semibold` | Judul subsection |
| Body | `text-sm` | Konten utama |
| Caption | `text-xs` | Label, caption, metadata |
| Mono | `font-mono text-xs` | Kode, angka invoice |

### 3.3 Konvensi Angka
- **Harga:** `Rp 78.000` — menggunakan `toLocaleString('id-ID')`
- **Persentase:** `2,5%`
- **Tanggal:** `07 Jun 2026` atau ISO format internal

---

## 4. Layout & Spacing

### 4.1 Main Layout Structure
```
┌─────────────────────────────────────────────┐
│                   TopBar                     │
│  (Live KPI, Status Supabase, Notifications) │
├────────┬────────────────────────────────────┤
│        │                                    │
│ Side-  │           Content Area             │
│ bar    │                                    │
│ (240px)│   padding: p-4 md:p-6              │
│        │   spacing: space-y-4               │
│        │                                    │
│        │                                    │
└────────┴────────────────────────────────────┘
```

### 4.2 Spacing Scale
| Size | Tailwind | Pixels | Penggunaan |
|------|----------|--------|------------|
| xs | `p-1` / `gap-1` | 4px | Minimal spacing |
| sm | `p-2` / `gap-2` | 8px | Between elements |
| md | `p-4` / `gap-4` | 16px | Section padding |
| lg | `p-6` / `gap-6` | 24px | Page padding desktop |
| xl | `p-8` / `gap-8` | 32px | Major sections |

### 4.3 Responsive Breakpoints
| Breakpoint | Min Width | Penggunaan |
|------------|-----------|------------|
| default | 0px | Mobile (stack layout) |
| `sm:` | 640px | Small tablet |
| `md:` | 768px | Tablet (sidebar muncul) |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

---

## 5. Component Patterns

### 5.1 Card / Panel
```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
  <h3 className="font-bold text-gray-800 mb-2">Title</h3>
  <p className="text-sm text-gray-600">Content</p>
</div>
```

### 5.2 Button Variants
```tsx
// Primary (Emerald)
<button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg">

// Secondary (Gray)
<button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg">

// Danger (Rose)
<button className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-lg">

// Ghost / Text
<button className="text-emerald-600 hover:text-emerald-800 font-semibold">
```

### 5.3 Input Fields
```tsx
<input
  type="text"
  placeholder="Cari produk..."
  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
             focus:ring-2 focus:ring-emerald-500 outline-none"
/>
```

### 5.4 Badge / Tag
```tsx
// Success
<span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
  Aktif
</span>

// Warning
<span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
  Pending
</span>

// Danger
<span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">
  Void
</span>
```

### 5.5 Table
```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="bg-emerald-800 text-white text-xs">
      <th className="px-3 py-2 text-left">Kolom</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b hover:bg-emerald-50">
      <td className="px-3 py-2">Data</td>
    </tr>
  </tbody>
</table>
```

---

## 6. Iconography

### 6.1 Library
Menggunakan **Lucide React** (`lucide-react`):
```tsx
import { ShoppingCart, Package, TrendingUp, Settings } from 'lucide-react';
<ShoppingCart className="w-5 h-5" />
```

### 6.2 Emoji sebagai Visual Accent
Aplikasi menggunakan emoji secara strategis untuk memberikan nuansa yang ramah:
- 🕌 — Branding Islami
- ✨ — Highlight premium
- 📊 — Dashboard/analitik
- 🧾 — Transaksi/struk
- 📦 — Inventori
- 💰 — Keuangan

---

## 7. Animation & Interaction

### 7.1 Micro-Animations
Menggunakan **Motion (Framer Motion)** untuk:
- Page transitions
- Modal appear/dismiss
- Card hover effects
- Loading spinners

### 7.2 Loading States
```tsx
// Spinner (digunakan saat initial load)
<div className="w-12 h-12 border-4 border-amber-400 border-t-transparent
               rounded-full animate-spin" />

// Skeleton (digunakan saat fetch data)
<div className="animate-pulse bg-gray-200 rounded h-4 w-32" />
```

### 7.3 Hover Effects
- Card: `hover:shadow-md transition-shadow`
- Button: `hover:bg-emerald-700 transition-colors`
- Row: `hover:bg-emerald-50`

---

## 8. Accessibility

### 8.1 Minimum Standards
- ✅ Kontras warna memenuhi WCAG 2.1 AA
- ✅ Semua input memiliki label/placeholder
- ✅ Keyboard navigable (tab order)
- ✅ Responsive untuk semua ukuran layar

### 8.2 Arabic/Islamic Text
- Teks Arab menggunakan font Unicode standard
- Directionality: LTR (aplikasi berbahasa Indonesia)
- Ayat Al-Quran ditampilkan dalam font serif besar

---

## 9. Print Styles

### 9.1 Struk Digital
- Format: Thermal printer compatible (58mm/80mm)
- Font: Monospace untuk alignment angka
- Header: Nama toko + alamat
- Footer: Pesan syariah + QR code (opsional)

### 9.2 Laporan PDF
- Menggunakan `html2pdf.js`
- A4 portrait orientation
- Header: Logo + nama koperasi
- Footer: Tanggal cetak + halaman

---

*KSA Mart Syariah — Halal. Amanah. Berkah. 🕌✨*
