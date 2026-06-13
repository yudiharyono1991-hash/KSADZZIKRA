# 03. Protokol Kepatuhan Syariah & Standar ESG 2026

Implementasi kepatuhan hukum syar'i (*shariah compliance*) dalam sistem akuntansi BA Mart dirangkum dalam tiga rukun pilar utama:

### 1. Akad Jual Beli Murabahah (Kost-plus Pricing)
Perdagangan sembako dalam hukum syariah mengharamkan manipulasi harga sepihak (*ikhtikar*) yang mencekik konsumen, serta bias kesepakatan (*gharar*). BA Mart menerapkan skema **Akad Murabahah**:

*   **Transparansi Harga Modal**: Harga Beli (*cost price*) dari distributor dicatat dan dihitung secara akurat dalam laporan pembukuan usaha.
*   **Keuntungan (Margin) yang Disepakati**: Selisih harga jual dan harga beli merupakan laba keuntungan (*ribhun*) yang rill dan transparan.
*   **Penguncian Harga di Kasir (Fixed Integrity)**: Kasir (*CASHIER role*) sama sekali tidak memiliki kemampuan mengubah harga barang di tengah jalan dalam transaksi POS. Hal ini memastikan rukun akad jual-beli sah sejak awal berdasarkan ijab-qobul harga tertayang, mencegah spekulasi kotor kasir yang melanggar amanat ummat.

### 2. Standar Zakat Maal Perniagaan DSN-MUI
BA Mart mematuhi panduan hukum **Fatwa DSN MUI No. 122/DSN-MUI/VIII/2018** tentang tata cara zakat perniagaan.

*   **Pemicu Haul & Nisab**: Nisab perdagangan ditetapkan ekuivalen dengah harga **85 gram emas murni**.
*   **Rumus Harta Bersih Terzakat (Net Trade Assets Method)**:
    $$\text{Harta Perniagaan Netto} = (\text{Kas Usaha & Bank} + \text{Persediaan Sembako Harga Pokok} + \text{Piutang Usaha}) - \text{Hutang Usaha Jatuh Tempo}$$
*   **Syarat Wajib**: Bila Harta Perniagaan Netto $\ge$ Nisab Emas saat masuk jatuh tempo haul (kalkulasi harian/tahunan), usaha wajib menunaikan Zakat Perniagaan sebesar **2.5%** dari total harta bersih netto tersebut.
*   **Zakat Kontribusi Penjualan**: Sistem POS secara harian menyisihkan 2.5% dari keuntungan transaksi kasir rill sebagai alokasi cadangan zakat operasional.

### 3. Integrasi Framework ESG Komprehensif (Versi 1.0 2026)
Sebagai pelopor UMKM Ramah Sosial Lingkungan era 2026, BA Mart mengintegrasikan prinsip Environmental, Social, and Governance (ESG) langsung ke fitur pelaporan penyaluran Zakat:

```
                            ┌───────────────────────────────────┐
                            │    PENYALURAN ZAKAT & ESG 2026    │
                            └─────────────────┬─────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
         [ ENVIRONMENTAL (E) ]              [ SOCIAL (S) ]            [ GOVERNANCE (G) ]
         Mengurangi sampah plastik         Menyalurkan sembako       Memastikan transaksi
         melalui rami bag ramah            gratis kepada dhuafa      halal bebas riba &
         lingkungan di sekeliling          sekitar kampus Tazkia.    diaudit syariah rutin.
         kampus Tazkia.
```

*   **Environmental (E) - Ecological Stewardship**: Penyaluran dana zakat mendukung program rami-bag/kemasan kertas bebas-plastik untuk pembagian sembako gratis, memajukan inisiatif zero-waste retail.
*   **Social (S) - Social Upliftment**: Distribusi bahan pokok pangan (sembako) bersubsidi atau gratis secara merata khusus kepada Asnaf Fakir, Miskin, dan Dhuafa di lingkaran kampus ekonomi Tazkia Indonesia.
*   **Governance (G) - Sound Governance**: Transparansi buku besar yang mutlak, bebas riba, audit jejak langkah kasir (*audit trail*) yang terperinci di menu log aplikasi, serta penghitungan margin keuntungan yang adil beretika syariah.
