import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MonitorPlay, LogIn, Globe, BookOpen, Clock, HeartHandshake, Sun, Moon, ShoppingBag, Newspaper } from 'lucide-react';
import { motion } from 'motion/react';
import MiniJadwalShalat from '../components/MiniJadwalShalat';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [language, setLanguage] = useState('ID');

  const getLanguageLabel = (code: string) => {
    switch(code) {
      case 'EN': return 'English (EN)';
      case 'AR': return 'العربية (AR)';
      case 'ID': default: return 'Bahasa (ID)';
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-green-50 text-green-950'} font-sans relative overflow-x-hidden flex flex-col transition-colors duration-500 pb-10`}>
      {/* Ticker */}
      <div className={`${isDarkMode ? 'bg-slate-950 text-amber-500' : 'bg-green-900 text-amber-300'} py-1 overflow-hidden whitespace-nowrap transition-colors duration-500`}>
        <div className="animate-[marquee_20s_linear_infinite] flex space-x-12">
          <span>©2026 All Rights Reserved. KSA Mart Adz-Zikra</span>
          <span>Sistem Kasir Pintar Berbasis Syariah</span>
          <span>©2026 All Rights Reserved. KSA Mart Adz-Zikra</span>
          <span>Sistem Kasir Pintar Berbasis Syariah</span>
        </div>
      </div>

      {/* Header */}
      <header className="p-4 sm:p-6 flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center shrink-0 hover:scale-105 transition-transform duration-300 relative drop-shadow-md">
              <img src="/ksa_mart_logo.png" alt="KSA Mart Logo" className="h-12 sm:h-14 w-auto drop-shadow-md rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Dark Mode Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            title="Ubah Tema"
            className={`p-2 rounded-lg transition-colors font-medium shadow-sm flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Language Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium shadow-sm ${isDarkMode ? 'bg-slate-800 text-green-400 hover:bg-slate-700' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
            >
              <Globe size={18} />
              <span className="hidden sm:block">{getLanguageLabel(language)}</span>
            </button>
            {showLanguageDropdown && (
              <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-xl border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-green-100'}`}>
                {['ID', 'EN', 'AR'].map(lang => (
                  <button 
                    key={lang}
                    onClick={() => { setLanguage(lang); setShowLanguageDropdown(false); }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      language === lang 
                        ? (isDarkMode ? 'bg-slate-700 text-amber-400' : 'bg-green-50 text-green-700 font-bold') 
                        : (isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50')
                    }`}
                  >
                    {getLanguageLabel(lang)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 py-8 sm:py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl text-center space-y-2 sm:space-y-4"
        >
          {/* Syariah badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm mb-1 sm:mb-2 transition-colors ${isDarkMode ? 'bg-amber-900/40 text-amber-400 border border-amber-700/50' : 'bg-amber-100 text-amber-800'}`}>
            <HeartHandshake size={14} className="sm:w-4 sm:h-4" /> Solusi Koperasi & Ritel Islami
          </div>

          {/* Brand Identity */}
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              {/* Store Icon */}
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl shadow-xl bg-gradient-to-br from-[#1a5c2e] to-[#0d3b1b] transform hover:scale-105 transition-all duration-300 ring-4 ring-green-100/50">
                <Store className="w-6 h-6 sm:w-8 sm:h-8 text-green-50 drop-shadow-md" />
              </div>

              {/* App Name */}
              <h1 className="text-[3.25rem] sm:text-6xl md:text-[4.5rem] font-black tracking-tighter leading-none flex items-center gap-2 drop-shadow-sm">
                <span style={{color: '#1a5c2e'}}>KSA</span>
                <span style={{color: '#e8890a'}}>Mart</span>
              </h1>
            </div>

            {/* Growth philosophy line */}
            <div className="mt-1 sm:mt-2 flex flex-col items-center gap-1">
              <div className={`flex items-center gap-2 text-[11px] md:text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-green-500' : 'text-green-700'}`}>
                <span className="text-amber-500">▲</span>
                Dari KITA, oleh KITA, untuk KITA
                <span className="text-amber-500">▲</span>
              </div>
              <div className={`h-px w-64 md:w-[500px] ${isDarkMode ? 'bg-gradient-to-r from-transparent via-green-600 to-transparent' : 'bg-gradient-to-r from-transparent via-green-400 to-transparent'}`}></div>
              <p className={`text-[10px] md:text-xs font-medium tracking-wide uppercase text-center max-w-[500px] ${isDarkMode ? 'text-amber-500/80' : 'text-amber-700'}`}>
                Hadir dalam rangka meningkatkan ekonomi UMAT tanpa RIBA.<br/>
                Bersama KSA Mart Adz-Zikra
              </p>
            </div>
          </div>

          {/* Description */}
          <p className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed transition-colors ${isDarkMode ? 'text-slate-300' : 'text-green-700'}`}>
            Sistem Kasir Pintar Berbasis Syariah — terintegrasi laporan keuangan, zakat otomatis, dan manajemen operasional koperasi. <span className={`font-bold whitespace-nowrap ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>Halal. Amanah. Berkah.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4 sm:pt-6 shrink-0 mt-4">
            <button 
              onClick={() => navigate('/login')}
              className={`px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2 shrink-0 ${isDarkMode ? 'bg-green-500 text-white hover:bg-green-400 hover:shadow-green-500/20' : 'bg-green-700 text-white hover:bg-green-800 hover:shadow-green-900/20'}`}
            >
              <LogIn size={20} className="w-5 h-5" /> Login / Anggota
            </button>
            <button 
              onClick={() => navigate('/katalog')}
              className={`px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2 shrink-0 ${isDarkMode ? 'bg-amber-600 text-white hover:bg-amber-500 hover:shadow-amber-500/20' : 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-900/20'}`}
            >
              <ShoppingBag size={20} className="w-5 h-5" /> Belanja Umum
            </button>
          </div>
        </motion.div>

        {/* Islamic Quick Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl shrink-0"
        >
          <div 
            onClick={() => navigate('/quran')}
            className={`p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-col items-center text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-slate-700 hover:bg-slate-800' : 'bg-white/60 backdrop-blur-md border-green-100 hover:bg-white'}`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-colors ${isDarkMode ? 'bg-[#135d25]/50 text-[#4ade80]' : 'bg-[#e7f5eb] text-[#135d25]'}`}>
              <BookOpen size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-[#4ade80]' : 'text-[#135d25]'}`}>Al-Qur'an Digital</h3>
            <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${isDarkMode ? 'text-slate-400' : 'text-[#135d25]/80'}`}>Bacaan harian untuk keberkahan usaha.</p>
          </div>
          
          <MiniJadwalShalat isDarkMode={isDarkMode} />
          
          <div 
            onClick={() => navigate('/artikel-islami')}
            className={`p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-col items-center text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-slate-700 hover:bg-slate-800' : 'bg-white/60 backdrop-blur-md border-green-100 hover:bg-white'}`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-colors ${isDarkMode ? 'bg-[#135d25]/50 text-[#4ade80]' : 'bg-[#e7f5eb] text-[#135d25]'}`}>
              <HeartHandshake size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-[#4ade80]' : 'text-[#135d25]'}`}>Artikel Dagang</h3>
            <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${isDarkMode ? 'text-slate-400' : 'text-[#135d25]/80'}`}>Kumpulan fikih muamalah kontemporer.</p>
          </div>
          
          <div 
            onClick={() => navigate('/berita')}
            className={`p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-col items-center text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-slate-700 hover:bg-slate-800' : 'bg-white/60 backdrop-blur-md border-green-100 hover:bg-white'}`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-colors ${isDarkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
              <Newspaper size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-amber-400' : 'text-green-800'}`}>Berita Koperasi</h3>
            <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${isDarkMode ? 'text-slate-400' : 'text-green-600'}`}>Info terkini dari KS Adz-Zikra Pusat.</p>
          </div>
        </motion.div>

      </main>

      {/* Decorative background blobs */}
      <div className={`fixed top-0 left-0 w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-green-900/30 opacity-40' : 'bg-green-200 opacity-50'}`}></div>
      <div className={`fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-amber-900/20 opacity-30' : 'bg-amber-200 opacity-30'}`}></div>



      {/* Marquee Keyframes */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
