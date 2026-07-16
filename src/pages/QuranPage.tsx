import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, Search, PlayCircle, PauseCircle, Settings, X, ChevronDown, Check, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull: Record<string, string>;
}

interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

interface SurahDetail extends Surah {
  ayat: Ayat[];
}

const TAJWID_LIST = [
  "Hukum Nun Mati dan Tanwin",
  "Hukum Nun dan Mim Bertasydid",
  "Hukum Mim Mati",
  "Hukum Idgham",
  "Hukum Mad",
  "Hukum Ra",
  "Qalqalah",
  "Bacaan Khusus"
];

const HADITH_TABS = ["Buku Hadits", "Tema", "Kedudukan"];
const HADITH_BOOKS = [
  { id: 1, name: "Shahih Bukhari", author: "Imam Bukhari", arabic: "صحيح البخاري", isKitab: true },
  { id: 2, name: "Shahih Muslim", author: "Imam Muslim", arabic: "صحيح مسلم", isKitab: true },
  { id: 3, name: "Sunan Tirmidzi", author: "Imam Tirmidzi", arabic: "سنن الترمذي", isKitab: true },
  { id: 4, name: "Sunan Abu Daud", author: "Imam Abu Daud", arabic: "سنن أبي داود", isKitab: true },
  { id: 5, name: "Sunan Nasai", author: "Imam Nasa'i", arabic: "سنن النسائي", isKitab: true },
  { id: 6, name: "Sunan Ibnu Majah", author: "Imam Ibnu Majah", arabic: "سنن ابن ماجه", isKitab: true }
];

const JUZ_MAPPING: Record<number, {nomor: number, ayat: string}[]> = {
  1: [{nomor: 1, ayat: "Ayat 1-7"}, {nomor: 2, ayat: "Ayat 1-141"}],
  2: [{nomor: 2, ayat: "Ayat 142-252"}],
  3: [{nomor: 2, ayat: "Ayat 253-286"}, {nomor: 3, ayat: "Ayat 1-92"}],
  4: [{nomor: 3, ayat: "Ayat 93-200"}, {nomor: 4, ayat: "Ayat 1-23"}],
  5: [{nomor: 4, ayat: "Ayat 24-147"}],
  6: [{nomor: 4, ayat: "Ayat 148-176"}, {nomor: 5, ayat: "Ayat 1-81"}],
  7: [{nomor: 5, ayat: "Ayat 82-120"}, {nomor: 6, ayat: "Ayat 1-110"}],
  8: [{nomor: 6, ayat: "Ayat 111-165"}, {nomor: 7, ayat: "Ayat 1-87"}],
  9: [{nomor: 7, ayat: "Ayat 88-206"}, {nomor: 8, ayat: "Ayat 1-40"}],
  10: [{nomor: 8, ayat: "Ayat 41-75"}, {nomor: 9, ayat: "Ayat 1-92"}],
  11: [{nomor: 9, ayat: "Ayat 93-129"}, {nomor: 10, ayat: "Ayat 1-109"}, {nomor: 11, ayat: "Ayat 1-5"}],
  12: [{nomor: 11, ayat: "Ayat 6-123"}, {nomor: 12, ayat: "Ayat 1-52"}],
  13: [{nomor: 12, ayat: "Ayat 53-111"}, {nomor: 13, ayat: "Ayat 1-43"}, {nomor: 14, ayat: "Ayat 1-52"}],
  14: [{nomor: 15, ayat: "Ayat 1-99"}, {nomor: 16, ayat: "Ayat 1-128"}],
  15: [{nomor: 17, ayat: "Ayat 1-111"}, {nomor: 18, ayat: "Ayat 1-74"}],
  16: [{nomor: 18, ayat: "Ayat 75-110"}, {nomor: 19, ayat: "Ayat 1-98"}, {nomor: 20, ayat: "Ayat 1-135"}],
  17: [{nomor: 21, ayat: "Ayat 1-112"}, {nomor: 22, ayat: "Ayat 1-78"}],
  18: [{nomor: 23, ayat: "Ayat 1-118"}, {nomor: 24, ayat: "Ayat 1-64"}, {nomor: 25, ayat: "Ayat 1-20"}],
  19: [{nomor: 25, ayat: "Ayat 21-77"}, {nomor: 26, ayat: "Ayat 1-227"}, {nomor: 27, ayat: "Ayat 1-55"}],
  20: [{nomor: 27, ayat: "Ayat 56-93"}, {nomor: 28, ayat: "Ayat 1-88"}, {nomor: 29, ayat: "Ayat 1-45"}],
  21: [{nomor: 29, ayat: "Ayat 46-69"}, {nomor: 30, ayat: "Ayat 1-60"}, {nomor: 31, ayat: "Ayat 1-34"}, {nomor: 32, ayat: "Ayat 1-30"}, {nomor: 33, ayat: "Ayat 1-30"}],
  22: [{nomor: 33, ayat: "Ayat 31-73"}, {nomor: 34, ayat: "Ayat 1-54"}, {nomor: 35, ayat: "Ayat 1-45"}, {nomor: 36, ayat: "Ayat 1-27"}],
  23: [{nomor: 36, ayat: "Ayat 28-83"}, {nomor: 37, ayat: "Ayat 1-182"}, {nomor: 38, ayat: "Ayat 1-88"}, {nomor: 39, ayat: "Ayat 1-31"}],
  24: [{nomor: 39, ayat: "Ayat 32-75"}, {nomor: 40, ayat: "Ayat 1-85"}, {nomor: 41, ayat: "Ayat 1-46"}],
  25: [{nomor: 41, ayat: "Ayat 47-54"}, {nomor: 42, ayat: "Ayat 1-53"}, {nomor: 43, ayat: "Ayat 1-89"}, {nomor: 44, ayat: "Ayat 1-59"}, {nomor: 45, ayat: "Ayat 1-37"}],
  26: [{nomor: 46, ayat: "Ayat 1-35"}, {nomor: 47, ayat: "Ayat 1-38"}, {nomor: 48, ayat: "Ayat 1-29"}, {nomor: 49, ayat: "Ayat 1-18"}, {nomor: 50, ayat: "Ayat 1-45"}, {nomor: 51, ayat: "Ayat 1-30"}],
  27: [{nomor: 51, ayat: "Ayat 31-60"}, {nomor: 52, ayat: "Ayat 1-49"}, {nomor: 53, ayat: "Ayat 1-62"}, {nomor: 54, ayat: "Ayat 1-55"}, {nomor: 55, ayat: "Ayat 1-78"}, {nomor: 56, ayat: "Ayat 1-96"}, {nomor: 57, ayat: "Ayat 1-29"}],
  28: [{nomor: 58, ayat: "Full"}, {nomor: 59, ayat: "Full"}, {nomor: 60, ayat: "Full"}, {nomor: 61, ayat: "Full"}, {nomor: 62, ayat: "Full"}, {nomor: 63, ayat: "Full"}, {nomor: 64, ayat: "Full"}, {nomor: 65, ayat: "Full"}, {nomor: 66, ayat: "Full"}],
  29: [{nomor: 67, ayat: "Full"}, {nomor: 68, ayat: "Full"}, {nomor: 69, ayat: "Full"}, {nomor: 70, ayat: "Full"}, {nomor: 71, ayat: "Full"}, {nomor: 72, ayat: "Full"}, {nomor: 73, ayat: "Full"}, {nomor: 74, ayat: "Full"}, {nomor: 75, ayat: "Full"}, {nomor: 76, ayat: "Full"}, {nomor: 77, ayat: "Full"}],
  30: [{nomor: 78, ayat: "Full"}, {nomor: 79, ayat: "Full"}, {nomor: 80, ayat: "Full"}, {nomor: 81, ayat: "Full"}, {nomor: 82, ayat: "Full"}, {nomor: 83, ayat: "Full"}, {nomor: 84, ayat: "Full"}, {nomor: 85, ayat: "Full"}, {nomor: 86, ayat: "Full"}, {nomor: 87, ayat: "Full"}, {nomor: 88, ayat: "Full"}, {nomor: 89, ayat: "Full"}, {nomor: 90, ayat: "Full"}, {nomor: 91, ayat: "Full"}, {nomor: 92, ayat: "Full"}, {nomor: 93, ayat: "Full"}, {nomor: 94, ayat: "Full"}, {nomor: 95, ayat: "Full"}, {nomor: 96, ayat: "Full"}, {nomor: 97, ayat: "Full"}, {nomor: 98, ayat: "Full"}, {nomor: 99, ayat: "Full"}, {nomor: 100, ayat: "Full"}, {nomor: 101, ayat: "Full"}, {nomor: 102, ayat: "Full"}, {nomor: 103, ayat: "Full"}, {nomor: 104, ayat: "Full"}, {nomor: 105, ayat: "Full"}, {nomor: 106, ayat: "Full"}, {nomor: 107, ayat: "Full"}, {nomor: 108, ayat: "Full"}, {nomor: 109, ayat: "Full"}, {nomor: 110, ayat: "Full"}, {nomor: 111, ayat: "Full"}, {nomor: 112, ayat: "Full"}, {nomor: 113, ayat: "Full"}, {nomor: 114, ayat: "Full"}]
};

export default function QuranPage() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('Al-Quran');
  const [hadithTab, setHadithTab] = useState('Buku Hadits');
  const [quranSubTab, setQuranSubTab] = useState('Surat');
  const [expandedJuz, setExpandedJuz] = useState<number | null>(null);
  const [expandedIndexAyat, setExpandedIndexAyat] = useState<number | null>(null);
  const [expandedTajwid, setExpandedTajwid] = useState<number | null>(null);
  
  // Surah Detail State
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);
  const [showAyatDropdown, setShowAyatDropdown] = useState(false);
  const [surahSearchText, setSurahSearchText] = useState('');
  
  // Audio State
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [currentPlayingAyat, setCurrentPlayingAyat] = useState<number | null>(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [hoverDisplay, setHoverDisplay] = useState('Terjemahan (Indonesia)');
  const [selectedQori, setSelectedQori] = useState("05");

  const QORI_LIST = [
    { id: "01", name: "Abdullah Al-Juhany" },
    { id: "02", name: "Abdul Muhsin Al-Qasim" },
    { id: "03", name: "Abdurrahman as-Sudais" },
    { id: "04", name: "Ibrahim Al-Dawsari" },
    { id: "05", name: "Misyari Rasyid Al-Afasi" }
  ];

  const ayatRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch('https://equran.id/api/v2/surat')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setSurahs(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching surahs", err);
        setLoading(false);
      });
      
    return () => {
      if (playingAudio) {
        playingAudio.pause();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectSurah = (nomor: number) => {
    setLoadingDetail(true);
    fetch(`https://equran.id/api/v2/surat/${nomor}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setSelectedSurah(data.data);
          setSurahSearchText('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error("Error fetching detail", err);
        setLoadingDetail(false);
      });
  };

  const handleScrollToAyat = (nomorAyat: number) => {
    const element = ayatRefs.current[nomorAyat];
    if (element) {
      // Offset for sticky headers
      const yOffset = -150; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setShowAyatDropdown(false);
  };

  const handlePlayAudio = (audioObj: Record<string, string>, ayatNumber: number, ayatList: Ayat[]) => {
    const url = audioObj[selectedQori] || audioObj["01"];
    if (playingAudio) {
      playingAudio.pause();
      if (currentPlayingAyat === ayatNumber) {
        setPlayingAudio(null);
        setCurrentPlayingAyat(null);
        return;
      }
    }
    const audio = new Audio(url);
    audio.play();
    
    audio.onended = () => {
      const currentIndex = ayatList.findIndex(a => a.nomorAyat === ayatNumber);
      if (currentIndex !== -1 && currentIndex < ayatList.length - 1) {
        const nextAyat = ayatList[currentIndex + 1];
        handlePlayAudio(nextAyat.audio, nextAyat.nomorAyat, ayatList);
      } else {
        setPlayingAudio(null);
        setCurrentPlayingAyat(null);
      }
    };
    
    setPlayingAudio(audio);
    setCurrentPlayingAyat(ayatNumber);

    // Auto-scroll to the currently playing ayat
    setTimeout(() => {
      handleScrollToAyat(ayatNumber);
    }, 100);
  };

  const filteredSurahs = surahs.filter(s => 
    s.namaLatin.toLowerCase().includes(search.toLowerCase()) ||
    s.arti.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDropdownSurahs = surahs.filter(s => 
    s.namaLatin.toLowerCase().includes(surahSearchText.toLowerCase()) ||
    s.arti.toLowerCase().includes(surahSearchText.toLowerCase())
  );

  return (
    <div className={`min-h-screen font-sans pb-12 transition-colors ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-[#f8fafc] text-slate-800 dark:text-slate-200'}`}>
      {/* MAIN HEADER */}
      <header className="bg-green-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                if (playingAudio) { playingAudio.pause(); setPlayingAudio(null); setCurrentPlayingAyat(null); }
                selectedSurah ? setSelectedSurah(null) : navigate('/')
              }}
              className="p-2 hover:bg-green-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-bold tracking-tight">
                {selectedSurah ? selectedSurah.namaLatin : "Al-Qur'an Digital"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-1.5 hover:bg-green-700 rounded-full transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="text-xs font-bold text-green-200 hidden sm:flex items-center gap-2">
              KSA Mart <span className="text-amber-400 tracking-[0.2em]">ADZ-ZIKRA</span>
            </div>
          </div>
        </div>
      </header>

      {/* QUICK NAVIGATION BAR FOR SURAH DETAIL */}
      {selectedSurah && (
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'} border-b sticky top-[68px] z-30 shadow-sm py-2`}>
          <div className="max-w-4xl mx-auto px-4 flex items-center gap-3">
            {/* Surah Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setShowSurahDropdown(!showSurahDropdown); setShowAyatDropdown(false); }} 
                className={`${isDarkMode ? 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800'} px-4 py-1.5 rounded-lg flex items-center gap-2 font-bold text-sm border shadow-sm transition-colors min-w-[140px] justify-between`}
              >
                {selectedSurah.namaLatin} <ChevronDown size={16}/>
              </button>
              {showSurahDropdown && (
                <div className={`absolute top-full left-0 mt-1 w-64 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'} rounded-xl shadow-lg border overflow-hidden`}>
                  <div className={`p-2 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800'}`}>
                    <input 
                       type="text" 
                       placeholder="Search.." 
                       className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                       value={surahSearchText}
                       onChange={(e) => setSurahSearchText(e.target.value)}
                       autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                     {filteredDropdownSurahs.map(s => (
                       <button 
                         key={s.nomor}
                         onClick={() => { handleSelectSurah(s); setShowSurahDropdown(false); }}
                         className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${isDarkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-green-50 text-slate-700 dark:text-slate-300'} ${selectedSurah.nomor === s.nomor ? (isDarkMode ? 'bg-green-900/50 text-green-400 font-bold' : 'bg-green-50 text-green-700 font-bold') : ''}`}
                       >
                         <div>
                           <div className="font-bold text-sm">{s.namaLatin}</div>
                           <div className="text-xs opacity-70">{s.arti}</div>
                         </div>
                         <div className="font-arabic text-lg">{s.nama}</div>
                       </button>
                     ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ayat Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setShowAyatDropdown(!showAyatDropdown); setShowSurahDropdown(false); }} 
                className={`${isDarkMode ? 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800'} px-4 py-1.5 rounded-lg flex items-center gap-2 font-bold text-sm border shadow-sm transition-colors min-w-[120px] justify-between`}
              >
                Ayat 1 <ChevronDown size={16}/>
              </button>
              {showAyatDropdown && (
                <div className={`absolute top-full left-0 mt-1 w-64 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'} rounded-xl shadow-lg border overflow-hidden`}>
                  <div className={`p-2 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800'}`}>
                     {selectedSurah.ayat.map(a => (
                       <button 
                         key={a.nomorAyat}
                         onClick={() => handleScrollToAyat(a.nomorAyat)}
                         className={`w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                       >
                         Ayat {a.nomorAyat}
                       </button>
                     ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {selectedSurah ? (
          /* SURAH DETAIL VIEW */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Bismillah Header */}
            {selectedSurah.nomor !== 9 && (
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white dark:bg-slate-900 border-green-100'} rounded-2xl shadow-sm p-6 text-center border mt-2`}>
                <h2 className={`text-3xl md:text-4xl font-arabic ${isDarkMode ? 'text-green-400' : 'text-green-800'} leading-loose`}>
                  بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
                </h2>
                <p className={`text-sm mt-3 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.</p>
              </div>
            )}

            {/* Verses List */}
            <div className="space-y-4">
              {selectedSurah.ayat.map((ayat) => {
                const isPlaying = currentPlayingAyat === ayat.nomorAyat;
                return (
                  <div 
                    key={ayat.nomorAyat} 
                    ref={el => ayatRefs.current[ayat.nomorAyat] = el}
                    className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'} rounded-2xl shadow-sm p-5 md:p-6 border relative group transition-all ${isPlaying ? 'border-amber-400 shadow-md ring-2 ring-amber-100' : 'hover:border-green-200 hover:shadow-md'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border shadow-sm transition-colors ${isPlaying ? 'bg-amber-100 text-amber-700 border-amber-300' : (isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-green-100 text-green-700 border-green-200')}`}>
                        {ayat.nomorAyat}
                      </div>
                      <div className="flex-1 ml-4 flex justify-end">
                        <button 
                          onClick={() => handlePlayAudio(ayat.audio, ayat.nomorAyat, selectedSurah.ayat)}
                          className={`transition-colors p-2 rounded-full ${isPlaying ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : (isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-green-600 hover:text-green-800 hover:bg-green-50')}`}
                          title={isPlaying ? "Jeda Audio" : "Putar Audio Ayat"}
                        >
                          {isPlaying ? (
                            <PauseCircle className="w-6 h-6 animate-pulse" />
                          ) : (
                            <PlayCircle className="w-6 h-6" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right mb-6">
                      <p className={`text-3xl md:text-4xl font-arabic leading-[2.5] ${isPlaying ? 'text-green-500' : (isDarkMode ? 'text-slate-200' : 'text-slate-900 dark:text-white')}`} dir="rtl">
                        {ayat.teksArab}
                      </p>
                    </div>
                    
                    <div className="space-y-2 border-t border-slate-50 dark:border-slate-800 pt-4">
                      {hoverDisplay === 'Transliterasi' || hoverDisplay === 'Terjemahan (Indonesia)' ? (
                        <p className={`text-sm font-medium italic ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                          {ayat.teksLatin}
                        </p>
                      ) : null}
                      <p className={`text-[15px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {hoverDisplay === 'Terjemahan (English)' ? "(English translation placeholder for demo)" : ayat.teksIndonesia}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* MAIN MENU TABS */
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search Bar & Settings */}
            {activeTab === 'Al-Quran' && (
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari Surah atau Terjemahan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 shadow-sm transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}
                  />
                </div>
                <button 
                  onClick={() => setShowSettings(true)}
                  className={`ml-auto p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-green-600'} shadow-sm transition-colors`}
                  title="Pengaturan"
                >
                  <Settings className="w-6 h-6" />
                </button>
              </div>
            )}
            
            {/* TAB AL-QURAN VIEW */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Quran Sub Tabs (Hanya Surat dan Juz) */}
              <div className="flex gap-2 mb-6">
                {['Surat', 'Juz'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setQuranSubTab(tab)}
                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${quranSubTab === tab ? 'bg-[#3b82f6] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
                
                {quranSubTab === 'Surat' && (
                  loading ? (
                    <div className="flex justify-center py-20 text-green-600">
                      <div className="animate-pulse flex items-center space-x-2">
                        <BookOpen className="w-6 h-6 animate-bounce" />
                        <span className="font-semibold">Memuat Surah...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSurahs.map(surah => (
                        <div 
                          key={surah.nomor}
                          onClick={() => handleSelectSurah(surah.nomor)}
                          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-green-200 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-green-50 text-green-700 rounded-lg flex items-center justify-center font-bold text-sm border border-green-100 group-hover:bg-green-600 group-hover:text-white transition-colors rotate-45">
                              <span className="-rotate-45">{surah.nomor}</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">{surah.namaLatin}</h3>
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">
                                {surah.arti} • {surah.jumlahAyat} Ayat
                              </p>
                            </div>
                          </div>
                          <div className="text-xl font-arabic text-green-600 group-hover:text-green-800 transition-colors">
                            {surah.nama}
                          </div>
                        </div>
                      ))}
                      {filteredSurahs.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                          Surah tidak ditemukan.
                        </div>
                      )}
                    </div>
                  )
                )}

                {quranSubTab === 'Juz' && (
                  <div className="space-y-4">
                    {[
                      { num: 1, eng: "First Juz", ar: "ٱلْجُزْءُ ٱلْأَوَّلُ" },
                      { num: 2, eng: "Second Juz", ar: "ٱلْجُزْءُ ٱلثَّانِي" },
                      { num: 3, eng: "Third Juz", ar: "ٱلْجُزْءُ ٱلثَّالِثُ" },
                      { num: 4, eng: "Fourth Juz", ar: "ٱلْجُزْءُ ٱلرَّابِعُ" },
                      { num: 5, eng: "Fifth Juz", ar: "ٱلْجُزْءُ ٱلْخَامِسُ" },
                      { num: 6, eng: "Sixth Juz", ar: "ٱلْجُزْءُ ٱلسَّادِسُ" },
                      { num: 7, eng: "Seventh Juz", ar: "ٱلْجُزْءُ ٱلسَّابِعُ" },
                      { num: 8, eng: "Eighth Juz", ar: "ٱلْجُزْءُ ٱلثَّامِنُ" },
                      { num: 9, eng: "Ninth Juz", ar: "ٱلْجُزْءُ ٱلتَّاسِعُ" },
                      { num: 10, eng: "Tenth Juz", ar: "ٱلْجُزْءُ ٱلْعَاشِرُ" },
                      { num: 11, eng: "Eleventh Juz", ar: "ٱلْجُزْءُ ٱلْحَادِيَ عَشَرَ" },
                      { num: 12, eng: "Twelfth Juz", ar: "ٱلْجُزْءُ ٱلثَّانِيَ عَشَرَ" },
                      { num: 13, eng: "Thirteenth Juz", ar: "ٱلْجُزْءُ ٱلثَّالِثَ عَشَرَ" },
                      { num: 14, eng: "Fourteenth Juz", ar: "ٱلْجُزْءُ ٱلرَّابِعَ عَشَرَ" },
                      { num: 15, eng: "Fifteenth Juz", ar: "ٱلْجُزْءُ ٱلْخَامِسَ عَشَرَ" },
                      { num: 16, eng: "Sixteenth Juz", ar: "ٱلْجُزْءُ ٱلسَّادِسَ عَشَرَ" },
                      { num: 17, eng: "Seventeenth Juz", ar: "ٱلْجُزْءُ ٱلسَّابِعَ عَشَرَ" },
                      { num: 18, eng: "Eighteenth Juz", ar: "ٱلْجُزْءُ ٱلثَّامِنَ عَشَرَ" },
                      { num: 19, eng: "Nineteenth Juz", ar: "ٱلْجُزْءُ ٱلتَّاسِعَ عَشَرَ" },
                      { num: 20, eng: "Twentieth Juz", ar: "ٱلْجُزْءُ ٱلْعِشْرُونَ" },
                      { num: 21, eng: "Twenty-First Juz", ar: "ٱلْجُزْءُ ٱلْحَادِي وَٱلْعِشْرُونَ" },
                      { num: 22, eng: "Twenty-Second Juz", ar: "ٱلْجُزْءُ ٱلثَّانِي وَٱلْعِشْرُونَ" },
                      { num: 23, eng: "Twenty-Third Juz", ar: "ٱلْجُزْءُ ٱلثَّالِثُ وَٱلْعِشْرُونَ" },
                      { num: 24, eng: "Twenty-Fourth Juz", ar: "ٱلْجُزْءُ ٱلرَّابِعُ وَٱلْعِشْرُونَ" },
                      { num: 25, eng: "Twenty-Fifth Juz", ar: "ٱلْجُزْءُ ٱلْخَامِسُ وَٱلْعِشْرُونَ" },
                      { num: 26, eng: "Twenty-Sixth Juz", ar: "ٱلْجُزْءُ ٱلسَّادِسُ وَٱلْعِشْرُونَ" },
                      { num: 27, eng: "Twenty-Seventh Juz", ar: "ٱلْجُزْءُ ٱلسَّابِعُ وَٱلْعِشْرُونَ" },
                      { num: 28, eng: "Twenty-Eighth Juz", ar: "ٱلْجُزْءُ ٱلثَّامِنُ وَٱلْعِشْرُونَ" },
                      { num: 29, eng: "Twenty-Ninth Juz", ar: "ٱلْجُزْءُ ٱلتَّاسِعُ وَٱلْعِشْرُونَ" },
                      { num: 30, eng: "Thirtieth Juz", ar: "ٱلْجُزْءُ ٱلثَّلَاثُونَ" }
                    ].map(juz => (
                      <div key={juz.num} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden transition-all group">
                        <div 
                          onClick={() => setExpandedJuz(expandedJuz === juz.num ? null : juz.num)}
                          className="p-5 flex items-center justify-between hover:bg-slate-50 dark:bg-slate-800 cursor-pointer relative"
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${expandedJuz === juz.num ? 'bg-blue-500' : 'bg-[#fbbf24]'}`}></div>
                          <div className="flex items-center gap-4">
                            <div className={`${expandedJuz === juz.num ? 'bg-blue-500 text-white' : 'bg-[#fbbf24] text-amber-900'} w-8 h-8 rounded flex items-center justify-center font-bold text-sm ml-2 transition-colors`}>
                              {juz.num}
                            </div>
                            <div>
                              <h4 className={`font-bold ${expandedJuz === juz.num ? 'text-blue-600' : 'text-slate-800 dark:text-slate-200'}`}>Juz ke {juz.num}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic">{juz.eng}</p>
                            </div>
                          </div>
                          <div className={`text-xl font-arabic transition-colors ${expandedJuz === juz.num ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400 group-hover:text-green-600'}`}>
                            {juz.ar}
                          </div>
                        </div>

                        {/* Expanded Menu */}
                        {expandedJuz === juz.num && (
                          <div className="bg-blue-500 animate-in fade-in slide-in-from-top-2 duration-300 relative border-t-2 border-white/20 shadow-inner">
                            <div className="absolute right-2 top-2 bottom-2 w-1.5 bg-white dark:bg-slate-900/20 rounded-full"></div>
                            <div className="divide-y divide-blue-400/30">
                              {(JUZ_MAPPING[juz.num] || []).map((sm, idx) => {
                                const surahInfo = surahs.find(s => s.nomor === sm.nomor);
                                const sName = surahInfo ? surahInfo.namaLatin : `Surat ${sm.nomor}`;
                                return (
                                  <div 
                                    key={idx} 
                                    onClick={() => {
                                      handleSelectSurah(sm.nomor);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="flex justify-between items-center px-6 py-3 hover:bg-blue-600/50 cursor-pointer transition-colors group/item"
                                  >
                                    <span className="text-white font-semibold text-sm group-hover/item:translate-x-1 transition-transform">{sName}</span>
                                    <span className="bg-[#fbbf24] text-amber-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm mr-4 tracking-wide">
                                      {sm.ayat === 'Full' ? 'Seluruh Ayat' : sm.ayat}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
            
            {loadingDetail && (
              <div className="fixed inset-0 bg-white dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 animate-spin" />
                  <span>Membuka Surah...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* SETTINGS MODAL / DRAWER */}
      {showSettings && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50" onClick={() => setShowSettings(false)}></div>
          <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 p-6 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Pengaturan</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6 flex-1">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-sm">Pilih Qori (Pembaca)</h4>
                <div className="space-y-2">
                  <select 
                    value={selectedQori} 
                    onChange={(e) => setSelectedQori(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {QORI_LIST.map(q => (
                      <option key={q.id} value={q.id}>{q.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Tampilan Hover Ayat</h4>
                <div className="space-y-3">
                  {['Terjemahan (Indonesia)', 'Terjemahan (English)', 'Transliterasi'].map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="radio" 
                          name="hover" 
                          checked={hoverDisplay === opt} 
                          onChange={() => setHoverDisplay(opt)} 
                          className="w-5 h-5 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 peer cursor-pointer"
                        />
                      </div>
                      <span className={`text-sm font-medium transition-colors ${hoverDisplay === opt ? 'text-blue-700 font-bold' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:text-slate-200'}`}>
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Font for Arabic & Global Custom Utilities */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap');
        .font-arabic {
          font-family: 'Amiri Quran', serif;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
