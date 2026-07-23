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
  Package,
  HelpCircle,
  Newspaper,
  Smartphone
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
  const { currentUser, logout, users, settings, onlineOrders, products, attendances } = useAppStore();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  
  const effectiveIsCollapsed = isCollapsed && !isHovered;

  const pendingUsersCount = users?.filter(u => !u.isApproved).length || 0;
  const pendingOrdersCount = onlineOrders?.filter(o => o.status === 'PENDING').length || 0;
  const lowStockCount = products?.filter(p => !p.isPPOB && p.stock <= p.minStock).length || 0;
  const pendingCorrectionsCount = (attendances as any[])?.filter(a => a.correctionStatus === 'PENDING').length || 0;

  const notifications = useAppStore(state => state.notifications);
  const currentUserLocal = useAppStore(state => state.currentUser);
  const unreadNotificationsCount = (notifications || []).filter(n => {
    if (n.isRead) return false;
    if (n.excludeUsernames && currentUserLocal?.username && n.excludeUsernames.includes(currentUserLocal.username)) return false;
    if (n.targetRole) {
      const roles = Array.isArray(n.targetRole) ? n.targetRole : [n.targetRole];
      if (!roles.includes(currentUserLocal?.role as any)) return false;
    }
    if (n.branchId && currentUserLocal?.branchId && n.branchId !== currentUserLocal.branchId) return false;
    return true;
  }).length || 0;

  // Auto-expand group if current path is inside it
  useEffect(() => {
    if (!currentUser) return;
    
    // We recreate the menu logic here just for the check, or we can use the rendered menuData
    // Since we need menuData, we can do the check below after menuData is defined.
  }, [location.pathname, currentUser]);

  if (!currentUser) return null;

  let menuData: MenuData = [];

  if (currentUser.role === 'OWNER' || currentUser.role === 'SUPERADMIN' || currentUser.role === 'PENGURUS' || currentUser.role === 'MANAGER') {
    menuData = [
      {
        label: 'Transaksi',
        icon: ShoppingCart,
        items: [
          { path: '/kasir', label: 'Belanja Produk', icon: ShoppingCart },
          { path: '/kasir-riwayat', label: 'Riwayat Transaksi', icon: History },
          { path: '/online-orders', label: 'Pesanan Online', icon: ShoppingBag, badge: pendingOrdersCount },
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
          { path: '/zakat', label: 'Zakat & ESG', icon: Calculator },
        ]
      },
      {
        label: 'Akuntansi & CoA',
        icon: BookOpen,
        items: [
          { path: '/jurnal-umum', label: 'Jurnal Umum', icon: BookOpen },
          { path: '/buku-besar', label: 'Buku Besar', icon: BookOpen },
          { path: '/coa', label: 'Daftar Akun (CoA)', icon: BookOpen },
        ]
      },
      {
        label: 'Inventory & Stok',
        icon: Package,
        items: [
          { path: '/inventory', label: 'Inventory Barang Fisik', icon: Boxes, badge: lowStockCount },
          { path: '/inventory-ppob', label: 'Produk PPOB & Digital', icon: Smartphone },
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
          { path: '/loyalty', label: 'Program Loyalitas Poin', icon: Tag },
          { path: '/promos', label: 'Promo Transaksi', icon: Tag },
          { path: '/promo-produk', label: 'Promo Produk', icon: Tag },
        ]
      },
      {
        label: 'Tata Kelola',
        icon: Settings,
        items: [
          { path: '/struktur-organisasi', label: 'Struktur Organisasi', icon: Users },
          { path: '/staff', label: 'Manajemen Karyawan (HR)', icon: UserCheck, badge: pendingCorrectionsCount },
          { path: '/admin-management', label: 'Akses & Akun Pengguna', icon: Users, badge: pendingUsersCount },
          { path: '/audit-log', label: 'Audit Log Sistem', icon: ShieldCheck },
          { path: '/settings', label: 'Pengaturan Toko', icon: Settings },
        ]
      },
      {
        label: 'Pusat Bantuan',
        icon: HelpCircle,
        items: [
          { path: '/buku-panduan', label: 'Buku Panduan', icon: BookOpen },
        ]
      }
    ];

  } else if (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF_GUDANG' || currentUser.role === 'STAFF_LAPANGAN') {
    menuData = [
      {
        label: 'Transaksi',
        icon: ShoppingCart,
        items: [
          { path: '/kasir', label: 'Belanja Produk', icon: ShoppingCart },
          { path: '/absen', label: 'Absensi Karyawan', icon: UsersRound },
          { path: '/kasir-riwayat', label: 'Riwayat Transaksi', icon: History },
          { path: '/online-orders', label: 'Pesanan Online', icon: ShoppingBag },
        ]
      },
      {
        label: 'Laporan Keuangan',
        icon: PieChart,
        items: [
          { path: '/trend', label: 'Grafik Trend', icon: LineChart },
          { path: '/laporan-penjualan', label: 'Laporan Penjualan', icon: TrendingUp },
          { path: '/arus-kas', label: 'Laporan Arus Kas', icon: Wallet },
        ]
      },
      {
        label: 'Akuntansi & CoA',
        icon: BookOpen,
        items: [
          { path: '/jurnal-umum', label: 'Jurnal Umum', icon: BookOpen },
          { path: '/buku-besar', label: 'Buku Besar', icon: BookOpen },
          { path: '/coa', label: 'Daftar Akun (CoA)', icon: BookOpen },
        ]
      },
      {
        label: 'Inventory & Stok',
        icon: Package,
        items: [
          { path: '/inventory', label: 'Inventory Barang Fisik', icon: Boxes },
          { path: '/inventory-ppob', label: 'Produk PPOB & Digital', icon: Smartphone },
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
          { path: '/loyalty', label: 'Program Loyalitas Poin', icon: Tag },
          { path: '/promos', label: 'Promo Transaksi', icon: Tag },
          { path: '/promo-produk', label: 'Promo Produk', icon: Tag },
        ]
      },
      ...(currentUser.role === 'ADMIN' ? [{
        label: 'Tata Kelola',
        icon: Settings,
        items: [
          { path: '/struktur-organisasi', label: 'Struktur Organisasi', icon: Users },
          { path: '/staff', label: 'Manajemen Karyawan (HR)', icon: UserCheck, badge: pendingCorrectionsCount },
          { path: '/admin-management', label: 'Akses & Akun Pengguna', icon: Users, badge: pendingUsersCount },
          { path: '/audit-log', label: 'Audit Log Sistem', icon: ShieldCheck },
          { path: '/settings', label: 'Pengaturan Toko', icon: Settings },
        ]
      }] : []),
      {
        label: 'Pusat Bantuan',
        icon: HelpCircle,
        items: [
          { path: '/buku-panduan', label: 'Buku Panduan', icon: BookOpen },
        ]
      }
    ];

  } else if (currentUser.role === 'PELANGGAN') {
    // Customer / Member portal - very limited menu
    menuData = [
      {
        label: 'Pelanggan',
        icon: UsersRound,
        items: [
          { path: '/member', label: 'Portal Pelanggan', icon: UsersRound },
          { path: '/katalog', label: 'Katalog Produk', icon: ShoppingBag },
          { path: '/berita', label: 'Berita & Pengumuman', icon: Newspaper },
          { path: '/buku-panduan', label: 'Buku Panduan', icon: BookOpen }
        ]
      }
    ];
  } else {
    // CASHIER
    menuData = [
      {
        label: 'Transaksi',
        icon: ShoppingCart,
        items: [
          { path: '/kasir', label: 'Belanja Produk', icon: ShoppingCart },
          { path: '/absen', label: 'Absensi Karyawan', icon: UsersRound },
          { path: '/kasir-riwayat', label: 'Riwayat Transaksi', icon: History },
          { path: '/online-orders', label: 'Pesanan Online', icon: ShoppingBag },
        ]
      },
      {
        label: 'Analisa & Trend',
        icon: PieChart,
        items: [
          { path: '/trend', label: 'Grafik Trend', icon: LineChart },
        ]
      },
      {
        label: 'Informasi Perusahaan',
        icon: Store,
        items: [
          { path: '/struktur-organisasi', label: 'Struktur Organisasi', icon: Users },
        ]
      },
      {
        label: 'Pusat Bantuan',
        icon: HelpCircle,
        items: [
          { path: '/buku-panduan', label: 'Buku Panduan', icon: BookOpen },
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
      case 'OWNER': return 'Pemilik Toko';
      case 'SUPERADMIN': return 'Super Admin';
      case 'PENGURUS': return 'Pengurus Koperasi';
      case 'MANAGER': return 'Manager';
      case 'ADMIN': return 'Admin';
      case 'CASHIER': return 'Kasir';
      case 'PELANGGAN': return 'Pelanggan/Anggota';
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed md:sticky top-0 left-0 h-[100dvh] ${effectiveIsCollapsed ? 'w-20' : 'w-64'} bg-green-800 text-white flex flex-col border-r border-green-950 font-sans z-50 flex-shrink-0 select-none transition-all duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        
        {/* KSA Mart Brand Header matching screenshot exactly */}
        <div className="p-6 flex flex-col items-center border-b border-green-950 relative">
          {/* Close button on mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-green-800/40 hover:bg-green-800 text-green-100 md:hidden transition-colors"
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
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-green-300 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500"></div>
              <div className={`relative ${effectiveIsCollapsed ? 'w-10 h-10 md:w-12 md:h-12' : 'w-16 md:w-32 h-12 md:h-16'} bg-white dark:bg-slate-900 rounded-xl border border-green-600/50 shadow-xl flex items-center justify-center p-1.5 md:p-2 transform group-hover:scale-105 transition-all duration-300 overflow-hidden`}>
                {/* Clean Logo Display */}
                <img src="/ksa_mart_logo.png" alt="KSA Mart Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            {!effectiveIsCollapsed && (
              <div className="text-center transition-opacity duration-300 w-full px-2">
                <h1 className="font-extrabold text-[12px] md:text-[14px] leading-tight tracking-tight text-white drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">KSA Mart</h1>
                <div className="mt-1.5 flex justify-center w-full">
                  <p className="text-[9px] text-green-100 font-bold uppercase bg-green-900/60 py-1 px-2.5 rounded-lg border border-green-700/50 shadow-inner w-full max-w-[180px] text-center leading-snug break-words">
                    MODE: {getRoleLabel(currentUser.role)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {!effectiveIsCollapsed && <p className="px-3 text-[10px] font-bold text-gray-200/65 uppercase tracking-wider mb-2">Navigasi Fitur</p>}
          
          {menuData.map((menuItem, idx) => {
            if ('items' in menuItem) {
              const isExpanded = expandedGroups.includes(menuItem.label);
              const GroupIcon = menuItem.icon;
              const hasActiveChild = isGroupActive(menuItem.items);

              return (
                <div key={idx} className="space-y-1">
                  <button
                    onClick={() => {
                      if (effectiveIsCollapsed && onExpand) onExpand();
                      toggleGroup(menuItem.label);
                    }}
                    title={effectiveIsCollapsed ? menuItem.label : undefined}
                    className={`w-full flex items-center ${effectiveIsCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group ${
                      hasActiveChild && !isExpanded
                        ? 'bg-green-700 text-amber-400'
                        : 'text-gray-100 hover:bg-green-700/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <GroupIcon className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${effectiveIsCollapsed && hasActiveChild ? 'text-amber-400' : ''}`} />
                      {!effectiveIsCollapsed && <span className="truncate">{menuItem.label}</span>}
                    </div>
                    {!effectiveIsCollapsed && (isExpanded ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0 ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                    ))}
                  </button>

                  {/* Sub items */}
                  {isExpanded && !effectiveIsCollapsed && (
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
                                  ? 'bg-green-600 text-amber-400 font-bold shadow-sm shadow-green-950/20'
                                  : 'text-gray-300 hover:bg-green-700/40 hover:text-white'
                              }`
                            }
                          >
                            <SubIcon className="w-4 h-4 flex-shrink-0 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                            <span className="truncate flex-1">{subItem.label}</span>
                            {((subItem.path === '/customers' && unreadNotificationsCount > 0) || (subItem.badge && subItem.badge > 0)) && !effectiveIsCollapsed && (
                              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-xs">
                                {subItem.path === '/customers' ? unreadNotificationsCount : subItem.badge}
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
                  title={effectiveIsCollapsed ? menuItem.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 ${effectiveIsCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'bg-green-600 text-amber-400 font-bold shadow-sm shadow-green-950/20'
                        : 'text-gray-100 hover:bg-green-700/40 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  {!effectiveIsCollapsed && <span className="truncate flex-1">{menuItem.label}</span>}
                  {((menuItem.path === '/berita' && unreadNotificationsCount > 0) || (menuItem.badge && menuItem.badge > 0)) && !effectiveIsCollapsed && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-xs ml-auto">
                      {menuItem.path === '/berita' ? unreadNotificationsCount : menuItem.badge}
                    </span>
                  )}
                  {menuItem.badge && menuItem.badge > 0 && effectiveIsCollapsed && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500"></span>
                  )}
                </NavLink>
              );
            }
          })}
        </nav>

        {/* Keluar logout trigger aligned to bottom of sidebar */}
        <div className="p-4 border-t border-green-950 space-y-3">
          <button 
            onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin keluar dari sistem? Pastikan semua pekerjaan sudah tersimpan.")) {
                logout();
              }
            }}
            title={effectiveIsCollapsed ? 'Keluar' : undefined}
            className={`w-full flex items-center space-x-3 ${effectiveIsCollapsed ? 'justify-center' : ''} px-3 py-2.5 rounded-lg text-[13px] font-semibold text-red-100 hover:bg-red-950/40 hover:text-red-300 transition-colors group`}
          >
            <LogOut className="w-[18px] h-[18px] text-red-300 group-hover:scale-110 transition-transform duration-300" />
            {!effectiveIsCollapsed && <span>Keluar</span>}
          </button>

        </div>
      </aside>
    </>
  );
}
