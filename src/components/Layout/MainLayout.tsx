import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCcw } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNavBar from './BottomNavBar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, [location.pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setHasUpdate(true);
      });
      const interval = setInterval(() => {
        navigator.serviceWorker.ready.then(reg => {
          reg.update();
        });
      }, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div id="shariahpos-root" className="flex bg-slate-50 dark:bg-slate-800 h-[100dvh] text-slate-800 dark:text-slate-200 antialiased overflow-hidden">
      {/* Sidebar — slides over content on mobile, static on desktop */}
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        onExpand={() => setIsSidebarCollapsed(false)}
      />

      {/* Main content panel */}
      <div id="main-content-panel" className="flex-1 flex flex-col min-w-0 w-full h-[100dvh] overflow-hidden transition-all duration-300">

        {/* ─── STICKY HEADER ─────────────────────────────────────── */}
        <TopBar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleDesktopSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* ─── SCROLLABLE CENTER ─────────────────────────────────── */}
        {/* 
          overflow-auto: scroll both x and y as needed
          pb-16 md:pb-0: bottom padding on mobile for BottomNavBar space
        */}
        <main
          id="main-scroll-container"
          className="flex-1 p-3 md:p-6 overflow-auto flex flex-col relative pb-20 md:pb-6"
        >
          {children}
        </main>
        
        {/* ─── GLOBAL FOOTER ─────────────────────────────────────── */}
        <footer className="bg-[#1e3a2b] text-white py-1.5 px-4 text-[10px] md:text-xs flex justify-between items-center z-40 hidden md:flex border-t border-[#0e441b] shrink-0">
          <span>Copyright &copy; Team Development KSA Mart 2026. All rights reserved.</span>
          <span>ver 1.0</span>
        </footer>
      </div>

      {/* ─── MOBILE BOTTOM NAV BAR (STICKY FOOTER) ─────────────── */}
      <BottomNavBar onOpenMenu={() => setIsSidebarOpen(true)} />

      {/* Update notification banner */}
      {hasUpdate && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-slate-800 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 max-w-xs">
          <div>
            <p className="font-bold text-sm">Versi Sistem Baru Tersedia!</p>
            <p className="text-xs text-slate-300 mt-0.5">Harap muat ulang untuk menerapkan pembaruan stabilitas.</p>
          </div>
          <button onClick={handleUpdate} className="bg-indigo-500 hover:bg-indigo-600 px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 shrink-0">
            <RefreshCcw className="w-4 h-4" /> Reload
          </button>
        </div>
      )}
    </div>
  );
}

