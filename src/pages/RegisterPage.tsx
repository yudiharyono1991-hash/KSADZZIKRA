import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Mail, Phone, MapPin, CheckCircle2, HeartHandshake, LogIn, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    tipeUsaha: 'Koperasi',
    namaUsaha: '',
    namaPemilik: '',
    email: '',
    wa: '',
    alamat: '',
    isPactAgreed: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaUsaha || !form.email || !form.wa || !form.namaPemilik) {
      alert("Mohon lengkapi semua kolom wajib.");
      return;
    }
    if (!form.isPactAgreed) {
      alert("Anda harus menyetujui Pakta Integritas Syariah.");
      return;
    }
    
    setIsLoading(true);
    
    // Konfigurasi EmailJS (Ambil dari .env, atau masukkan langsung di sini jika sudah daftar)
    const serviceId = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
    const templateId = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
    const publicKey = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

    if (serviceId === 'YOUR_SERVICE_ID') {
      console.warn('EmailJS belum dikonfigurasi. Menggunakan mode simulasi.');
      setTimeout(() => {
        setIsLoading(false);
        setIsSubmitted(true);
      }, 1500);
      return;
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            tipeUsaha: form.tipeUsaha,
            namaUsaha: form.namaUsaha,
            namaPemilik: form.namaPemilik,
            email: form.email,
            wa: form.wa,
            alamat: form.alamat
          }
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorText = await response.text();
        console.error('EmailJS Error:', errorText);
        alert('Gagal mengirim email pendaftaran. Pastikan konfigurasi EmailJS sudah benar.');
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('Terjadi kesalahan jaringan saat mencoba mengirim email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      
      {/* Left Panel - Branding (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-green-950 text-white flex-col justify-between p-12">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-96 h-96 bg-green-500 rounded-full mix-blend-screen filter blur-[100px]"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500 rounded-full mix-blend-screen filter blur-[100px]"></div>
        </div>

        <div className="z-10">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-green-200 hover:text-white transition-colors mb-12"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Kembali ke Beranda</span>
          </button>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center justify-center">
              <img src="/ksa_mart_logo.png" alt="KSA Mart Logo" className="h-16 w-auto" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">KSA Mart</h1>
              <p className="text-green-400 font-bold tracking-[0.2em] uppercase text-sm">Indonesia</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-extrabold leading-tight mb-6">
            Mulai Perjalanan<br/>Bisnis Penuh Berkah.
          </h2>
          <p className="text-green-100/80 text-lg max-w-md leading-relaxed">
            Sistem Kasir Pintar Berbasis Syariah pertama yang terintegrasi dengan laporan PSAK, zakat otomatis, dan ekosistem bisnis islami.
          </p>
        </div>

        <div className="z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center shrink-0 border border-green-800/50">
              <CheckCircle2 size={20} className="text-green-400" />
            </div>
            <div>
              <h4 className="font-bold">Transaksi Sesuai Syariat</h4>
              <p className="text-sm text-green-200/70 mt-1">Sistem dirancang menghindari praktik ribawi dan gharar.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center shrink-0 border border-green-800/50">
              <CheckCircle2 size={20} className="text-green-400" />
            </div>
            <div>
              <h4 className="font-bold">Akuntansi PSAK Syariah</h4>
              <p className="text-sm text-green-200/70 mt-1">Laporan keuangan standar, langsung bisa dipakai R.A.T Koperasi.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-24 py-12 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full mx-auto"
        >
          {/* Mobile Header (Visible only on mobile) */}
          <div className="lg:hidden mb-10 flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-4">
              <img src="/ksa_mart_logo.png" alt="KSA Mart Logo" className="h-14 w-auto" />
            </div>
            <h2 className="text-2xl font-bold">Daftar Aplikasi</h2>
            <p className="text-slate-500 mt-2">KSA Mart</p>
          </div>

          {!isSubmitted ? (
            <>
              <div className="mb-10">
                <h2 className="text-3xl font-extrabold hidden lg:block mb-2">Daftar Akun Bisnis</h2>
                <p className="text-slate-500 font-medium">Isi formulir di bawah ini untuk mengajukan akses penggunaan aplikasi.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tipe Usaha Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">Kategori Usaha</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Koperasi', 'Toko Umum / Ritel'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({...form, tipeUsaha: type})}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2 ${
                          form.tipeUsaha === type 
                            ? 'border-green-500 bg-green-50/50 shadow-sm shadow-green-100' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <Store size={24} className={form.tipeUsaha === type ? 'text-green-600' : 'text-slate-400'} />
                        <span className={`font-bold ${form.tipeUsaha === type ? 'text-green-900' : 'text-slate-600'}`}>{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Nama Usaha / Koperasi <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Store size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        required
                        value={form.namaUsaha}
                        onChange={(e) => setForm({...form, namaUsaha: e.target.value})}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:outline-none transition-all font-medium text-slate-900" 
                        placeholder="Contoh: Koperasi Berkah" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Nama Pengelola / Pemilik <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        required
                        value={form.namaPemilik}
                        onChange={(e) => setForm({...form, namaPemilik: e.target.value})}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:outline-none transition-all font-medium text-slate-900" 
                        placeholder="Nama Lengkap" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Email Utama <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="email" 
                        required
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:outline-none transition-all font-medium text-slate-900" 
                        placeholder="nama@email.com" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">No. WhatsApp <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        required
                        value={form.wa}
                        onChange={(e) => setForm({...form, wa: e.target.value})}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:outline-none transition-all font-medium text-slate-900" 
                        placeholder="081234567890" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Alamat Lengkap Usaha</label>
                  <div className="relative">
                    <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                      <MapPin size={18} className="text-slate-400" />
                    </div>
                    <textarea 
                      rows={3}
                      value={form.alamat}
                      onChange={(e) => setForm({...form, alamat: e.target.value})}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:outline-none transition-all font-medium text-slate-900 resize-none" 
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota..." 
                    />
                  </div>
                </div>

                {/* Pakta Integritas */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <h4 className="font-bold flex items-center gap-2 text-amber-900 mb-3">
                    <HeartHandshake size={18} /> Pakta Integritas Syariah
                  </h4>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-1">
                      <input 
                        type="checkbox" 
                        checked={form.isPactAgreed}
                        onChange={(e) => setForm({...form, isPactAgreed: e.target.checked})}
                        className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-2 focus:ring-green-500/20 checked:bg-green-600 checked:border-green-600 transition-colors"
                      />
                      <CheckCircle2 size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-sm text-amber-800 leading-relaxed font-medium">
                      Saya menyatakan bersedia mematuhi syarat & ketentuan serta Prinsip Syariah, termasuk <strong>tidak memperjualbelikan barang haram</strong> dan menjauhi praktik ribawi secara sengaja dalam penggunaan sistem ini.
                    </span>
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Ajukan Pendaftaran Akses</>
                  )}
                </button>

                {/* Login Link Prominent */}
                <div className="pt-6 border-t border-slate-200 mt-8 text-center">
                  <p className="text-slate-600 font-medium mb-3">Sudah memiliki akun pendaftaran yang disetujui?</p>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors"
                  >
                    <LogIn size={18} /> Masuk ke Aplikasi
                  </button>
                </div>

              </form>
            </>
          ) : (
            /* Success State Screen */
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-10"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Pendaftaran Terkirim!</h2>
              <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
                Terima kasih, <strong>{form.namaPemilik}</strong>. Permohonan pendaftaran untuk <strong>{form.namaUsaha}</strong> telah kami terima dan sedang dalam proses peninjauan oleh tim kami.
              </p>
              
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-left max-w-md mx-auto mb-10">
                <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                  <Mail size={18} /> Cek Kotak Masuk Anda
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Kami akan mengirimkan notifikasi persetujuan beserta detail akses ke email <strong>{form.email}</strong> dalam waktu 1x24 jam kerja. Pastikan untuk mengecek folder Spam/Junk jika tidak menemukannya.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Kembali ke Beranda
                </button>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setForm({
                      tipeUsaha: 'Koperasi',
                      namaUsaha: '',
                      namaPemilik: '',
                      email: '',
                      wa: '',
                      alamat: '',
                      isPactAgreed: false
                    });
                  }}
                  className="px-6 py-3 bg-green-50 text-green-700 font-bold rounded-xl transition-colors hover:bg-green-100"
                >
                  Daftarkan Usaha Lain
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
