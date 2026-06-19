import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { isSupabaseConfigured } from '../../lib/supabase';
import { 
  Building, 
  Clock, 
  Calendar, 
  AlertTriangle,
  Database,
  User,
  ShieldAlert,
  Menu,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface TopBarProps {
  onToggleSidebar?: () => void;
  onToggleDesktopSidebar?: () => void;
}

export default function TopBar({ onToggleSidebar, onToggleDesktopSidebar }: TopBarProps) {
  const { transactions, products, currentUser, branches, activeBranchId, setActiveBranchId, logout } = useAppStore();
  const [time, setTime] = useState(new Date());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's total sales
  const todaySales = transactions
    .filter(tx => tx.timestamp.startsWith('2026-06-07'))
    .reduce((sum, tx) => sum + tx.totalAmount, 0);

  // Today's margin
  const todayMargin = transactions
    .filter(tx => tx.timestamp.startsWith('2026-06-07'))
    .reduce((sum, tx) => sum + tx.marginContribution, 0);

  // Check how many items low stock
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Determine branch name for current user
  const userBranchName = currentUser?.branchId 
    ? branches.find(b => b.id === currentUser?.branchId)?.name || 'Cabang Tidak Dikenal'
    : 'Pusat';

  return (
    <header id="app-topbar" className="h-16 bg-white border-b border-gray-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 bg-opacity-95 backdrop-blur-md select-none">
      
      {/* Brand Context */}
      <div className="flex items-center space-x-1.5 md:space-x-2 text-gray-500 font-semibold text-xs">
        {/* Mobile Hamburger */}
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 mr-1 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-lg md:hidden transition-colors"
            aria-label="Buka Menu Mobile"
          >
            <Menu className="w-5 h-5 text-emerald-800" />
          </button>
        )}
        {/* Desktop Hamburger */}
        {onToggleDesktopSidebar && (
          <button 
            onClick={onToggleDesktopSidebar}
            className="p-1.5 -ml-1 mr-1 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-lg hidden md:block transition-colors"
            aria-label="Buka/Tutup Menu Desktop"
          >
            <Menu className="w-5 h-5 text-emerald-800" />
          </button>
        )}
        <Building className="w-4.5 h-4.5 text-emerald-700 hidden sm:inline" />
        <span className="text-gray-800 font-extrabold font-sans">BA Mart</span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        
        {isSupabaseConfigured ? (
          <span className="bg-emerald-50 text-emerald-700 text-[10px] uppercase font-black tracking-wider px-2 pl-1.5 py-1 rounded-full border border-emerald-150 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
            <span className="hidden xs:inline">Supabase Aktif</span>
            <span className="xs:hidden">Supabase</span>
          </span>
        ) : (
          <span className="bg-amber-50 text-amber-700 text-[10px] uppercase font-black tracking-wider px-2 pl-1.5 py-1 rounded-full border border-amber-150 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Offline
          </span>
        )}
      </div>

      {/* Real-time stats & Profile context */}
      <div className="flex items-center space-x-5">
        
        {/* Low Stock Warning Header */}
        {lowStockCount > 0 && (
          <div className="flex items-center space-x-1.5 bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-amber-150">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            <span>{lowStockCount} Stok Low</span>
          </div>
        )}

        {/* Live Counters */}
        {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN' || currentUser.role === 'CASHIER') && (
          <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-wider border-l border-r border-gray-100 px-5">
            <div>
              <p className="text-gray-400">Total Omset Hari Ini</p>
              <p className="font-extrabold text-gray-900 text-xs font-mono mt-0.5">Rp {todaySales.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-gray-400">Margin Berkah</p>
              <p className="font-extrabold text-emerald-700 text-xs font-mono mt-0.5">Rp {todayMargin.toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}

        {/* User Identity Display */}
        {currentUser && (
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 px-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-emerald-800" />
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <p className="text-[10px] font-extrabold text-gray-800 font-sans tracking-wide uppercase">{currentUser.name}</p>
                <p className="text-[8px] text-gray-500 font-mono italic">
                  {currentUser.role} • {userBranchName}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-gray-50 bg-slate-50/50">
                    <p className="text-xs font-bold text-gray-800 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{currentUser.username}</p>
                    <div className="mt-2 flex items-center space-x-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded">
                      <Building className="w-3 h-3" />
                      <span>{userBranchName}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Branch Selector (OWNER ONLY) */}
        {currentUser?.role === 'OWNER' && (
          <div className="hidden lg:flex items-center space-x-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
            <Building className="w-3 h-3 text-emerald-700" />
            <select
              value={activeBranchId}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="text-[10px] font-bold text-gray-700 bg-transparent outline-none focus:ring-0 cursor-pointer uppercase w-24"
            >
              <option value="">SEMUA CABANG</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Clock display */}
        <div className="flex items-center space-x-3 text-right">
          <div className="text-[10px] font-bold tracking-wider text-gray-700">
            <div className="flex items-center space-x-1 justify-end">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>{time.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center space-x-1 justify-end text-gray-500 font-mono mt-0.5 font-semibold text-[9px]">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>{time.toLocaleTimeString('id-ID', { hour12: false })} WIB</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
