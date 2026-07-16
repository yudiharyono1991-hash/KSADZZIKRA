import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, Calendar as CalendarIcon, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

interface PrayerTimes {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

export default function JadwalShalatPage() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const [cityId, setCityId] = useState('1301'); // 1301 = Kota Jakarta
  const [jadwal, setJadwal] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Clock tick
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    
    // Using myquran.com API for Indonesian prayer times
    fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${y}/${m}/${dStr}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data && data.data.jadwal) {
          setJadwal(data.data.jadwal);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching prayer times", err);
        setLoading(false);
      });
  }, [cityId]);

  const prayerIcons: Record<string, React.ReactNode> = {
    'Subuh': <Sunrise className="w-8 h-8 text-indigo-400" />,
    'Dzuhur': <Sun className="w-8 h-8 text-amber-500" />,
    'Ashar': <Sun className="w-8 h-8 text-orange-500" />,
    'Maghrib': <Sunset className="w-8 h-8 text-rose-500" />,
    'Isya': <Moon className="w-8 h-8 text-slate-700 dark:text-slate-300" />,
  };

  return (
    <div className={`min-h-screen font-sans pb-12 transition-colors ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-[#f8fafc] text-slate-800 dark:text-slate-200'}`}>
      <header className="bg-green-800 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-green-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Clock className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-bold tracking-tight">Jadwal Shalat</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-1.5 hover:bg-green-700 rounded-full transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8 animate-in fade-in duration-500">
        {/* TIME CARD */}
        <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Clock className="w-64 h-64" />
          </div>
          
          <div className="relative z-10 text-center space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-green-200">Waktu Saat Ini</h2>
            <div className="text-6xl md:text-7xl font-black font-mono tracking-tighter drop-shadow-md">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-green-100 flex items-center justify-center gap-2 mt-4">
              <CalendarIcon className="w-4 h-4" />
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* CITY SELECTOR */}
        <div className={`mt-8 flex flex-col md:flex-row gap-4 items-center p-4 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
          <div className={`flex items-center gap-2 font-medium whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <MapPin className="w-5 h-5" />
            <span>Pilih Kota Lokasi:</span>
          </div>
          <select 
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className={`w-full border rounded-xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-green-500 focus:outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-green-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-green-800'}`}
          >
            <option value="1301">Kota Jakarta</option>
            <option value="1219">Kota Bandung</option>
            <option value="1609">Kota Yogyakarta</option>
            <option value="1505">Kota Surabaya</option>
            <option value="0412">Kota Medan</option>
            <option value="2111">Kota Makassar</option>
            <option value="1425">Kota Semarang</option>
          </select>
        </div>

        {/* SCHEDULE GRID */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-pulse flex items-center justify-center space-x-2 text-green-600">
              <Clock className="w-6 h-6 animate-spin" />
              <span className="font-bold">Memuat Jadwal...</span>
            </div>
          </div>
        ) : jadwal ? (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].map((waktu) => (
              <div key={waktu} className={`rounded-2xl p-6 shadow-sm border flex flex-col items-center justify-center text-center hover:border-green-300 hover:shadow-md transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                <div className={`mb-3 p-3 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50 dark:bg-slate-800'}`}>
                  {prayerIcons[waktu]}
                </div>
                <h3 className={`text-sm font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{waktu}</h3>
                <p className={`text-2xl font-black font-mono ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>
                  {jadwal[waktu.toLowerCase() as keyof PrayerTimes]}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center text-red-500 font-bold bg-red-50 p-4 rounded-xl">
            Gagal memuat jadwal shalat.
          </div>
        )}

      </main>
    </div>
  );
}
