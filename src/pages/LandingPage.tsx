import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MonitorPlay, LogIn, Globe, BookOpen, Clock, HeartHandshake, Sun, Moon } from 'lucide-react';
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-emerald-50 text-emerald-950'} font-sans relative overflow-hidden flex flex-col transition-colors duration-500`}>
      {/* Ticker */}
      <div className={`${isDarkMode ? 'bg-slate-950 text-amber-500' : 'bg-emerald-900 text-amber-300'} py-1 overflow-hidden whitespace-nowrap transition-colors duration-500`}>
        <div className="animate-[marquee_20s_linear_infinite] flex space-x-12">
          <span>©2026 All Rights Reserved. KSA Mart</span>
          <a href="https://wa.me/6282210027952?text=Assalamu'alaikum%20Sdr%20Yudi%20Haryono,%20saya%20tertarik%20untuk%20kerjasama%20aplikasi%20KSA%20Mart." target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer underline decoration-dotted underline-offset-4">📞 WhatsApp Pengembang: +6282210027952 (Info & Kerjasama Aplikasi)</a>
          <span>©2026 All Rights Reserved. KSA Mart</span>
          <a href="https://wa.me/6282210027952?text=Assalamu'alaikum%20Sdr%20Yudi%20Haryono,%20saya%20tertarik%20untuk%20kerjasama%20aplikasi%20KSA%20Mart." target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer underline decoration-dotted underline-offset-4">📞 WhatsApp Pengembang: +6282210027952 (Info & Kerjasama Aplikasi)</a>
        </div>
      </div>

      {/* Header */}
      <header className="p-4 sm:p-6 flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center shrink-0 hover:scale-105 transition-transform duration-300 relative drop-shadow-md">
              <img src="/ksa_mart_logo.png" alt="KSA Mart Logo" className="h-12 sm:h-14 w-auto drop-shadow-md rounded-md" />
          </div>
          <span className={`text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} hidden sm:block transition-colors`}>
            KSA <span className={`${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`}>Mart</span>
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Dark Mode Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            title="Ubah Tema"
            className={`p-2 rounded-lg transition-colors font-medium shadow-sm flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Language Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium shadow-sm ${isDarkMode ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
            >
              <Globe size={18} />
              <span className="hidden sm:block">{getLanguageLabel(language)}</span>
            </button>
            {showLanguageDropdown && (
              <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-xl border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'}`}>
                {['ID', 'EN', 'AR'].map(lang => (
                  <button 
                    key={lang}
                    onClick={() => { setLanguage(lang); setShowLanguageDropdown(false); }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      language === lang 
                        ? (isDarkMode ? 'bg-slate-700 text-amber-400' : 'bg-emerald-50 text-emerald-700 font-bold') 
                        : (isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50')
                    }`}
                  >
                    {getLanguageLabel(lang)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/login')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-md transition-all hover:-translate-y-0.5 ${isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            <LogIn size={18} />
            <span className="hidden sm:block">Masuk</span>
          </button>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 py-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl text-center space-y-8"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm mb-4 transition-colors ${isDarkMode ? 'bg-amber-900/40 text-amber-400 border border-amber-700/50' : 'bg-amber-100 text-amber-800'}`}>
            <HeartHandshake size={16} /> Solusi Koperasi & Ritel Islami
          </div>
          <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-sm flex flex-col items-center justify-center transition-colors ${isDarkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>
            <span>KSA</span>
            <span className={`text-5xl md:text-7xl mt-2 flex items-baseline gap-2 relative transition-colors ${isDarkMode ? 'text-amber-400' : 'text-amber-500'} font-black uppercase tracking-tight`}>
              Mart
            </span>
          </h1>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed transition-colors ${isDarkMode ? 'text-slate-300' : 'text-emerald-700'}`}>
            Sistem Kasir Pintar Berbasis Syariah pertama yang terintegrasi dengan laporan PSAK, zakat otomatis, dan manajemen operasional koperasi Anda.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button 
              onClick={() => navigate('/register')}
              className={`px-8 py-4 rounded-xl font-bold shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2 ${isDarkMode ? 'bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-emerald-500/20' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-900/20'}`}
            >
              <Store size={20} /> Daftar Aplikasi
            </button>
          </div>
        </motion.div>

        {/* Islamic Quick Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl"
        >
          <div 
            onClick={() => navigate('/quran')}
            className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-slate-700 hover:bg-slate-800' : 'bg-white/60 backdrop-blur-md border-emerald-100 hover:bg-white'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <BookOpen size={24} />
            </div>
            <h3 className={`font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Al-Qur'an Digital</h3>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-emerald-600'}`}>Bacaan harian untuk keberkahan usaha.</p>
          </div>
          
          <MiniJadwalShalat isDarkMode={isDarkMode} />
          
          <div 
            onClick={() => navigate('/artikel-islami')}
            className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-slate-700 hover:bg-slate-800' : 'bg-white/60 backdrop-blur-md border-emerald-100 hover:bg-white'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <HeartHandshake size={24} />
            </div>
            <h3 className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-emerald-800'}`}>Artikel Dagang</h3>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-emerald-600'}`}>Kumpulan fikih muamalah kontemporer.</p>
          </div>
        </motion.div>

      </main>

      {/* Decorative background blobs */}
      <div className={`fixed top-0 left-0 w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-emerald-900/30 opacity-40' : 'bg-emerald-200 opacity-50'}`}></div>
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
