import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store';

export default function BeritaPusatPage() {
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const isPublic = location.pathname === '/berita';

  useEffect(() => {
    // Prevent infinite loading overlay if the external site is slow/down
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [key]);

  const handleRefresh = () => {
    setLoading(true);
    setKey(prev => prev + 1); // Forces iframe to reload
  };

  return (
    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isPublic ? (isDarkMode ? 'p-4 md:p-8 bg-slate-900 min-h-screen text-slate-200' : 'p-4 md:p-8 bg-green-50 min-h-screen text-slate-800 dark:text-slate-200') : ''}`}>
      {isPublic && (
        <a href="#/" className="inline-flex items-center space-x-2 bg-green-900/10 hover:bg-green-900/20 text-green-900 px-4 py-2 rounded-full font-bold transition-all mb-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Kembali ke Beranda</span>
        </a>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-900 dark:text-white'}`}>
            <Newspaper className="w-6 h-6 text-green-600" />
            Berita Koperasi Pusat
          </h1>
          <p className={`mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500 dark:text-slate-400'}`}>
            Informasi dan berita terbaru langsung dari website resmi Koperasi Syariah Adz-Zikra.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleDarkMode} className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:bg-slate-800'}`}>
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-gray-700 dark:text-slate-300" />}
          </button>
          <button
            onClick={handleRefresh}
            className={`px-4 py-2 border rounded-lg font-medium flex items-center gap-2 transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:bg-slate-800'}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <a
            href="https://www.ks-adzzikra.id/berita.php"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            Buka di Browser <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden relative ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'}`} style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
        
        {loading && (
          <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm ${isDarkMode ? 'bg-slate-900/80' : 'bg-gray-50 dark:bg-slate-800/80'}`}>
            <RefreshCw className="w-10 h-10 text-green-500 animate-spin mb-3" />
            <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500 dark:text-slate-400'}`}>Memuat berita dari pusat...</p>
          </div>
        )}

        <iframe
          key={key}
          src="https://www.ks-adzzikra.id/berita.php"
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title="Berita Pusat KS Adz-Zikra"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          loading="lazy"
        />
      </div>
    </div>
  );
}
