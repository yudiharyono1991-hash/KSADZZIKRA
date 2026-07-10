import React, { useState, useEffect } from 'react';
import { useBranchData } from '../../hooks/useBranchData';
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
  ChevronDown,
  KeyRound,
  X,
  Users,
  Bell,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

interface TopBarProps {
  onToggleSidebar?: () => void;
  onToggleDesktopSidebar?: () => void;
}

export default function TopBar({ onToggleSidebar, onToggleDesktopSidebar }: TopBarProps) {
  const { transactions, products, currentUser, branches, activeBranchId, setActiveBranchId, logout, users, updateUser, onlineOrders, notifications, markNotificationAsRead } = useBranchData();
  const [time, setTime] = useState(new Date());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPassword) return;
    const activeUser = users.find(u => u.username === currentUser.username);
    if (activeUser) {
      updateUser(activeUser.id, { password: newPassword });
      alert('Kata sandi berhasil diperbarui!');
    }
    setNewPassword('');
    setIsPasswordModalOpen(false);
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayDateStr = `${year}-${month}-${day}`;

  // Today's total sales
  const todaySales = transactions
    .filter(tx => tx.timestamp.startsWith(todayDateStr))
    .reduce((sum, tx) => sum + tx.totalAmount, 0);

  // Today's margin
  const todayMargin = transactions
    .filter(tx => tx.timestamp.startsWith(todayDateStr))
    .reduce((sum, tx) => sum + tx.marginContribution, 0);

  // Check how many items low stock
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Determine branch name for current user
  const userBranchName = currentUser?.branchId 
    ? branches.find(b => b.id === currentUser?.branchId)?.name || 'Cabang Tidak Dikenal'
    : 'Pusat';

  const pendingUsersCount = users?.filter(u => !u.isApproved).length || 0;
  const pendingOnlineOrdersCount = onlineOrders?.filter(o => o.status === 'PENDING').length || 0;

  // Find expiring products (30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringProducts = products.filter(p => {
    if (!p.expiryDate || p.stock <= 0) return false;
    return new Date(p.expiryDate) <= thirtyDaysFromNow;
  });
  
  // Filter notifications for current user
  const unreadNotifications = notifications?.filter(n => {
    if (n.isRead) return false;
    if (n.excludeUsernames && currentUser?.username && n.excludeUsernames.includes(currentUser.username)) return false;
    if (n.targetRole) {
      const roles = Array.isArray(n.targetRole) ? n.targetRole : [n.targetRole];
      if (!roles.includes(currentUser?.role as any)) return false;
    }
    if (n.branchId && currentUser?.branchId && n.branchId !== currentUser.branchId) return false;
    return true;
  }) || [];
  
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header id="app-topbar" className="h-16 bg-gradient-to-r from-emerald-50 via-white to-green-50 border-b-2 border-green-700 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 bg-opacity-95 backdrop-blur-md select-none">
      
      {/* Brand Context */}
      <div className="flex items-center space-x-1.5 md:space-x-2 text-gray-500 font-semibold text-xs">
        {/* Mobile Hamburger */}
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 mr-1 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-lg md:hidden transition-colors"
            aria-label="Buka Menu Mobile"
          >
            <Menu className="w-5 h-5 text-green-800" />
          </button>
        )}
        {/* Desktop Hamburger */}
        {onToggleDesktopSidebar && (
          <button 
            onClick={onToggleDesktopSidebar}
            className="p-1.5 -ml-1 mr-1 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-lg hidden md:block transition-colors"
            aria-label="Buka/Tutup Menu Desktop"
          >
            <Menu className="w-5 h-5 text-green-800" />
          </button>
        )}
        <Building className="w-4.5 h-4.5 text-green-700 hidden sm:inline" />
        <span className="text-gray-800 font-extrabold font-sans">KSA Mart</span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        
        {isSupabaseConfigured ? (
          <span className="bg-green-50 text-green-700 text-[10px] uppercase font-black tracking-wider px-2 pl-1.5 py-1 rounded-full border border-green-150 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5"></span>
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
      <div className="flex items-center space-x-4 md:space-x-5">
        
        {/* Refresh Button */}
        <button 
          onClick={handleRefresh}
          className="p-1.5 bg-slate-100 hover:bg-green-100 text-gray-500 hover:text-green-700 rounded-lg transition-colors cursor-pointer"
          title="Sinkronisasi Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Expiring Products Alert */}
        {expiringProducts.length > 0 && (
          <div className="relative group cursor-pointer">
            <div className="flex items-center space-x-1.5 bg-red-50 text-red-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-red-150">
              <Bell className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span className="hidden sm:inline">{expiringProducts.length} Hampir Expired</span>
              <span className="sm:hidden">{expiringProducts.length} Expired</span>
            </div>
            
            {/* Dropdown list of expiring products on hover */}
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-2 hidden group-hover:block">
              <div className="px-3 pb-2 border-b border-gray-100 mb-1">
                <span className="text-xs font-bold text-gray-800">Peringatan Kedaluwarsa</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {expiringProducts.map(p => (
                  <div key={p.id} className="px-3 py-1.5 hover:bg-slate-50 flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700 truncate max-w-[140px]">{p.name}</span>
                    <span className="text-[10px] font-mono text-red-600 font-bold bg-red-50 px-1 rounded border border-red-100">
                      {new Date(p.expiryDate!).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {lowStockCount > 0 && (
          <div className="flex items-center space-x-1.5 bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-amber-150">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            <span className="hidden sm:inline">{lowStockCount} Stok Low</span>
            <span className="sm:hidden">{lowStockCount} Low</span>
          </div>
        )}

        {/* Pending Users Warning Header */}
        {pendingUsersCount > 0 && (currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') && (
          <div className="flex items-center space-x-1.5 bg-red-50 text-red-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-red-150 cursor-pointer" onClick={() => window.location.hash = '#/admin-management'}>
            <Users className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span className="hidden sm:inline">{pendingUsersCount} Akun Pending</span>
            <span className="sm:hidden">{pendingUsersCount} Akun</span>
          </div>
        )}

        {/* Live Counters */}
        {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN' || currentUser.role === 'CASHIER') && (
          <div className="hidden lg:flex items-center space-x-4 text-[10px] font-bold uppercase tracking-wider border-l border-r border-gray-100 px-5">
            <div>
              <p className="text-gray-400">Total Omset Hari Ini</p>
              <p className="font-extrabold text-gray-900 text-xs font-mono mt-0.5">Rp {todaySales.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-gray-400">Margin Berkah</p>
              <p className="font-extrabold text-green-700 text-xs font-mono mt-0.5">Rp {todayMargin.toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}

        {/* Notification Bell */}
        {currentUser && (
          <div className="relative">
            <button 
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsUserMenuOpen(false);
              }}
              className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {(lowStockCount > 0 || pendingUsersCount > 0 || expiringProducts.length > 0 || pendingOnlineOrdersCount > 0 || unreadNotifications.length > 0) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>
            
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-2 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm">Notifikasi</h3>
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Baru</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {unreadNotifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className="px-4 py-3 hover:bg-slate-50 border-b border-gray-50 flex items-start gap-3 cursor-pointer"
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setIsNotifOpen(false);
                          if (notif.link) window.location.hash = `#${notif.link}`;
                        }}
                      >
                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0"><Bell className="w-4 h-4"/></div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{notif.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{notif.message}</p>
                        </div>
                      </div>
                    ))}
                    
                    {pendingUsersCount > 0 && currentUser.role === 'OWNER' && (
                      <div className="px-4 py-3 hover:bg-slate-50 border-b border-gray-50 flex items-start gap-3 cursor-pointer">
                        <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0"><Users className="w-4 h-4"/></div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">Persetujuan Akun</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Ada {pendingUsersCount} staf baru menunggu persetujuan (*Approve*) dari Owner.</p>
                        </div>
                      </div>
                    )}
                    {lowStockCount > 0 && (
                      <div className="px-4 py-3 hover:bg-slate-50 border-b border-gray-50 flex items-start gap-3 cursor-pointer">
                        <div className="p-1.5 bg-red-100 text-red-700 rounded-lg shrink-0"><Database className="w-4 h-4"/></div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">Peringatan Stok Menipis</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{lowStockCount} barang telah mencapai batas minimum stok. Segera *restock*!</p>
                        </div>
                      </div>
                    )}
                    {expiringProducts.length > 0 && (
                      <div className="px-4 py-3 hover:bg-slate-50 border-b border-gray-50 flex items-start gap-3 cursor-pointer">
                        <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg shrink-0"><ShieldAlert className="w-4 h-4"/></div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">Peringatan Kedaluwarsa</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{expiringProducts.length} barang akan *expired* dalam 30 hari ke depan.</p>
                        </div>
                      </div>
                    )}
                    {pendingOnlineOrdersCount > 0 && (
                      <div className="px-4 py-3 hover:bg-slate-50 border-b border-gray-50 flex items-start gap-3 cursor-pointer" onClick={() => { setIsNotifOpen(false); window.location.hash = '#/online-orders'; }}>
                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0"><ShoppingBag className="w-4 h-4"/></div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">Pesanan Online Baru</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Ada {pendingOnlineOrdersCount} pesanan online baru yang menunggu diproses.</p>
                        </div>
                      </div>
                    )}
                    {lowStockCount === 0 && pendingUsersCount === 0 && expiringProducts.length === 0 && pendingOnlineOrdersCount === 0 && unreadNotifications.length === 0 && (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs text-gray-400">Belum ada notifikasi baru</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* User Identity Display */}
        {currentUser && (
          <div className="relative">
            <button 
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotifOpen(false);
              }}
              className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 px-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 cursor-pointer"
            >
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-green-800" />
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <p className="text-[10px] font-extrabold text-gray-800 font-sans tracking-wide uppercase">{currentUser.name}</p>
                <p className="text-[8px] text-gray-500 font-mono italic">
                  {currentUser.role} • {userBranchName}
                </p>
                {currentUser.phone && (
                  <p className="text-[9px] text-green-700 font-bold mt-0.5">
                    <a href={`https://wa.me/${currentUser.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" className="underline">Hubungi via WA</a>
                  </p>
                )}
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
                    <div className="mt-2 flex items-center space-x-1 text-[10px] text-green-700 font-semibold bg-green-50 px-2 py-1 rounded">
                      <Building className="w-3 h-3" />
                      <span>{userBranchName}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors font-medium border-b border-gray-50 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-green-600" />
                    <span>Ubah Kata Sandi</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("Apakah Anda yakin ingin keluar dari sistem? Anda harus login kembali setelah ini.")) {
                        setIsUserMenuOpen(false);
                        logout();
                      }
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
            <Building className="w-3 h-3 text-green-700" />
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
              <Calendar className="w-3.5 h-3.5 text-green-700" />
              <span>{time.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center space-x-1 justify-end text-gray-500 font-mono mt-0.5 font-semibold text-[9px]">
              <Clock className="w-3 h-3 text-green-600" />
              <span>{time.toLocaleTimeString('id-ID', { hour12: false })} WIB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="bg-green-700 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Ubah Kata Sandi
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="hover:bg-green-600 p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Masukkan sandi baru..."
                  minLength={4}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
