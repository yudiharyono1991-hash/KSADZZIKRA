import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, Boxes, ShoppingBag, LineChart, Menu } from 'lucide-react';
import { useAppStore } from '../../store';

interface BottomNavBarProps {
  onOpenMenu: () => void;
}

export default function BottomNavBar({ onOpenMenu }: BottomNavBarProps) {
  const { onlineOrders } = useAppStore();
  const pendingOrdersCount = onlineOrders.filter(o => o.status === 'PENDING').length;

  const navItems = [
    { path: '/kasir', icon: ShoppingCart, label: 'Kasir' },
    { path: '/inventory', icon: Boxes, label: 'Produk' },
    {
      path: '/online-orders',
      icon: ShoppingBag,
      label: 'Pesanan',
      badge: pendingOrdersCount,
    },
    { path: '/laporan-penjualan', icon: LineChart, label: 'Laporan' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-stretch z-40 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all relative ${
              isActive
                ? 'text-green-600 bg-green-50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="absolute top-0 left-4 right-4 h-0.5 bg-green-500 rounded-b-full" />
              )}
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {'badge' in item && item.badge! > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {item.badge! > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
      <button
        onClick={onOpenMenu}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 transition-all"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] font-medium leading-none">Menu</span>
      </button>
    </nav>
  );
}
