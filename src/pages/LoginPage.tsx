import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Store, User, Lock, AlertCircle, Sparkles, Eye, EyeOff, UserPlus, ArrowLeft, Phone, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login, registerUser, branches } = useAppStore();

  const verses = [
    {
      text: "...Mereka berkata bahwa jual beli itu sama dengan riba. Padahal Allah telah menghalalkan jual beli dan mengharamkan riba. Barangsiapa mendapat peringatan dari Tuhannya, lalu dia berhenti, maka apa yang telah diperolehnya dahulu menjadi miliknya...",
      ref: "QS. Al-Baqarah: 275"
    },
    {
      text: "Wahai orang-orang yang beriman, janganlah kamu saling memakan harta sesamamu dengan jalan yang batil, kecuali dengan jalan perniagaan yang berlaku dengan suka sama-suka di antara kamu.",
      ref: "QS. An-Nisa: 29"
    },
    {
      text: "Wahai orang-orang yang beriman, apabila kamu bermu'amalah (bertransaksi) tidak secara tunai untuk waktu yang ditentukan, hendaklah kamu menuliskannya. Dan hendaklah seorang pencatat di antara kamu menuliskannya dengan benar...",
      ref: "QS. Al-Baqarah: 282"
    }
  ];

  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVerseIndex((prev) => (prev + 1) % verses.length);
    }, 12000); // 12 detik rotasi
    return () => clearInterval(interval);
  }, []);
  
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
  const [registerRole, setRegisterRole] = useState<'CASHIER' | 'ADMIN' | 'OWNER' | 'PELANGGAN' | 'SUPERADMIN'>('PELANGGAN');
  const [isKoperasiMember, setIsKoperasiMember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const showDemoAccess = true;

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
      strengthColor = 'bg-green-500';
      strengthText = 'Kata sandi Anda sudah sangat kuat';
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!username || !password || (isRegisterMode && (!name || !phone))) {
      setErrorMsg('Pendaftaran gagal: Harap lengkapi semua kolom wajib (Nama, Email/No HP, dan Kata Sandi).');
      return;
    }

    if (isRegisterMode) {
      const fullName = `${salutation} ${name}`;
      const success = registerUser({
        name: fullName,
        username,
        password,
        phone,
        role: registerRole,
        branchId: selectedBranchId || undefined,
        tenantId: 'default',
        isKoperasiMember: registerRole === 'PELANGGAN' ? isKoperasiMember : false
      });
      if (success) {
        if (registerRole === 'PELANGGAN') {
          setSuccessMsg('✅ Pendaftaran berhasil! Akun Anda aktif. Silakan masuk (Login).');
        } else {
          setSuccessMsg('✅ Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin/Owner. Harap sabar.');
        }
        setIsRegisterMode(false);
        setPassword('');
        setName('');
      } else {
        setErrorMsg('Pendaftaran gagal: Email atau No. Handphone tersebut sudah terdaftar di sistem. Silakan gunakan yang lain.');
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
          } else if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN') {
            window.location.hash = '#/laporan-penjualan';
          } else if (currentUser.role === 'PELANGGAN') {
            window.location.hash = '#/member';
          } else {
            window.location.hash = '#/kasir';
          }
        } else {
          window.location.hash = '#/';
        }
      } else if (result === 'PENDING') {
        setErrorMsg('⏳ Akun Anda masih menunggu persetujuan. Silakan hubungi Pengembang (WA: 082210027952 / Email: yudiharyono1991@gmail.com).');
      } else {
        setErrorMsg('Login gagal: Email/No Handphone atau kata sandi tidak cocok. Harap periksa kembali.');
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
    <div id="login-container" className="h-[100dvh] w-full bg-green-600 flex flex-col justify-center items-center p-2 md:p-4 relative overflow-hidden bg-linear-to-b from-green-500 via-green-600 to-green-800">
      
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
        @keyframes marqueeStore {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-store {
          display: flex;
          animation: marqueeStore 30s linear infinite;
          white-space: nowrap;
          width: max-content;
        }
      `}</style>
      {/* Top Running Text / News Ticker */}
      <div className="absolute top-0 w-full bg-green-950 text-green-50 py-1.5 z-[100] overflow-hidden shadow-md border-b border-green-500/30">
        <div className="animate-marquee-store text-[10px] md:text-xs font-bold tracking-wider">
          {/* Double the content so it seamlessly loops */}
          <span className="mx-8">✨ Koperasi Konsumen Syariah Adz Zikra. Dari KITA, oleh KITA, untuk KITA. Hadir dalam rangka meningkatkan ekonomi UMAT tanpa RIBA. ✨</span>
          <span className="mx-8">✨ Koperasi Konsumen Syariah Adz Zikra. Dari KITA, oleh KITA, untuk KITA. Hadir dalam rangka meningkatkan ekonomi UMAT tanpa RIBA. ✨</span>
          <span className="mx-8">✨ Koperasi Konsumen Syariah Adz Zikra. Dari KITA, oleh KITA, untuk KITA. Hadir dalam rangka meningkatkan ekonomi UMAT tanpa RIBA. ✨</span>
          <span className="mx-8">✨ Koperasi Konsumen Syariah Adz Zikra. Dari KITA, oleh KITA, untuk KITA. Hadir dalam rangka meningkatkan ekonomi UMAT tanpa RIBA. ✨</span>
          <span className="mx-8">✨ Koperasi Konsumen Syariah Adz Zikra. Dari KITA, oleh KITA, untuk KITA. Hadir dalam rangka meningkatkan ekonomi UMAT tanpa RIBA. ✨</span>
          <span className="mx-8">✨ Koperasi Konsumen Syariah Adz Zikra. Dari KITA, oleh KITA, untuk KITA. Hadir dalam rangka meningkatkan ekonomi UMAT tanpa RIBA. ✨</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-green-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-green-900/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Floating Back to Home Button */}
      <a href="#/" className="absolute top-10 left-4 lg:top-12 lg:left-8 z-50 flex items-center space-x-2 bg-green-900/40 hover:bg-green-800 text-white px-4 py-2 rounded-full border border-green-400/30 backdrop-blur-md transition-all shadow-lg">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Kembali ke Beranda</span>
      </a>

      {/* Modern Split Layout Container */}
      <div className="w-full h-full max-w-[1536px] mx-auto flex items-center justify-between px-2 lg:px-12 xl:px-24 relative z-10 pt-8">

      {/* Right Side Decoration (Image & Moto) */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center relative min-h-[70vh] pointer-events-none order-last">
        {/* Store Illustration */}
        <div className="relative flex justify-center mb-2 drop-shadow-2xl opacity-95 animate-in fade-in zoom-in duration-1000 delay-300">
          <img 
            src="/ksa_mart_new_esg.png" 
            alt="Ilustrasi KSA Mart Syariah Baru" 
            className="w-72 md:w-80 lg:w-96 xl:w-[420px] max-w-full h-auto object-contain rounded-2xl drop-shadow-xl"
          />
          
          {/* Main Logo perfectly fitted into the white billboard above the door using 2-point perspective (skewY) */}
          <div className="absolute top-[47.1%] left-[49%] -translate-x-1/2 -translate-y-1/2 w-[27%] h-[9.5%] flex items-center justify-center z-10 skew-y-[13deg]">
            <img src="/ksa_mart_logo.png" alt="Logo KSA Mart" className="max-h-[100%] max-w-[100%] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] brightness-105" />
          </div>
        </div>


        {/* Cinematic Text Box Floating Banner */}
        <div className="mt-2 xl:mt-4 w-[95%] max-w-xl z-0 flex flex-col pointer-events-none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="relative overflow-hidden w-full py-3 lg:py-4 px-3 md:px-4 lg:px-6 bg-gradient-to-r from-green-950/80 via-green-900/60 to-green-800/40 backdrop-blur-xl border border-amber-400/40 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] flex justify-center items-center">
            {/* Subtle Glowing Orb inside the box */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Text Container perfectly centered */}
            <div className="w-full z-10 flex flex-col items-center justify-center animate-elegant-slide shrink-0">
              <span className="font-cursive-modern font-bold text-sm md:text-base lg:text-lg xl:text-xl tracking-wide mb-1 leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-center">
                <span className="text-rose-400">"Menepis Transaksi Riba,</span> <span className="text-amber-400">Demi Meraih Keberkahan Laba"</span>
              </span>
              <span className="font-cursive-modern font-bold text-green-50 text-sm lg:text-base xl:text-lg tracking-wider leading-relaxed text-center mt-1.5 relative inline-block">
                "Belanja Hemat ??? Ada di KSA Mart"
                {/* Curved underline SVG */}
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-amber-400 opacity-80 drop-shadow-md" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,10 Q50,20 100,10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center relative z-10 order-first px-2 lg:px-4">
        <div className="w-full max-w-[640px] relative">
          <div className="bg-white rounded-2xl shadow-2xl p-3 md:p-4 lg:p-5 w-full border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-200">
        
        {/* Brand Modern Logo Header */}
        <div className="flex flex-col items-center text-center space-y-0.5 mb-2">
          <div className="flex items-center justify-center z-10 drop-shadow-xl mb-1.5">
            <img src="/ksa_mart_logo.png" alt="KSA Mart Logo" className="h-10 md:h-12 w-auto object-contain" />
          </div>
          
          <div className="w-full text-center">
            <h1 className="text-[9px] md:text-[10px] font-black text-green-800 tracking-tight leading-none">
              Assalamualaikum Warahmatullahi Wabarakatuh
            </h1>
          </div>
          <p className="text-[8px] md:text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1 mb-0.5">Selamat Datang di</p>
          
          <div className="w-full flex items-center justify-center gap-1 text-center">
            {/* KSA - warna hijau gelap sesuai logo */}
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none" style={{color:'#1a5c2e'}}>
              KSA
            </h2>
            {/* Mart - warna oranye/kuning keemasan sesuai logo */}
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none" style={{color:'#e8890a'}}>
              Mart
            </h2>
          </div>
          <div className="w-full mt-1 text-center">
            <p className="text-[9px] md:text-[10px] text-gray-500 font-medium leading-tight">
              Sistem POS & Akuntansi Terintegrasi untuk UMKM & Bisnis Ritel Modern
            </p>
          </div>
        </div>

        {/* Shariah Guidance Box */}
        <div className="mb-2 p-2 bg-green-50 rounded-xl border border-green-100 flex items-start space-x-1.5 text-[9px] md:text-[10px] text-green-850">
          <Sparkles className="w-3.5 h-3.5 text-green-700 mt-0.5 flex-shrink-0" />
          <p className="leading-tight">
            Dirancang dengan akad sesuai prinsip syariah, mewujudkan perniagaan yang bersih dari Riba, Gharar, maupun Maysir.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          
          {/* Error & Success Banners */}
          {errorMsg && (
            <div className="p-2 bg-red-50 text-red-700 text-[10px] md:text-xs font-semibold rounded-lg border border-red-200 flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200 flex items-center space-x-2">
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
                  className="w-24 bg-slate-50 border border-gray-200 rounded-xl py-4 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-gray-800"
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
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white focus:border-green-600 transition-all text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Username/Email Field */}

          <div className="space-y-1">
            <label className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-gray-600">
              {isRegisterMode ? 'Email' : 'Email atau No Handphone'}
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-500 transition-colors">
                {isRegisterMode ? <Mail className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegisterMode ? "Masukkan email..." : "Masukkan email atau no hp..."}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-[10px] md:text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-green-500/20 focus:bg-white focus:border-green-600 transition-all text-gray-800"
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
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white focus:border-green-600 transition-all text-gray-800"
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
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white focus:border-green-600 transition-all text-gray-800 appearance-none"
                >
                  <option value="PELANGGAN">Pelanggan / Member (Langsung Aktif)</option>
                  <option value="SUPERADMIN">Super Admin</option>
                  <option value="ADMIN">Admin / Supervisor</option>
                  <option value="CASHIER">Kasir (Cashier)</option>
                  <option value="OWNER">Pemilik (Owner)</option>
                </select>
              </div>
            </div>
          )}

          {isRegisterMode && registerRole === 'PELANGGAN' && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs uppercase tracking-wider font-bold text-gray-600">Status Keanggotaan Koperasi</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-gray-200 py-2.5 px-4 rounded-xl flex-1 hover:border-green-500 transition-colors">
                  <input
                    type="radio"
                    name="isKoperasiMember"
                    checked={isKoperasiMember === true}
                    onChange={() => setIsKoperasiMember(true)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="text-xs font-bold text-gray-700">Anggota Koperasi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-gray-200 py-2.5 px-4 rounded-xl flex-1 hover:border-green-500 transition-colors">
                  <input
                    type="radio"
                    name="isKoperasiMember"
                    checked={isKoperasiMember === false}
                    onChange={() => setIsKoperasiMember(false)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="text-xs font-bold text-gray-700">Non Anggota</span>
                </label>
              </div>
              <p className="text-[10px] text-gray-500">Anggota Koperasi berkesempatan mendapatkan SHU & potongan khusus.</p>
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
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:bg-white focus:border-green-600 transition-all text-gray-800 appearance-none"
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
            <label className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-gray-600">Kata Sandi (Password)</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-500 transition-colors">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-slate-50 border border-gray-200 rounded-lg py-2 pl-9 pr-9 text-[10px] md:text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-green-500/20 focus:bg-white focus:border-green-600 transition-all text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-green-600 transition-colors cursor-pointer"
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
                <div className="flex items-start gap-1.5 text-xs text-gray-500 font-medium">
                  <AlertCircle className={`w-4 h-4 ${pwdStrength <= 2 ? 'text-red-500' : pwdStrength <= 4 ? 'text-amber-500' : 'text-green-500'} flex-shrink-0 mt-0.5`} />
                  <span className="leading-tight">
                    Kekuatan: <span className={`font-bold uppercase tracking-wider mr-1 ${pwdStrength <= 2 ? 'text-red-600' : pwdStrength <= 4 ? 'text-amber-600' : 'text-green-600'}`}>{strengthLabel}</span> 
                    - {strengthText}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-extrabold text-[10px] md:text-xs tracking-wider py-2 md:py-2.5 rounded-lg uppercase shadow-md shadow-green-950/20 active:scale-98 transform transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
          >
            {isRegisterMode ? <><UserPlus className="w-4 h-4" /> DAFTAR AKUN</> : 'MASUK KE APLIKASI'}
          </button>
        </form>

        {!isRegisterMode && showDemoAccess && (
          <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5 text-left">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Akun Demo (Klik untuk masuk)</p>
            <div className="flex flex-wrap justify-center gap-1 text-[8px] md:text-[9px] font-semibold">
              <button
                type="button"
                onClick={() => { setUsername('owner'); setPassword('owner123'); }}
                className="flex-1 py-1 px-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-center transition-colors font-bold cursor-pointer whitespace-nowrap"
              >
                👑 Owner
              </button>
              <button
                type="button"
                onClick={() => { setUsername('superadmin.23kk'); setPassword('admin123!'); }}
                className="flex-1 py-1 px-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded text-center transition-colors font-bold cursor-pointer whitespace-nowrap"
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                onClick={() => { setUsername('asy.23.kk'); setPassword('kasir123!'); }}
                className="flex-1 py-1 px-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded text-center transition-colors font-bold cursor-pointer whitespace-nowrap"
              >
                💵 Kasir
              </button>
              <button
                type="button"
                onClick={() => { setUsername('pelanggan1'); setPassword('password123'); }}
                className="flex-1 py-1 px-1.5 bg-green-50 hover:bg-green-100 text-green-900 border border-green-200 rounded text-center transition-colors font-bold cursor-pointer whitespace-nowrap"
              >
                👤 Pelanggan
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setUsername('superadmin.platform'); setPassword('superadmin123!'); }}
              className="w-full py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded text-center text-[8px] md:text-[9px] font-bold transition-colors cursor-pointer"
            >
              ⚙️ Superadmin Platform
            </button>
          </div>
        )}

        <div className="mt-3 text-center space-y-2">
          <button
            type="button"
            onClick={toggleMode}
            className="text-[10px] md:text-xs font-bold text-green-700 hover:text-green-800 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            {isRegisterMode ? (
              <><ArrowLeft className="w-3 h-3" /> Kembali ke Login</>
            ) : (
              'Belum punya akun? Daftar sekarang'
            )}
          </button>
          
          {!isRegisterMode && (
            <p className="text-[9px] md:text-[10px] text-gray-500 font-medium">
              Lupa password? <a href="#" onClick={(e) => { e.preventDefault(); alert("Silakan hubungi Pengembang (WA: 082210027952 / Email: yudiharyono1991@gmail.com) untuk mereset password Anda."); }} className="text-green-600 hover:text-green-700 font-bold underline decoration-green-600/30 underline-offset-2">Hubungi Pengembang</a>
            </p>
          )}
        </div>

        {/* Quran Verse Footer Block inside card */}
        <div className="mt-3 border-t border-gray-100 pt-2 text-center h-[90px] flex items-center justify-center relative overflow-hidden">
          <div key={currentVerseIndex} className="animate-in fade-in slide-in-from-bottom-2 duration-1000 absolute w-full">
            <p className="text-[9px] md:text-[10px] text-gray-400 italic font-medium leading-tight max-w-[380px] mx-auto">
              &quot;{verses[currentVerseIndex].text}&quot;
            </p>
            <p className="text-[8px] md:text-[9px] text-green-700 font-bold mt-1.5 uppercase tracking-widest">{verses[currentVerseIndex].ref}</p>
          </div>
        </div>
      </div>
        {/* Corporate Development Metadata positioned relatively so it doesn't cause scrolling */}
        <div className="mt-2 text-center text-green-50 text-[10px] md:text-xs font-mono tracking-wider space-y-1 drop-shadow-sm opacity-90 pointer-events-none">
          <p className="font-semibold">KSA Mart &ndash; Versi 1.0 2026 IT Development SmartPOS Shariah <span className="text-amber-500">ADZ-ZIKRA</span></p>
        </div>
      </div>
      
      </div>
    </div>
    </div>
  );
}
