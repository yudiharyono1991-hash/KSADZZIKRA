import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import { useAppStore } from './store';
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
  KoperasiAnggotaPage,
  KoperasiSHUPage,
  KoperasiPembiayaanPage,
  KoperasiKeuanganPage,
  BukuPanduanPage,
  RegisterPage,
  KatalogUmumPage,
  CoAPage,
  BeritaPusatPage,
  LoyaltyProgramPage
} from './pages';

// Komponen pembungkus untuk route yang membutuhkan otentikasi
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAppStore();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser.role === 'PELANGGAN') {
    return <Navigate to="/member" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
};

export default function App() {
  const { initializeStore, isLoading } = useAppStore();

  useEffect(() => {
    // Attempt startup Supabase pull
    initializeStore();
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
          <ProtectedRoute allowedRoles={['CASHIER', 'ADMIN', 'OWNER']}>
            <BeritaPusatPage />
          </ProtectedRoute>
        } />

        {/* Koperasi Syariah Routes */}
        <Route path="/koperasi-anggota" element={<ProtectedRoute><KoperasiAnggotaPage /></ProtectedRoute>} />
        <Route path="/koperasi-shu" element={<ProtectedRoute><KoperasiSHUPage /></ProtectedRoute>} />
        <Route path="/koperasi-pembiayaan" element={<ProtectedRoute><KoperasiPembiayaanPage /></ProtectedRoute>} />
        <Route path="/koperasi-keuangan" element={<ProtectedRoute><KoperasiKeuanganPage /></ProtectedRoute>} />
        <Route path="/buku-panduan" element={<ProtectedRoute><BukuPanduanPage /></ProtectedRoute>} />
        
        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

