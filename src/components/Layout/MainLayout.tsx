import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div id="shariahpos-root" className="flex bg-slate-50 min-h-screen text-slate-800 antialiased relative overflow-x-hidden">
      {/* Structural Sidebar wrapper */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Content wrapper panel */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top bar header */}
        <TopBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        {/* Nested route space container */}
        <main className="flex-1 p-3 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
