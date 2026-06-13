# 04. AI Integration Specifications (Gemini API)

Meskipun sistem operasional inti ditenagai penuh oleh state management Zustand dan database Supabase guna menjamin integritas pembukuan rupiah yang presisi, platform ini dirancang dengan arsitektur ramah AI untuk peningkatan fitur cerdas masa depan.

### 1. Kemampuan Inteligensia Masa Depan (Rencana AI Roadmap)
Sistem dipersiapkan untuk integrasi dengan `@google/genai` (SDK modern Google AI Studio) di sisi server (`server.ts`):

*   **Rekomendasi Restocking Sembako Cepat (Predictive Analytics)**: Gemini model akan membaca riwayat stocklevel dari SKU produk yang menipis (low-stock) serta tren kecepatan jual mingguan demi memberikan rekomendasi kuantiti pemesanan barang dari pedagang besar (*Wholesale vendor Ordering*).
*   **Optimalisasi Margin Syariah**: Memindai fluktuasi harga beli pasar sembako nasional dan memberi saran harga jual baru yang adil bagi ummat namun tetap menjaga profitabilitas kemitraan BA Mart.

### 2. Penempatan Kunci Rahasia API (API Key Security)
Sesuai arahan protokol platform AI Studio:
*   Semua pemanggilan API Gemini dilakukan di sisi server (`server.ts`) demi mencegah kebocoran Google API Key (`GEMINI_API_KEY`) ke browser klien.
*   Variabel lingkungan dideklarasikan di `.env.example` dan diinjeksikan secara aman oleh sistem manajemen rahasia platform AI Studio.
*   Tidak ada elemen input antarmuka (UI) dalam aplikasi client-side yang meminta API Key secara langsung kepada pengguna.
