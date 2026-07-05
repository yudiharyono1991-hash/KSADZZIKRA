# 📐 Business Rules — KSA Mart Syariah

> Aturan bisnis dan logika domain yang diterapkan dalam sistem KSA Mart Syariah

---

## 1. Aturan Transaksi POS

### 1.1 Metode Pembayaran
| Metode | Kode | Keterangan |
|--------|------|------------|
| Tunai | `CASH` | Pembayaran cash, hitung kembalian |
| QRIS Syariah | `QRIS_SHARIAH` | Scan QR, nominal exact (no change) |
| Transfer BSI | `TRANSFER_BSI` | Transfer Bank Syariah Indonesia |
| Kasbon | `KASBON` | Hutang pelanggan (tanpa bunga/riba) |

### 1.2 Flow Checkout
```
1. Kasir scan/tambah produk ke cart
2. Sistem hitung subtotal + margin + zakat contribution
3. Terapkan promo/diskon (jika ada)
4. Hitung pajak PPN (jika diaktifkan, default: OFF)
5. Pilih metode pembayaran
6. Generate invoice number (INV-YYYYMMDD-XXX)
7. Catat transaksi + kurangi stok
8. Auto-generate jurnal akuntansi
9. Cetak/print struk digital
```

### 1.3 Kalkulasi Keuangan per Transaksi
```
Margin Berkah     = Σ(item.price - item.costPrice) × item.quantity
Zakat Kontribusi  = Margin Berkah × 2.5%  (jika zakatRate diaktifkan)
Total Amount      = Σ(item.price × item.quantity) - discount + tax
Change Amount     = amountPaid - totalAmount  (hanya untuk CASH)
```

### 1.4 Invoice Number Format
```
INV-YYYYMMDD-XXX
Contoh: INV-20260607-001
```
- Auto-increment per hari
- Reset counter setiap hari baru

---

## 2. Aturan Inventori

### 2.1 Produk
- Setiap produk **WAJIB** memiliki: SKU, nama, kategori, harga jual, harga modal, stok, unit
- Field `isHalal` wajib diisi (default: true)
- Produk dapat dijual dalam satuan (Pcs) dan/atau box (`hasBoxUnit`)
- Harga box dihitung terpisah dari harga satuan

### 2.2 Multi-Unit (Pcs/Box)
```
Box Configuration:
- pcsPerBox:    Jumlah pcs per box
- boxPrice:     Harga jual per box
- boxCostPrice: Modal per box
- boxBarcode:   Barcode khusus box (opsional)
```

### 2.3 Stok Minimum Alert
- Ketika `stock <= minStock`, produk ditandai sebagai **stok kritis**
- Notifikasi otomatis dikirim ke Admin/Owner

### 2.4 Stock Movement Types
| Tipe | Kode | Efek Stok |
|------|------|-----------|
| Masuk | `IN` | +qty |
| Keluar | `OUT` | -qty |
| Adjustment | `ADJUST` | ±qty |

### 2.5 Expiry Date
- Produk dengan tanggal kadaluarsa mendekati di-highlight
- Tracking di halaman InventoryPage

---

## 3. Aturan Keuangan Syariah

### 3.1 Zakat Niaga (Zakat Mal Perdagangan)
```
Nisab = 85 gram emas × harga emas per gram
Aset Bersih = Liquid Assets + Inventory Value + Receivables - Liabilities
Wajib Zakat = Aset Bersih ≥ Nisab
Zakat Due = Aset Bersih × 2.5%
```

### 3.2 Distribusi Zakat — 8 Asnaf
1. Fakir (orang yang tidak punya harta)
2. Miskin (orang yang kekurangan)
3. Amil (pengelola zakat)
4. Muallaf (yang baru masuk Islam)
5. Riqab (membebaskan budak)
6. Gharimin (orang yang berhutang)
7. Fisabilillah (pejuang di jalan Allah)
8. Ibnu Sabil (musafir yang kehabisan bekal)

### 3.3 ESG Categories
| Kategori | Contoh Distribusi |
|----------|-------------------|
| ENVIRONMENTAL | Reboisasi, penghijauan |
| SOCIAL | Santunan yatim, bantuan dhuafa |
| GOVERNANCE | Pendidikan, pelatihan |

### 3.4 Jurnal Otomatis
Setiap transaksi POS otomatis membuat jurnal:

**Transaksi Cash:**
```
Debit:  1-1000 Kas Tunai          Rp XXX
Credit: 4-1000 Pendapatan         Rp XXX
Debit:  5-1000 HPP                Rp XXX
Credit: 1-1040 Persediaan         Rp XXX
```

**Transaksi QRIS:**
```
Debit:  1-1020 QRIS Syariah       Rp XXX
Credit: 4-1000 Pendapatan         Rp XXX
```

### 3.5 Penutupan Buku (Closing)
| Tipe | Frekuensi | Data |
|------|-----------|------|
| DAILY | Setiap hari | Revenue, expenses, net profit hari itu |
| MONTHLY | Akhir bulan | Akumulasi bulanan + zakat contribution |

---

## 4. Aturan Pelanggan & Loyalitas

### 4.1 Membership
- Pelanggan mendaftar via portal `/member`
- Mendapat akses: riwayat order, poin, diskon member
- Login dengan username + password

### 4.2 Poin Loyalitas
```
Poin earned = floor(totalAmount / 10000)  // 1 poin per Rp 10.000
Redemption: 1 poin = Rp 100 diskon
Maximum redeem: 50% dari total transaksi
```

### 4.3 Order Online
```
1. Pelanggan pilih produk di katalog/portal
2. Cek jarak GPS (maxDeliveryRadiusKm, default: 5 km)
3. Submit order → Status: PENDING
4. Admin proses → PROCESSED → READY → COMPLETED
5. Chat real-time antara admin dan pelanggan
```

### 4.4 Kasbon (Hutang Pelanggan)
- Kasbon = pembayaran ditunda tanpa tambahan biaya (tanpa riba)
- Dicatat di `debtAmount` pada data Customer
- Jurnal: Debit Piutang Kasbon, Credit Pendapatan

---

## 5. Aturan SDM & Operasional

### 5.1 Shift Kasir
```
1. Kasir Clock-In → Catat modal awal kas (cash opname)
2. Selama shift: jalankan transaksi
3. Kasir Clock-Out → Catat kas akhir, rekap shift
4. Selisih = Kas Akhir - (Modal Awal + Total Penjualan Cash)
```

### 5.2 Absensi
- Clock-in/out **WAJIB** dengan foto (selfie)
- GPS location dicatat otomatis
- Koreksi absen memerlukan approval Manager/Owner

### 5.3 Void Transaksi
```
1. Kasir request void → Status: PENDING
2. Manager/Owner review → APPROVED atau REJECTED
3. Jika APPROVED:
   - Stok produk dikembalikan (+qty)
   - Jurnal akuntansi di-reverse
   - Transaksi ditandai isVoided: true
```

---

## 6. Aturan Multi-Tenant & Multi-Cabang

### 6.1 Tenant
- Setiap tenant = 1 organisasi/koperasi
- Data dipisahkan per `tenantId`
- Tenant baru harus di-approve SUPERADMIN

### 6.2 Cabang (Branch)
- Setiap cabang = 1 lokasi fisik toko
- Data difilter per `branchId`
- Admin pusat melihat semua cabang (filter global)

### 6.3 Data Isolation
```
Filter data = where tenantId === currentUser.tenantId
                AND (branchId === activeBranchId OR activeBranchId === '')
```

---

## 7. Aturan Promo & Diskon

### 7.1 Tipe Promo
| Tipe | Contoh | Kalkulasi |
|------|--------|-----------|
| PERCENTAGE | Diskon 10% | totalAmount × (value/100) |
| FIXED | Potongan Rp 5000 | totalAmount - value |

### 7.2 Syarat
- Minimum purchase harus dipenuhi (`minPurchase`)
- Hanya promo `isActive: true` yang berlaku
- Promo dapat di-assign per cabang (`branchId`)

---

## 8. Aturan Pajak

### 8.1 PPN (Pajak Pertambahan Nilai)
- **Default: OFF** (koperasi kecil sering dikecualikan PPN)
- Jika diaktifkan: `taxRate` default 11%
- Kalkulasi: `taxAmount = subtotal × (taxRate/100)`
- Dapat diaktifkan/nonaktifkan di SettingsPage

---

*KSA Mart Syariah — Halal. Amanah. Berkah. 🕌✨*
