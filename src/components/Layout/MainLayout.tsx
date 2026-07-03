import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
        <main id="main-scroll-container" className="flex-1 p-3 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
