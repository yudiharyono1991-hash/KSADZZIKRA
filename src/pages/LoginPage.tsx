import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Store, User, Lock, AlertCircle, Sparkles, Eye, EyeOff, UserPlus, ArrowLeft, Phone, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login, registerUser, branches } = useAppStore();
  
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [salutation, setSalutation] = useState('Bpk');
  const [username, setUsername] = useState(''); // No pre-fill
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); // No pre-fill
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const pwdStrength = getPasswordStrength(password);
  let strengthLabel = '';
  let strengthColor = '';
  let strengthText = '';
  if (password.length > 0) {
    if (pwdStrength <= 2) {
      strengthLabel = 'Lemah';
      strengthColor = 'bg-red-500';
      strengthText = 'Gunakan kombinasi huruf besar, kecil, angka & simbol (Min. 8 karakter)';
    } else if (pwdStrength === 3 || pwdStrength === 4) {
      strengthLabel = 'Sedang';
      strengthColor = 'bg-amber-500';
      strengthText = 'Tambahkan kombinasi simbol atau angka untuk lebih aman';
    } else {
      strengthLabel = 'Kuat';
      strengthColor = 'bg-emerald-500';
      strengthText = 'Kata sandi Anda sudah sangat kuat';
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!username || !password || (isRegisterMode && (!name || !phone))) {
      setErrorMsg('Harap lengkapi semua kolom.');
      return;
    }

    if (isRegisterMode) {
      const fullName = `${salutation} ${name}`;
      const success = registerUser({
        name: fullName,
        username,
        password,
        phone,
        role: 'CASHIER', // Default, Admin/Owner yang approve
        branchId: selectedBranchId || undefined
      });
      if (success) {
        setSuccessMsg('✅ Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin/Owner. Harap sabar.');
        setIsRegisterMode(false);
        setPassword('');
        setName('');
      } else {
        setErrorMsg('Username sudah digunakan. Silakan pilih username lain.');
      }
    } else {
      const result = login(username, password);
      if (result === 'SUCCESS') {
        // Login berhasil, store akan update currentUser dan App.tsx akan re-render
        // Reset hash route berdasarkan role agar tidak tersangkut di halaman user sebelumnya
        const currentUser = useAppStore.getState().currentUser;
        if (currentUser) {
          if (currentUser.role === 'OWNER') {
            window.location.hash = '#/trend';
          } else if (currentUser.role === 'ADMIN') {
            window.location.hash = '#/laporan-penjualan';
          } else {
            window.location.hash = '#/kasir';
          }
        } else {
          window.location.hash = '#/';
        }
      } else if (result === 'PENDING') {
        setErrorMsg('⏳ Akun Anda masih menunggu persetujuan Admin/Owner. Silakan hubungi pengelola toko.');
      } else {
        setErrorMsg('Username atau kata sandi tidak valid. Harap periksa kembali.');
      }
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setErrorMsg('');
    setSuccessMsg('');
    setName('');
    setUsername('');
    setPassword('');
    setPhone('');
  };

  return (
    <div id="login-container" className="min-h-screen bg-emerald-600 flex flex-col justify-center items-center p-4 relative overflow-hidden bg-linear-to-b from-emerald-500 via-emerald-600 to-emerald-800">
      
      {/* Decorative Shariah Geometric Circles */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Login/Register Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-200">
        
        {/* Brand Circular Logo Header */}
        <div className="flex flex-col items-center text-center space-y-1 mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-800 border-4 border-amber-400 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
            <Store className="w-8 h-8 text-amber-300" />
          </div>
          
          <h1 className="text-lg md:text-xl font-black text-emerald-800 tracking-tight mt-2 leading-relaxed">
            Assalamualaikum Warahmatullahi Wabarakatuh
          </h1>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Selamat Datang di</p>
          <h2 className="text-xl font-extrabold text-emerald-950 tracking-wide">Berkah Amanah Mart</h2>
          <p className="text-[10px] text-gray-500 max-w-xs font-medium leading-relaxed">
            Sistem POS & Akuntansi Terintegrasi untuk UMKM Toko Sembako
          </p>
        </div>

        {/* Shariah Guidance Box */}
        <div className="mb-6 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start space-x-2 text-[10px] text-emerald-850">
          <Sparkles className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
          <p className="leading-snug">
            Dirancang dengan akad sesuai prinsip syariah, mewujudkan perniagaan yang bersih dari Riba, Gharar, maupun Maysir.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Error & Success Banners */}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {isRegisterMode && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Nama Lengkap</label>
              <div className="flex space-x-2">
                <select
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  className="w-24 bg-slate-50 border border-gray-200 rounded-xl py-3 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-gray-800"
                >
                  <option value="Bpk">Bpk</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Sdr">Sdr</option>
                  <option value="Sdri">Sdri</option>
                </select>
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Username/Email Field */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
              {isRegisterMode ? 'Email' : 'Email atau No Handphone'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                {isRegisterMode ? <Mail className="w-4 h-4 text-slate-400" /> : <User className="w-4 h-4 text-slate-400" />}
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegisterMode ? "Masukkan email..." : "Masukkan email atau no hp..."}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800"
              />
            </div>
          </div>

          {isRegisterMode && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">No Handphone</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan nomor handphone..."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800"
                />
              </div>
            </div>
          )}

          {isRegisterMode && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Pilih Cabang (Opsional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Store className="w-4 h-4 text-slate-400" />
                </span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800 appearance-none"
                >
                  <option value="">-- Pusat / Global --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Kata Sandi (Password)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-10 pr-12 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isRegisterMode && password.length > 0 && (
              <div className="pt-1.5 space-y-1.5">
                <div className="flex gap-1 h-1 w-full rounded-full overflow-hidden bg-gray-100">
                  <div className={`h-full ${pwdStrength >= 1 ? strengthColor : 'bg-transparent'} transition-all duration-300`} style={{ width: '20%' }}></div>
                  <div className={`h-full ${pwdStrength >= 2 ? strengthColor : 'bg-transparent'} transition-all duration-300`} style={{ width: '20%' }}></div>
                  <div className={`h-full ${pwdStrength >= 3 ? strengthColor : 'bg-transparent'} transition-all duration-300`} style={{ width: '20%' }}></div>
                  <div className={`h-full ${pwdStrength >= 4 ? strengthColor : 'bg-transparent'} transition-all duration-300`} style={{ width: '20%' }}></div>
                  <div className={`h-full ${pwdStrength >= 5 ? strengthColor : 'bg-transparent'} transition-all duration-300`} style={{ width: '20%' }}></div>
                </div>
                <div className="flex items-start gap-1.5 text-[9px] text-gray-500 font-medium">
                  <AlertCircle className={`w-3 h-3 ${pwdStrength <= 2 ? 'text-red-500' : pwdStrength <= 4 ? 'text-amber-500' : 'text-emerald-500'} flex-shrink-0 mt-0.5`} />
                  <span className="leading-tight">
                    Kekuatan: <span className={`font-bold uppercase tracking-wider mr-1 ${pwdStrength <= 2 ? 'text-red-600' : pwdStrength <= 4 ? 'text-amber-600' : 'text-emerald-600'}`}>{strengthLabel}</span> 
                    - {strengthText}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs tracking-wider py-3.5 rounded-xl uppercase shadow-md shadow-emerald-950/20 active:scale-98 transform transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isRegisterMode ? <><UserPlus className="w-4 h-4" /> DAFTAR AKUN</> : 'MASUK KE APLIKASI'}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button
            type="button"
            onClick={toggleMode}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            {isRegisterMode ? (
              <><ArrowLeft className="w-3 h-3" /> Kembali ke Login</>
            ) : (
              'Belum punya akun? Daftar sekarang'
            )}
          </button>
          
          {!isRegisterMode && (
            <p className="text-[10px] text-gray-500 font-medium">
              Lupa password? <a href="#" onClick={(e) => { e.preventDefault(); alert("Silakan hubungi Admin atau Owner untuk mereset password Anda."); }} className="text-emerald-600 hover:text-emerald-700 font-bold underline decoration-emerald-600/30 underline-offset-2">Hubungi Admin</a>
            </p>
          )}
        </div>

        {/* Quran Verse Footer Block inside card */}
        <div className="mt-6 border-t border-gray-100 pt-5 text-center">
          <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed max-w-[280px] mx-auto">
            &quot;Dan tolong-menolonglah kamu dalam kebaikan dan takwa, dan jangan tolong-menolong dalam berbuat dosa dan permusuhan.&quot;
          </p>
          <p className="text-[9px] text-emerald-700 font-bold mt-1.5 uppercase tracking-widest">(QS. Al-Ma&apos;idah: 2)</p>
        </div>
      </div>

      {/* Corporate Development Metadata outside card */}
      <div className="text-center mt-6 text-white/70 text-[10px] font-mono tracking-wider space-y-1 pb-4 relative z-10">
        <p className="font-semibold">BA SmartPOS Shariah — Versi 1.0 2026 IT Development</p>
        <p>Amanah Retail Accounting & ESG Ecosystem Integration</p>
      </div>
    </div>
  );
}
