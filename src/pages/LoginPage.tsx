import React, { useState, useEffect } from 'react';
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
      const selectedRoleEl = document.getElementById('register-role') as HTMLSelectElement;
      const selectedRole = selectedRoleEl ? selectedRoleEl.value as 'CASHIER' | 'ADMIN' | 'OWNER' : 'CASHIER';
      const success = registerUser({
        name: fullName,
        username,
        password,
        phone,
        role: selectedRole,
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
        setErrorMsg('⏳ Akun Anda masih menunggu persetujuan. Silakan hubungi Pengembang (WA: 082210027952 / Email: yudiharyono1991@gmail.com).');
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
      
      {/* Custom CSS for LED Running Text & Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap');
        
        @keyframes elegantSlidePause {
          0% { transform: translateX(120%); opacity: 0; filter: blur(4px); }
          15% { transform: translateX(0%); opacity: 1; filter: blur(0px); }
          85% { transform: translateX(0%); opacity: 1; filter: blur(0px); }
          100% { transform: translateX(-120%); opacity: 0; filter: blur(4px); }
        }
        .animate-elegant-slide {
          animation: elegantSlidePause 12s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          will-change: transform, opacity, filter;
        }
        
        .font-cursive-modern {
          font-family: 'Caveat', cursive;
        }
      `}</style>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Floating Back to Home Button */}
      <a href="#/" className="absolute top-4 left-4 lg:top-8 lg:left-8 z-50 flex items-center space-x-2 bg-emerald-900/40 hover:bg-emerald-800 text-white px-4 py-2 rounded-full border border-emerald-400/30 backdrop-blur-md transition-all shadow-lg">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Kembali ke Beranda</span>
      </a>

      {/* Modern Split Layout Container */}
      <div className="w-full max-w-[1536px] mx-auto min-h-screen flex items-center justify-between px-4 lg:px-12 xl:px-24 relative z-10">

      {/* Right Side Decoration (Image & Moto) */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center relative min-h-[80vh] pointer-events-none order-last">
        {/* Store Illustration with Extended Official Logo Overlay */}
        <div className="relative flex justify-center mb-4 drop-shadow-2xl opacity-95 animate-in fade-in zoom-in duration-1000 delay-300">
          <img 
            src="/ba_mart_illustration.png" 
            alt="Ilustrasi BA Mart Syariah" 
            className="w-56 lg:w-64 xl:w-72 2xl:w-[28rem] h-auto object-contain rounded-[2rem]"
          />
          {/* Overlay Official BA Logo to cover AI text AND the Arabic text below it */}
          <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#008f5d] w-[35%] h-[32%] flex flex-col items-center justify-center rounded border border-emerald-500/50 shadow-inner">
            <div className="flex items-center -space-x-0.5 drop-shadow-md">
              <span className="text-3xl lg:text-4xl xl:text-5xl font-black text-white font-sans tracking-tighter">B</span>
              <span className="text-3xl lg:text-4xl xl:text-5xl font-black text-amber-400 font-sans tracking-tighter">A</span>
            </div>
            <div className="flex flex-col items-center leading-none mt-1 lg:mt-2">
              <span className="text-[7px] lg:text-[9px] xl:text-[11px] text-emerald-100 font-black tracking-widest uppercase">Mart Syariah</span>
              <span className="text-[5px] lg:text-[7px] xl:text-[8px] text-amber-400 font-bold tracking-[0.2em] mt-[1.5px]">@INDONESIA</span>
            </div>
          </div>
        </div>

        {/* Static Moto Header (Cursive) */}
        <div className="z-20 text-center mt-4 xl:mt-8">
          <span className="font-cursive-modern font-bold text-amber-300 text-4xl lg:text-5xl drop-shadow-lg -rotate-2 inline-block opacity-100">
            Moto Usaha:
          </span>
        </div>

        {/* Cinematic Text Box Floating Banner */}
        <div className="mt-4 xl:mt-8 w-[95%] max-w-2xl z-0 flex flex-col pointer-events-none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="relative overflow-hidden w-full py-4 lg:py-6 px-4 md:px-6 lg:px-8 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-800/40 backdrop-blur-xl border border-amber-400/40 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] flex justify-center items-center">
            {/* Subtle Glowing Orb inside the box */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Text Container perfectly centered */}
            <div className="w-full z-10 flex flex-col items-center justify-center animate-elegant-slide shrink-0">
              <span className="font-cursive-modern font-bold text-base md:text-xl lg:text-2xl xl:text-3xl tracking-wide mb-1 leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-center">
                <span className="text-rose-400">"Menepis Riba,</span> <span className="text-amber-400">Demi Meraih Keberkahan Laba"</span>
              </span>
              <span className="font-cursive-modern font-bold text-emerald-50 text-xs lg:text-sm xl:text-base tracking-wider leading-relaxed text-center mt-1">
                KSA Mart Hadir Untuk Koperasi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center relative z-10 order-first px-2 lg:px-4">
        <div className="w-full max-w-[640px] relative">
          <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 w-full border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-200">
        
        {/* Brand Modern Logo Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="flex items-center justify-center z-10 drop-shadow-xl mt-2 mb-6">
            <img src="/ksa_mart_logo.png" alt="KSA Mart Logo" className="h-24 md:h-28 w-auto object-contain" />
          </div>
          
          <div className="w-full text-center">
            <h1 className="text-xs md:text-sm lg:text-base font-black text-emerald-800 tracking-tight leading-snug">
              Assalamualaikum Warahmatullahi Wabarakatuh
            </h1>
          </div>
          <p className="text-[10px] md:text-xs lg:text-sm font-bold text-amber-500 uppercase tracking-widest mt-3 mb-2">Selamat Datang di</p>
          
          <div className="w-full flex flex-col items-center text-center">
            <h2 className="relative text-2xl md:text-3xl lg:text-4xl font-extrabold text-emerald-950 tracking-tight leading-none">
              KSA Mart
              <span className="absolute bottom-0.5 md:bottom-1 left-full pl-1.5 md:pl-2 text-[8px] md:text-[10px] lg:text-xs font-black text-amber-500 uppercase tracking-[0.2em] leading-none whitespace-nowrap flex items-center">
                INDONESIA <span className="text-xl md:text-2xl ml-1 -mt-1 animate-pulse">🇮🇩</span>
              </span>
            </h2>
          </div>
          <div className="w-full mt-3 text-center">
            <p className="text-xs md:text-sm lg:text-base text-gray-500 font-medium leading-relaxed">
              Sistem POS & Akuntansi Terintegrasi untuk UMKM & Bisnis Ritel Modern
            </p>
          </div>
        </div>

        {/* Shariah Guidance Box */}
        <div className="mb-5 p-3 lg:p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start space-x-3 text-xs md:text-sm text-emerald-850">
          <Sparkles className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            Dirancang dengan akad sesuai prinsip syariah, mewujudkan perniagaan yang bersih dari Riba, Gharar, maupun Maysir.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
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
              <label className="text-xs uppercase tracking-wider font-bold text-gray-600">Nama Lengkap</label>
              <div className="flex space-x-2">
                <select
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  className="w-24 bg-slate-50 border border-gray-200 rounded-xl py-4 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-gray-800"
                >
                  <option value="Bpk">Bpk</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Sdr">Sdr</option>
                  <option value="Sdri">Sdri</option>
                </select>
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Username/Email Field */}

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider font-bold text-gray-600">
              {isRegisterMode ? 'Email' : 'Email atau No Handphone'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                {isRegisterMode ? <Mail className="w-5 h-5 text-slate-400" /> : <User className="w-5 h-5 text-slate-400" />}
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegisterMode ? "Masukkan email..." : "Masukkan email atau no hp..."}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800"
              />
            </div>
          </div>

          {isRegisterMode && (
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold text-gray-600">No Handphone</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan nomor handphone..."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800"
                />
              </div>
            </div>
          )}

          {isRegisterMode && (
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold text-gray-600">Daftar Sebagai (Uji Coba)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </span>
                <select
                  id="register-role"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800 appearance-none"
                >
                  <option value="CASHIER">Kasir (Cashier)</option>
                  <option value="ADMIN">Admin / Supervisor</option>
                  <option value="OWNER">Pemilik (Owner)</option>
                </select>
              </div>
            </div>
          )}

          {isRegisterMode && (
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold text-gray-600">Pilih Cabang (Opsional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Store className="w-5 h-5 text-slate-400" />
                </span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800 appearance-none"
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
            <label className="text-xs uppercase tracking-wider font-bold text-gray-600">Kata Sandi (Password)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-11 pr-12 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-600 transition-all text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                <div className="flex items-start gap-1.5 text-xs text-gray-500 font-medium">
                  <AlertCircle className={`w-4 h-4 ${pwdStrength <= 2 ? 'text-red-500' : pwdStrength <= 4 ? 'text-amber-500' : 'text-emerald-500'} flex-shrink-0 mt-0.5`} />
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
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm md:text-base tracking-wider py-3 rounded-xl uppercase shadow-md shadow-emerald-950/20 active:scale-98 transform transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isRegisterMode ? <><UserPlus className="w-5 h-5" /> DAFTAR AKUN</> : 'MASUK KE APLIKASI'}
          </button>
        </form>

        <div className="mt-5 text-center space-y-3">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            {isRegisterMode ? (
              <><ArrowLeft className="w-4 h-4" /> Kembali ke Login</>
            ) : (
              'Belum punya akun? Daftar sekarang'
            )}
          </button>
          
          {!isRegisterMode && (
            <p className="text-xs text-gray-500 font-medium">
              Lupa password? <a href="#" onClick={(e) => { e.preventDefault(); alert("Silakan hubungi Pengembang (WA: 082210027952 / Email: yudiharyono1991@gmail.com) untuk mereset password Anda."); }} className="text-emerald-600 hover:text-emerald-700 font-bold underline decoration-emerald-600/30 underline-offset-2">Hubungi Admin/Pengembang</a>
            </p>
          )}
        </div>

        {/* Quran Verse Footer Block inside card */}
        <div className="mt-8 border-t border-gray-100 pt-5 text-center">
          <p className="text-xs text-gray-400 italic font-medium leading-relaxed max-w-[320px] mx-auto">
            &quot;Dan tolong-menolonglah kamu dalam kebaikan dan takwa, dan jangan tolong-menolong dalam berbuat dosa dan permusuhan.&quot;
          </p>
          <p className="text-[10px] text-emerald-700 font-bold mt-2 uppercase tracking-widest">(QS. Al-Ma&apos;idah: 2)</p>
        </div>
      </div>
        {/* Corporate Development Metadata inside relative max-w-md container */}
        <div className="absolute -bottom-16 left-0 right-0 text-center text-white/70 text-xs font-mono tracking-wider space-y-1">
          <p className="font-semibold">KSA Mart — Versi 1.0 2026 IT Development</p>
          <p className="text-[10px]">Amanah Retail Accounting & ESG Ecosystem Integration</p>
        </div>
      </div>
      
      </div>
    </div>
    </div>
  );
}
