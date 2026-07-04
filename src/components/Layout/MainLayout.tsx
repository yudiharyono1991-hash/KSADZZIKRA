import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCcw } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop
  const location = useLocation();

  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, [location.pathname]);

  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Detect Service Worker Updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setHasUpdate(true);
      });
      
      // Also poll every 1 hour just in case
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
    <div id="shariahpos-root" className="flex bg-slate-50 h-screen text-slate-800 antialiased overflow-hidden">
      {/* Structural Sidebar wrapper */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)} 
        onExpand={() => setIsSidebarCollapsed(false)}
      />
      
      {/* Content wrapper panel */}
      <div className="flex-1 flex flex-col min-w-0 w-full h-screen overflow-hidden transition-all duration-300">
        {/* Top bar header */}
        <TopBar 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onToggleDesktopSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        {/* Nested route space container */}
        <main id="main-scroll-container" className="flex-1 p-3 md:p-6 overflow-y-auto flex flex-col relative">
          {children}
        </main>
      </div>

      {hasUpdate && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div>
            <p className="font-bold">Versi Sistem Baru Tersedia!</p>
            <p className="text-xs text-slate-300">Harap muat ulang untuk menerapkan pembaruan stabilitas.</p>
          </div>
          <button onClick={handleUpdate} className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
            <RefreshCcw className="w-4 h-4"/> Muat Ulang
          </button>
        </div>
      )}
    </div>
  );
}
