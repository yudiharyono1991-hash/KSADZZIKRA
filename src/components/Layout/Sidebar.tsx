import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store';
import { 
  ShoppingCart, 
  Boxes, 
  LineChart, 
  TrendingUp, 
  ShieldCheck, 
  Calculator, 
  LogOut,
  Store,
  FileText,
  X,
  BookOpen,
  Wallet,
  Users,
  ShoppingBag,
  History,
  Lock,
  UsersRound,
  Truck,
  Tag,
  UserCheck,
  Settings,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { currentUser, logout } = useAppStore();

  if (!currentUser) return null;

  // Definisi menu per Role agar urutannya sesuai standar penggunaan operasional
  let visibleMenuItems: Array<{path: string, label: string, icon: any}> = [];

  if (currentUser.role === 'OWNER') {
    visibleMenuItems = [
      // Dashboard & Laporan Tertinggi
      { path: '/trend', label: 'Grafik Trend', icon: LineChart },
      { path: '/cabang', label: 'Manajemen Cabang', icon: Store },
      { path: '/neraca-rugi', label: 'Neraca Laba Rugi', icon: FileText },
      { path: '/laporan-penjualan', label: 'Laporan Penjualan', icon: TrendingUp },
      { path: '/arus-kas', label: 'Laporan Arus Kas', icon: Wallet },
      { path: '/jurnal-umum', label: 'Jurnal Umum', icon: BookOpen },
      { path: '/zakat', label: 'Zakat & ESG', icon: Calculator },
      
      // Operasional & Master
      { path: '/inventory', label: 'Inventory & Stok', icon: Boxes },
      { path: '/stock-opname', label: 'Stock Opname', icon: ClipboardList },
      { path: '/purchase-order', label: 'Purchase Order', icon: ShoppingBag },
      { path: '/suppliers', label: 'Master Supplier', icon: Truck },
      { path: '/customers', label: 'Master Pelanggan', icon: UsersRound },
      { path: '/promos', label: 'Manajemen Promo', icon: Tag },
      
      // Kasir & Transaksi (sebagai fungsi tambahan owner)
      { path: '/kasir', label: 'Kasir POS', icon: ShoppingCart },
      { path: '/kasir-riwayat', label: 'Riwayat Transaksi', icon: History },
      { path: '/kasir-shift', label: 'Tutup Shift', icon: Lock },
      
      // Tata Kelola
      { path: '/staff', label: 'Manajemen HR/Staff', icon: UserCheck },
      { path: '/admin-management', label: 'Manajemen Admin', icon: Users },
      { path: '/audit-log', label: 'Audit Log Sistem', icon: ShieldCheck },
      { path: '/settings', label: 'Pengaturan Toko', icon: Settings },
    ];
  } else if (currentUser.role === 'ADMIN') {
    visibleMenuItems = [
      // Operasional & Pembelian Utama
      { path: '/inventory', label: 'Inventory & Stok', icon: Boxes },
      { path: '/stock-opname', label: 'Stock Opname', icon: ClipboardList },
      { path: '/purchase-order', label: 'Purchase Order', icon: ShoppingBag },
      { path: '/suppliers', label: 'Master Supplier', icon: Truck },
      { path: '/customers', label: 'Master Pelanggan', icon: UsersRound },
      { path: '/promos', label: 'Manajemen Promo', icon: Tag },
      
      // Laporan Rutin Admin
      { path: '/laporan-penjualan', label: 'Laporan Penjualan', icon: TrendingUp },
      { path: '/arus-kas', label: 'Laporan Arus Kas', icon: Wallet },
      { path: '/jurnal-umum', label: 'Jurnal Umum', icon: BookOpen },
      
      // Akses Kasir
      { path: '/kasir', label: 'Kasir POS', icon: ShoppingCart },
      { path: '/kasir-riwayat', label: 'Riwayat Transaksi', icon: History },
      { path: '/kasir-shift', label: 'Tutup Shift', icon: Lock },
      
      // Tata Kelola
      { path: '/staff', label: 'Manajemen HR/Staff', icon: UserCheck },
      { path: '/admin-management', label: 'Manajemen Admin', icon: Users },
      { path: '/audit-log', label: 'Audit Log Sistem', icon: ShieldCheck },
      { path: '/settings', label: 'Pengaturan Toko', icon: Settings },
    ];
  } else {
    // CASHIER
    visibleMenuItems = [
      { path: '/kasir', label: 'Kasir POS', icon: ShoppingCart },
      { path: '/kasir-riwayat', label: 'Riwayat Transaksi', icon: History },
      { path: '/kasir-shift', label: 'Tutup Shift', icon: Lock },
    ];
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER': return 'Owner Mode';
      case 'ADMIN': return 'Admin Mode';
      case 'CASHIER': return 'Cashier Mode';
      default: return 'User';
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile devices */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      <aside 
        id="app-sidebar" 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#135d25] text-white flex flex-col border-r border-[#0e441b] font-sans z-50 flex-shrink-0 select-none transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        
        {/* BA Mart Brand Header matching screenshot exactly */}
        <div className="p-6 flex flex-col items-center border-b border-[#0e441b] relative">
          {/* Close button on mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-emerald-800/40 hover:bg-emerald-800 text-emerald-100 md:hidden transition-colors"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col items-center space-y-2 mt-2">
            {/* Logo mosque/shop */}
            <div className="w-14 h-14 rounded-full bg-[#1b5e20] border-[3px] border-amber-400 flex items-center justify-center shadow-lg">
              <Store className="w-7 h-7 text-amber-400" />
            </div>
            <div className="text-center">
              <h1 className="font-extrabold text-xl tracking-tight text-white">BA Mart</h1>
              <p className="text-[10px] text-gray-200/80 font-bold tracking-widest uppercase mt-0.5">
                {getRoleLabel(currentUser.role)}
              </p>
            </div>
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-gray-200/65 uppercase tracking-wider mb-4">Navigasi Fitur</p>
          
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3.5 px-3.5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                    isActive
                      ? 'bg-[#388e3c] text-amber-400 font-black shadow-md shadow-emerald-950/30'
                      : 'text-gray-100 hover:bg-emerald-800/40 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Keluar logout trigger aligned to bottom of sidebar */}
        <div className="p-4 border-t border-[#0e441b] space-y-3">
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-red-100 hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-300" />
            <span>Keluar</span>
          </button>

          <p className="text-[10px] text-gray-200/50 text-center font-bold font-sans tracking-wide">
            v1.0 © 2026 IT Development<br/>
            BA Mart Syariah POS
          </p>
        </div>
      </aside>
    </>
  );
}
