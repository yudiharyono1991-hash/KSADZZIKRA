import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import { useAppStore } from './store';
import {
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
  KasirShiftPage,
  CustomerManagementPage,
  SupplierManagementPage,
  PromoManagementPage,
  StaffManagementPage,
  SettingsPage,
  StockOpnamePage
} from './pages';

export default function App() {
  const { currentUser, initializeStore, isLoading } = useAppStore();

  useEffect(() => {
    // Attempt startup Supabase pull
    initializeStore();
  }, [initializeStore]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-emerald-950 flex flex-col justify-center items-center text-white">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-mono tracking-wider font-semibold">Mensinkronisasikan Data Supabase Syariah...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <HashRouter>
      <MainLayout>
        <Routes>
          {/* Default Base Route redirecting to KasirPOS */}
          <Route path="/" element={<Navigate to="/kasir" replace />} />
          
          {/* Active Navigation Routes */}
          <Route path="/kasir" element={<KasirPOS />} />
          <Route path="/kasir-riwayat" element={<KasirRiwayatPage />} />
          <Route path="/kasir-shift" element={<KasirShiftPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/trend" element={<TrendPage />} />
          <Route path="/laporan-penjualan" element={<SalesReportPage />} />
          <Route path="/jurnal-umum" element={<JurnalUmumPage />} />
          <Route path="/arus-kas" element={<ArusKasPage />} />
          <Route path="/neraca-rugi" element={<NeracaRugiPage />} />
          <Route path="/zakat" element={<ZakatPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/admin-management" element={<AdminManagementPage />} />
          <Route path="/cabang" element={<BranchManagementPage />} />
          <Route path="/purchase-order" element={<PurchaseOrderPage />} />
          <Route path="/customers" element={<CustomerManagementPage />} />
          <Route path="/suppliers" element={<SupplierManagementPage />} />
          <Route path="/promos" element={<PromoManagementPage />} />
          <Route path="/stock-opname" element={<StockOpnamePage />} />
          <Route path="/staff" element={<StaffManagementPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Fallback Catch-all Route redirecting to home */}
          <Route path="*" element={<Navigate to="/kasir" replace />} />
        </Routes>
      </MainLayout>
    </HashRouter>
  );
}

