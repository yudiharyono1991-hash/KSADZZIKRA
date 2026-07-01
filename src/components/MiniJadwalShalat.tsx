import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrayerTimes {
  subuh: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

export default function MiniJadwalShalat({ isDarkMode }: { isDarkMode: boolean }) {
  const navigate = useNavigate();
  const [jadwal, setJadwal] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    
    // Jakarta city id = 1301
    fetch(`https://api.myquran.com/v2/sholat/jadwal/1301/${y}/${m}/${dStr}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data && data.data.jadwal) {
          setJadwal(data.data.jadwal);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div 
      onClick={() => navigate('/jadwal-shalat')}
      className={`p-5 rounded-2xl border shadow-sm flex flex-col items-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md border-slate-700 hover:bg-slate-800' : 'bg-white/60 backdrop-blur-md border-emerald-100 hover:bg-white'}`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${isDarkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
        <Clock size={20} />
      </div>
      <h3 className={`font-bold mb-3 ${isDarkMode ? 'text-amber-500' : 'text-amber-800'}`}>Jadwal Shalat</h3>
      
      {loading ? (
        <div className="w-full h-20 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : jadwal ? (
        <div className="w-full grid grid-cols-2 gap-2 text-xs">
          <div className={`flex justify-between p-1.5 rounded bg-opacity-50 ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
            <span>Subuh</span><span className="font-bold">{jadwal.subuh}</span>
          </div>
          <div className={`flex justify-between p-1.5 rounded bg-opacity-50 ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
            <span>Dzuhur</span><span className="font-bold">{jadwal.dzuhur}</span>
          </div>
          <div className={`flex justify-between p-1.5 rounded bg-opacity-50 ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
            <span>Ashar</span><span className="font-bold">{jadwal.ashar}</span>
          </div>
          <div className={`flex justify-between p-1.5 rounded bg-opacity-50 ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
            <span>Maghrib</span><span className="font-bold">{jadwal.maghrib}</span>
          </div>
          <div className={`col-span-2 flex justify-between p-1.5 rounded bg-opacity-50 ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
            <span>Isya</span><span className="font-bold">{jadwal.isya}</span>
          </div>
        </div>
      ) : (
        <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-amber-700'}`}>Gagal memuat jadwal</p>
      )}
    </div>
  );
}
