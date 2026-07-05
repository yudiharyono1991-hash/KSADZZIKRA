# 🌐 Panduan Deploy KSA Mart Syariah ke Netlify

## 📌 Langkah 1: Push ke GitHub

```bash
git add -A
git commit -m "update: KSA Mart Syariah terbaru"
git push origin main
```

---

## ☁️ Langkah 2: Deploy ke Netlify (Auto dari GitHub)

1. Masuk ke [Netlify](https://www.netlify.com/)
2. Klik **"Add New Site"** → **"Import from Git"**
3. Pilih **GitHub** → cari repo **`KSADZZIKRA`**
4. Isi pengaturan build:
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Publish directory:** `dist`
5. Klik **"Environment Variables"** → tambahkan:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://stiatomaelzrptazayml.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aWF0b21hZWx6cnB0YXpheW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NjUyMjQsImV4cCI6MjA5ODQ0MTIyNH0.9vkvEYp1BFcIdkt1YSx87K6zlVkZUrmd1xLPpHmILn0` |

6. Klik **"Deploy Site"** — tunggu ±2 menit, selesai! 🚀

---

## ⚡ Langkah 3: Deploy Manual via Drag & Drop

1. Jalankan: `npm run build`
2. Buka [Netlify Drop](https://app.netlify.com/drop)
3. Drag folder **`dist`** ke area upload
4. Setelah aktif, tambahkan Environment Variables di atas agar Supabase aktif

---

## 🛠️ Update Kode Setelah Deploy

Setiap perubahan kode, cukup jalankan:
```bash
git add -A
git commit -m "update: keterangan perubahan"
git push origin main
```
Netlify akan otomatis redeploy dalam ±1-2 menit!

---

*KSA Mart Syariah — KSADZZIKRA | Supabase: stiatomaelzrptazayml*
