import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import { useAppStore } from './store';
import { isSupabaseConfigured, subscribeToTable } from './lib/supabase';
import {
  LandingPage,
  KasirPOS,
  InventoryPage,
  TrendPage,
  SalesReportPage,
  JurnalUmumPage,
  ArusKasPage,
  ZakatPage,
  AuditLogPage,
  NeracaRugiPage,
  AdminManagementPage,
  PurchaseOrderPage,
  BranchManagementPage,
  KasirRiwayatPage,
  CustomerManagementPage,
  SupplierManagementPage,
  PromoManagementPage,
  StaffManagementPage,
  SettingsPage,
  StockOpnamePage,
  StrukturOrganisasiPage,
  CustomerPortal,
  OnlineOrdersPage,
  QuranPage,
  JadwalShalatPage,
  ArtikelIslamiPage,
  BukuPanduanPage,
  RegisterPage,
  KatalogUmumPage,
  CoAPage,
  BeritaPusatPage,
  LoyaltyProgramPage,
  PPOBInventoryPage
} from './pages';

// Komponen pembungkus untuk route yang membutuhkan otentikasi
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, settings } = useAppStore();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser.role === 'PELANGGAN') {
    return <Navigate to="/member" replace />;
  }
  if (settings?.maintenanceMode && currentUser.role !== 'OWNER' && currentUser.role !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center text-white p-6 text-center">
        <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black mb-2">Mode Pemeliharaan</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          Sistem saat ini sedang dalam perbaikan atau rekonsiliasi data oleh Owner. Anda telah diputus secara otomatis untuk mencegah inkonsistensi transaksi. Silakan hubungi Owner.
        </p>
        <button 
          onClick={() => {
            localStorage.removeItem('ksa_current_user');
            window.location.href = '/';
          }}
          className="bg-indigo-600 hover:bg-indigo-700 font-bold py-3 px-8 rounded-xl"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }
  
  return <MainLayout>{children}</MainLayout>;
};

export default function App() {
  const { initializeStore, isLoading } = useAppStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        // Attempt startup Supabase pull with retry logic
        await initializeStore();

        // Avoid triggering a full bulk background sync immediately on every page load.
        // Background sync is still available manually from settings when the user wants to
        // push offline changes to Supabase without blocking startup.
      } catch (err) {
        console.error('App initialization error:', err);
      }
    };

    initApp();

    // Register realtime subscriptions to refresh store when remote changes occur
    let unsubscribers: Array<() => void> = [];
    let syncTimeoutId: any = null;
    let lastSyncTime = 0;

    const throttledSync = () => {
      const now = Date.now();
      if (now - lastSyncTime > 10000) {
        // Run immediately if more than 10s have passed
        lastSyncTime = now;
        initializeStore({ showLoading: false }).catch(e => console.warn('Realtime sync error:', e));
      } else {
        // Otherwise wait for things to settle
        if (syncTimeoutId) clearTimeout(syncTimeoutId);
        syncTimeoutId = setTimeout(() => {
          lastSyncTime = Date.now();
          initializeStore({ showLoading: false }).catch(e => console.warn('Realtime sync error:', e));
        }, 3000);
      }
    };

    if (isSupabaseConfigured) {
      try {
        unsubscribers.push(subscribeToTable('products', () => {
          console.log('[Realtime] Products updated');
          throttledSync();
        }));
        unsubscribers.push(subscribeToTable('store_settings', () => {
          console.log('[Realtime] Settings updated');
          throttledSync();
        }));
        unsubscribers.push(subscribeToTable('online_orders', () => {
          console.log('[Realtime] Orders updated');
          throttledSync();
        }));
      } catch (e) {
        console.warn('Realtime subscription setup failed:', e);
      }
    }

    return () => {
      unsubscribers.forEach(unsub => {
        try { unsub(); } catch (e) {}
      });
    };
  }, [initializeStore]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-950 flex flex-col justify-center items-center text-white">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-mono tracking-wider font-semibold">Mensinkronisasikan Data Supabase Syariah...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/katalog" element={<KatalogUmumPage />} />
        <Route path="/member" element={<CustomerPortal />} />
        <Route path="/quran" element={<QuranPage />} />
        <Route path="/jadwal-shalat" element={<JadwalShalatPage />} />
        <Route path="/artikel-islami" element={<ArtikelIslamiPage />} />
        
        <Route path="/berita" element={<BeritaPusatPage />} />
        
        {/* Protected Navigation Routes with MainLayout (Admin/Cashier) */}
        <Route path="/kasir" element={<ProtectedRoute><KasirPOS /></ProtectedRoute>} />
        <Route path="/kasir-riwayat" element={<ProtectedRoute><KasirRiwayatPage /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
        <Route path="/inventory-ppob" element={<ProtectedRoute><PPOBInventoryPage /></ProtectedRoute>} />
        <Route path="/trend" element={<ProtectedRoute><TrendPage /></ProtectedRoute>} />
        <Route path="/laporan-penjualan" element={<ProtectedRoute><SalesReportPage /></ProtectedRoute>} />
        <Route path="/jurnal-umum" element={<ProtectedRoute><JurnalUmumPage /></ProtectedRoute>} />
        <Route path="/coa" element={<ProtectedRoute><CoAPage /></ProtectedRoute>} />
        <Route path="/arus-kas" element={<ProtectedRoute><ArusKasPage /></ProtectedRoute>} />
        <Route path="/neraca-rugi" element={<ProtectedRoute><NeracaRugiPage /></ProtectedRoute>} />
        <Route path="/zakat" element={<ProtectedRoute><ZakatPage /></ProtectedRoute>} />
        <Route path="/audit-log" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
        <Route path="/admin-management" element={<ProtectedRoute><AdminManagementPage /></ProtectedRoute>} />
        <Route path="/loyalty" element={<ProtectedRoute><LoyaltyProgramPage /></ProtectedRoute>} />
        <Route path="/cabang" element={<ProtectedRoute><BranchManagementPage /></ProtectedRoute>} />
        <Route path="/purchase-order" element={<ProtectedRoute><PurchaseOrderPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomerManagementPage /></ProtectedRoute>} />
        <Route path="/online-orders" element={<ProtectedRoute><OnlineOrdersPage /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><SupplierManagementPage /></ProtectedRoute>} />
        <Route path="/promos" element={<ProtectedRoute><PromoManagementPage /></ProtectedRoute>} />
        <Route path="/stock-opname" element={<ProtectedRoute><StockOpnamePage /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><StaffManagementPage /></ProtectedRoute>} />
        <Route path="/struktur-organisasi" element={<ProtectedRoute><StrukturOrganisasiPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        
        {/* Berita Koperasi */}
        <Route path="/berita-koperasi" element={
          <ProtectedRoute>
            <BeritaPusatPage />
          </ProtectedRoute>
        } />

        {/* Buku Panduan */}
        <Route path="/buku-panduan" element={<ProtectedRoute><BukuPanduanPage /></ProtectedRoute>} />
        
        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
