import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Database,
  PieChart,
  Package
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
  onExpand?: () => void;
}

type MenuItem = {
  path: string;
  label: string;
  icon: any;
  badge?: number;
};

type MenuGroup = {
  label: string;
  icon: any;
  items: MenuItem[];
};

type MenuData = (MenuItem | MenuGroup)[];

export default function Sidebar({ isOpen = false, isCollapsed = false, onClose, onExpand }: SidebarProps) {
  const { currentUser, logout, users, settings } = useAppStore();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  
  const pendingUsersCount = users?.filter(u => !u.isApproved).length || 0;

  // Auto-expand group if current path is inside it
  useEffect(() => {
    if (!currentUser) return;
    
    // We recreate the menu logic here just for the check, or we can use the rendered menuData
    // Since we need menuData, we can do the check below after menuData is defined.
  }, [location.pathname, currentUser]);

  if (!currentUser) return null;

  let menuData: MenuData = [];

  if (currentUser.role === 'OWNER') {
    menuData = [
      {
        label: 'Kasir & Transaksi',
        icon: ShoppingCart,
        items: [
          { path: '/kasir', label: 'Kasir POS', icon: ShoppingCart },
          { path: '/kasir-riwayat', label: 'Riwayat Transaksi', icon: History },
          { path: '/kasir-shift', label: 'Tutup Shift', icon: Lock },
          { path: '/online-orders', label: 'Pesanan Online', icon: ShoppingBag },
        ]
      },
      {
        label: 'Dashboard & Laporan',
        icon: PieChart,
        items: [
          { path: '/trend', label: 'Grafik Trend', icon: LineChart },
          { path: '/neraca-rugi', label: 'Neraca Laba Rugi', icon: FileText },
          { path: '/laporan-penjualan', label: 'Laporan Penjualan', icon: TrendingUp },
          { path: '/arus-kas', label: 'Laporan Arus Kas', icon: Wallet },
          { path: '/jurnal-umum', label: 'Jurnal Umum', icon: BookOpen },
          { path: '/zakat', label: 'Zakat & ESG', icon: Calculator },
        ]
      },
      {
        label: 'Inventory & Stok',
        icon: Package,
        items: [
          { path: '/inventory', label: 'Inventory & Stok', icon: Boxes },
          { path: '/stock-opname', label: 'Stock Opname', icon: ClipboardList },
          { path: '/purchase-order', label: 'Purchase Order', icon: ShoppingBag },
        ]
      },
      {
        label: 'Data Master',
        icon: Database,
        items: [
          { path: '/cabang', label: 'Manajemen Cabang', icon: Store },
          { path: '/suppliers', label: 'Master Supplier', icon: Truck },
          { path: '/customers', label: 'Master Pelanggan', icon: UsersRound },
          { path: '/promos', label: 'Manajemen Promo', icon: Tag },
        ]
      },
      {
        label: 'Tata Kelola',
        icon: Settings,
        items: [
          { path: '/staff', label: 'Kinerja & Absensi HR', icon: UserCheck },
          { path: '/struktur-organisasi', label: 'Struktur Organisasi', icon: Users },
          { path: '/admin-management', label: 'Akses & Akun Pengguna', icon: Users, badge: pendingUsersCount },
          { path: '/audit-log', label: 'Audit Log Sistem', icon: ShieldCheck },
          { path: '/settings', label: 'Pengaturan Toko', icon: Settings },
        ]
      }
    ];

    if (settings.businessType === 'KOPERASI') {
      menuData.splice(4, 0, {
        label: 'Koperasi Syariah',
        icon: UsersRound,
        items: [
          { path: '/koperasi-anggota', label: 'Manajemen Anggota', icon: Users },
          { path: '/koperasi-shu', label: 'Pembagian SHU', icon: Wallet },
        ]
      });
    }
  } else if (currentUser.role === 'ADMIN') {
    menuData = [
      {
        label: 'Laporan Keuangan',
        icon: PieChart,
        items: [
          { path: '/laporan-penjualan', label: 'Laporan Penjualan', icon: TrendingUp },
          { path: '/arus-kas', label: 'Laporan Arus Kas', icon: Wallet },
          { path: '/jurnal-umum', label: 'Jurnal Umum', icon: BookOpen },
        ]
      },
      {
        label: 'Inventory & Stok',
        icon: Package,
        items: [
          { path: '/inventory', label: 'Inventory & Stok', icon: Boxes },
          { path: '/stock-opname', label: 'Stock Opname', icon: ClipboardList },
          { path: '/purchase-order', label: 'Purchase Order', icon: ShoppingBag },
        ]
      },
      {
        label: 'Data Master',
        icon: Database,
        items: [
          { path: '/suppliers', label: 'Master Supplier', icon: Truck },
          { path: '/customers', label: 'Master Pelanggan', icon: UsersRound },
          { path: '/promos', label: 'Manajemen Promo', icon: Tag },
        ]
      },
      {
        label: 'Kasir & Transaksi',
        icon: ShoppingCart,
        items: [
          { path: '/kasir', label: 'Kasir POS', icon: ShoppingCart },
          { path: '/kasir-riwayat', label: 'Riwayat Transaksi', icon: History },
          { path: '/kasir-shift', label: 'Tutup Shift', icon: Lock },
          { path: '/online-orders', label: 'Pesanan Online', icon: ShoppingBag },
        ]
      },
      {
        label: 'Tata Kelola',
        icon: Settings,
        items: [
          { path: '/staff', label: 'Kinerja & Absensi HR', icon: UserCheck },
          { path: '/struktur-organisasi', label: 'Struktur Organisasi', icon: Users },
          { path: '/admin-management', label: 'Akses & Akun Pengguna', icon: Users, badge: pendingUsersCount },
          { path: '/audit-log', label: 'Audit Log Sistem', icon: ShieldCheck },
          { path: '/settings', label: 'Pengaturan Toko', icon: Settings },
        ]
      }
    ];

    if (settings.businessType === 'KOPERASI') {
      menuData.splice(4, 0, {
        label: 'Koperasi Syariah',
        icon: UsersRound,
        items: [
          { path: '/koperasi-anggota', label: 'Manajemen Anggota', icon: Users },
          { path: '/koperasi-shu', label: 'Pembagian SHU', icon: Wallet },
        ]
      });
    }
  } else {
    // CASHIER
    menuData = [
      {
        label: 'Kasir & Transaksi',
        icon: ShoppingCart,
        items: [
          { path: '/kasir', label: 'Kasir POS', icon: ShoppingCart },
          { path: '/kasir-riwayat', label: 'Riwayat Transaksi', icon: History },
          { path: '/kasir-shift', label: 'Tutup Shift', icon: Lock },
        ]
      },
      {
        label: 'Informasi Perusahaan',
        icon: Store,
        items: [
          { path: '/struktur-organisasi', label: 'Struktur Organisasi', icon: Users },
        ]
      }
    ];
  }

  const isGroupActive = (items: MenuItem[]) => {
    return items.some(item => location.pathname.startsWith(item.path));
  };

  // Perform auto-expand check
  useEffect(() => {
    menuData.forEach(menu => {
      if ('items' in menu) {
        if (isGroupActive(menu.items) && !expandedGroups.includes(menu.label)) {
          setExpandedGroups(prev => [...prev, menu.label]);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupLabel) 
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    );
  };

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
        className={`fixed md:sticky top-0 left-0 h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-[#135d25] text-white flex flex-col border-r border-[#0e441b] font-sans z-50 flex-shrink-0 select-none transition-all duration-300 ease-in-out md:translate-x-0 ${
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

          <div className="flex flex-col items-center space-y-3 mt-2">
            {/* Modern App Icon Logo */}
            <div 
              className="relative group cursor-pointer" 
              onClick={onExpand}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-emerald-300 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl border border-emerald-600/50 shadow-xl flex items-center justify-center overflow-hidden transform group-hover:scale-105 transition duration-300">
                {/* Geometric pattern background */}
                <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[length:4px_4px]"></div>
                
                {/* Shop Roof Decoration */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 opacity-50">
                  <Store className="w-3.5 h-3.5 text-emerald-100 drop-shadow-md" />
                </div>
                
                {/* Logo */}
                <div className="flex items-center justify-center z-10 drop-shadow-md mt-1.5">
                  <img src="/ksa_mart_logo.png" alt="KSA Mart Logo" className="h-10 w-auto object-contain" />
                </div>
                
                {/* Text indicator replacing Store Icon */}
                <div className="absolute bottom-1 right-1.5 flex flex-col items-end opacity-95 leading-none">
                  <span className="text-[4.5px] text-emerald-100 font-black tracking-widest uppercase">Mart Syariah</span>
                  <span className="text-[4px] text-amber-400 font-bold tracking-[0.2em] mt-[1px]">@INDONESIA</span>
                </div>
              </div>
            </div>

            {!isCollapsed && (
              <div className="text-center transition-opacity duration-300 w-full px-2">
                <h1 className="font-extrabold text-[10px] md:text-[12px] leading-tight tracking-tight text-white drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">Koperasi Syariah KSA Mart</h1>
                <p className="text-[9px] text-emerald-100 font-bold tracking-[0.2em] uppercase mt-1 bg-emerald-900/60 py-0.5 px-2 rounded-full border border-emerald-700/50 inline-block shadow-inner">
                  {getRoleLabel(currentUser.role)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && <p className="px-3 text-[10px] font-bold text-gray-200/65 uppercase tracking-wider mb-2">Navigasi Fitur</p>}
          
          {menuData.map((menuItem, idx) => {
            if ('items' in menuItem) {
              const isExpanded = expandedGroups.includes(menuItem.label);
              const GroupIcon = menuItem.icon;
              const hasActiveChild = isGroupActive(menuItem.items);

              return (
                <div key={idx} className="space-y-1">
                  <button
                    onClick={() => {
                      if (isCollapsed && onExpand) onExpand();
                      toggleGroup(menuItem.label);
                    }}
                    title={isCollapsed ? menuItem.label : undefined}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group ${
                      hasActiveChild && !isExpanded
                        ? 'bg-[#1b5e20] text-amber-400'
                        : 'text-gray-100 hover:bg-emerald-800/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <GroupIcon className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isCollapsed && hasActiveChild ? 'text-amber-400' : ''}`} />
                      {!isCollapsed && <span className="truncate">{menuItem.label}</span>}
                    </div>
                    {!isCollapsed && (isExpanded ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0 ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                    ))}
                  </button>

                  {/* Sub items */}
                  {isExpanded && !isCollapsed && (
                    <div className="pl-3 space-y-1 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {menuItem.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                              `flex items-center space-x-3 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 group ${
                                isActive
                                  ? 'bg-[#388e3c] text-amber-400 font-bold shadow-sm shadow-emerald-950/20'
                                  : 'text-gray-300 hover:bg-emerald-800/40 hover:text-white'
                              }`
                            }
                          >
                            <SubIcon className="w-4 h-4 flex-shrink-0 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                            <span className="truncate flex-1">{subItem.label}</span>
                            {subItem.badge && subItem.badge > 0 && !isCollapsed && (
                              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-xs">
                                {subItem.badge}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              const Icon = menuItem.icon;
              return (
                <NavLink
                  key={menuItem.path}
                  to={menuItem.path}
                  onClick={onClose}
                  title={isCollapsed ? menuItem.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#388e3c] text-amber-400 font-bold shadow-sm shadow-emerald-950/20'
                        : 'text-gray-100 hover:bg-emerald-800/40 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  {!isCollapsed && <span className="truncate flex-1">{menuItem.label}</span>}
                  {menuItem.badge && menuItem.badge > 0 && !isCollapsed && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-xs ml-auto">
                      {menuItem.badge}
                    </span>
                  )}
                  {menuItem.badge && menuItem.badge > 0 && isCollapsed && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500"></span>
                  )}
                </NavLink>
              );
            }
          })}
        </nav>

        {/* Keluar logout trigger aligned to bottom of sidebar */}
        <div className="p-4 border-t border-[#0e441b] space-y-3">
          <button 
            onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin keluar dari sistem? Pastikan semua pekerjaan sudah tersimpan.")) {
                logout();
              }
            }}
            title={isCollapsed ? 'Keluar' : undefined}
            className={`w-full flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg text-[13px] font-semibold text-red-100 hover:bg-red-950/40 hover:text-red-300 transition-colors group`}
          >
            <LogOut className="w-[18px] h-[18px] text-red-300 group-hover:scale-110 transition-transform duration-300" />
            {!isCollapsed && <span>Keluar</span>}
          </button>

          {!isCollapsed && (
            <p className="text-[10px] text-gray-200/50 text-center font-bold font-sans tracking-wide">
              v1.0 © 2026 IT Development<br/>
              BA Mart Syariah POS
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
