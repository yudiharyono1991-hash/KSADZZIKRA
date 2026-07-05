# 🤖 AI Specification — KSA Mart Syariah

> Spesifikasi integrasi Artificial Intelligence menggunakan Google Gemini API

---

## 1. Overview

KSA Mart Syariah mengintegrasikan **Google Gemini AI** melalui `@google/genai` SDK untuk meningkatkan pengalaman pengguna dan efisiensi operasional toko.

### Dependency
```json
"@google/genai": "^2.4.0"
```

### Kapabilitas
```json
"majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
```

---

## 2. Use Cases AI

### 2.1 Asisten Konten Islami
- **Fungsi:** Menyediakan konten edukasi fikih muamalah, artikel bisnis syariah
- **Model:** Gemini Pro
- **Output:** Teks markdown untuk halaman ArtikelIslamiPage

### 2.2 Smart Product Descriptions (Planned)
- **Fungsi:** Generate deskripsi produk halal otomatis
- **Input:** Nama produk, kategori, spesifikasi
- **Output:** Deskripsi menarik dengan highlight kehalalan

### 2.3 Demand Forecasting (Roadmap Phase 3)
- **Fungsi:** Prediksi permintaan produk berdasarkan data penjualan historis
- **Input:** Riwayat transaksi, tren musiman
- **Output:** Rekomendasi stok optimal

### 2.4 Customer Insights (Roadmap Phase 3)
- **Fungsi:** Analisis perilaku pelanggan untuk personalisasi promo
- **Input:** Data transaksi pelanggan, preferensi
- **Output:** Segmentasi pelanggan, rekomendasi promo

---

## 3. Arsitektur AI

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│  Vite Proxy  │────▶│  Google AI   │
│   (React)    │     │  (Server)    │     │  Gemini API  │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 3.1 Keamanan API Key
- API key disimpan di server-side environment variables
- Client **tidak pernah** mengakses API key secara langsung
- Proxy layer memfilter dan memvalidasi request

### 3.2 Rate Limiting
- Dibatasi per user session
- Cooldown antar request untuk mencegah abuse
- Fallback ke konten statis jika API tidak tersedia

---

## 4. Panduan Implementasi

### 4.1 Setup Environment
```env
# Di server-side environment (BUKAN VITE_ prefix)
GEMINI_API_KEY=your-api-key-here
```

### 4.2 Penggunaan SDK
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-pro',
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
});
```

### 4.3 Content Safety
- Semua output AI difilter untuk konten yang tidak sesuai syariah
- Prompt engineering memastikan output ramah Muslim
- Fallback ke konten yang telah di-review secara manual

---

## 5. Batasan & Kebijakan

### 5.1 Yang Dilakukan AI
- ✅ Generate konten edukasi Islami
- ✅ Bantu format laporan keuangan
- ✅ Analisis tren penjualan
- ✅ Suggest produk berdasarkan kategori

### 5.2 Yang TIDAK Dilakukan AI
- ❌ **Tidak** mengeluarkan fatwa hukum Islam
- ❌ **Tidak** mengubah data transaksi secara otomatis
- ❌ **Tidak** mengakses data sensitif pelanggan
- ❌ **Tidak** menggantikan keputusan bisnis Owner/Pengurus

### 5.3 Disclaimer
> AI di KSA Mart adalah alat bantu. Untuk masalah hukum syariah, selalu rujuk ke ulama, Dewan Pengawas Syariah (DPS), atau fatwa DSN-MUI yang berlaku.

---

## 6. Monitoring & Metrics

| Metrik | Target |
|--------|--------|
| Response time | < 3 detik |
| Availability | 99.9% (Google SLA) |
| Error rate | < 1% |
| Content accuracy | Reviewed by DPS |

---

*KSA Mart Syariah — Halal. Amanah. Berkah. 🕌✨*
