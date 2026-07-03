import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, ArrowLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function BeritaPusatPage() {
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const location = useLocation();
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
    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isPublic ? 'p-4 md:p-8 bg-green-50 min-h-screen' : ''}`}>
      {isPublic && (
        <a href="#/" className="inline-flex items-center space-x-2 bg-green-900/10 hover:bg-green-900/20 text-green-900 px-4 py-2 rounded-full font-bold transition-all mb-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Kembali ke Beranda</span>
        </a>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-green-600" />
            Berita Koperasi Pusat
          </h1>
          <p className="text-gray-500 mt-1">
            Informasi dan berita terbaru langsung dari website resmi Koperasi Syariah Adz-Zikra.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
        
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm">
            <RefreshCw className="w-10 h-10 text-green-500 animate-spin mb-3" />
            <p className="text-gray-500 font-medium">Memuat berita dari pusat...</p>
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
