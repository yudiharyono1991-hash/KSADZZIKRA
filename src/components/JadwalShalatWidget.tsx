import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar as CalendarIcon, Sunrise, Sun, Sunset, Moon } from 'lucide-react';

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

export default function JadwalShalatWidget() {
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
    <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-500">
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
      <div className="mt-6 flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
          <MapPin className="w-5 h-5" />
          <span>Pilih Kota Lokasi:</span>
        </div>
        <select 
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold text-green-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
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
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].map((waktu) => (
            <div key={waktu} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center hover:border-green-300 hover:shadow-md transition-all">
              <div className="mb-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-full">
                {prayerIcons[waktu]}
              </div>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{waktu}</h3>
              <p className="text-2xl font-black font-mono text-green-800">
                {jadwal[waktu.toLowerCase() as keyof PrayerTimes]}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center text-red-500 font-bold bg-red-50 p-4 rounded-xl">
          Gagal memuat jadwal shalat.
        </div>
      )}
    </div>
  );
}
