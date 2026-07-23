import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ShoppingBag, CreditCard, History, Search, MessageSquare, Send, CheckCircle, Package, ArrowLeft, LogOut, HelpCircle, Tag, AlertTriangle, MapPin, Plus, ShoppingCart, ChevronLeft, ChevronRight, X, Home, Grid, ClipboardList, Award, Sun, Moon, Smartphone } from 'lucide-react';
import { calculateDistanceKm } from '../utils/distance';

const PAGE_SIZE = 24;

// Lightweight local placeholder
function ProductPlaceholder({ name, category }: { name: string; category: string }) {
  const colors = [
    ['#16a34a', '#bbf7d0'], // green
    ['#0ea5e9', '#bae6fd'], // blue
    ['#f59e0b', '#fde68a'], // amber
    ['#8b5cf6', '#ddd6fe'], // violet
    ['#ef4444', '#fecaca'], // red
    ['#06b6d4', '#cffafe'], // cyan
    ['#ec4899', '#fbcfe8'], // pink
    ['#14b8a6', '#99f6e4'], // teal
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const [bg, fg] = colors[idx];
  const initial = name.charAt(0).toUpperCase();
  return (
    <div style={{ backgroundColor: fg, color: bg }} className="w-full h-full flex flex-col items-center justify-center gap-1">
      <span style={{ color: bg }} className="text-2xl font-black">{initial}</span>
      <span style={{ color: bg, opacity: 0.75 }} className="text-[9px] font-semibold text-center px-1 leading-tight line-clamp-1">{category}</span>
    </div>
  );
}

export default function CustomerPortal() {
  const { 
    currentUser, 
    logout,
    products, 
    customerCart, 
    addToCustomerCart, 
    updateCustomerCartQuantity, 
    removeFromCustomerCart, 
    submitOnlineOrder,
    onlineOrders,
    chatMessages,
    sendChatMessage,
    settings,
    branches,
    isDarkMode,
    toggleDarkMode
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CATALOG' | 'PPOB' | 'PROMO' | 'CART' | 'ORDERS' | 'POINTS' | 'GUIDE'>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [deliveryPeriod, setDeliveryPeriod] = useState('Periode 1 (08.00-09.00)');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'TRANSFER' | 'KASBON' | 'POIN'>('TRANSFER');
  const [selectedCheckoutBranch, setSelectedCheckoutBranch] = useState<string>('');
  const [customerDistanceKm, setCustomerDistanceKm] = useState<number | null>(null);
    const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');
  const [showQrisZoom, setShowQrisZoom] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [isOutsideHours, setIsOutsideHours] = useState(false);

  // Compute effective payment methods based on selected branch or global settings
  const selectedBranchData = branches.find(b => b.id === selectedCheckoutBranch);
  const branchHasPayments = selectedBranchData?.paymentMethods && (
    (selectedBranchData.paymentMethods.bankTransfer && selectedBranchData.paymentMethods.bankTransfer.length > 0) || 
    (selectedBranchData.paymentMethods.ewallet && selectedBranchData.paymentMethods.ewallet.length > 0)
  );
  const effectivePaymentMethods = branchHasPayments ? selectedBranchData.paymentMethods : settings.paymentMethods;
  const effectiveQrisUrl = selectedBranchData?.qrisImageUrl || settings.qrisImageUrl;

  React.useEffect(() => {
    const checkHours = () => {
      const opHours = settings?.operationalHours;
      if (!opHours) {
        const currentHour = new Date().getHours();
        setIsOutsideHours(currentHour < 7 || currentHour >= 21);
        return;
      }

      if (!opHours.isOpen) {
        setIsOutsideHours(true);
        return;
      }

      const currentHourMinute = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const isOpen = currentHourMinute >= opHours.openTime && currentHourMinute < opHours.closeTime;
      setIsOutsideHours(!isOpen);
    };
    checkHours();
    const interval = setInterval(checkHours, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings?.operationalHours]);

  const { customers, promos } = useAppStore();

  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      // Filter by Tab
      if (activeTab === 'CATALOG' && p.isPPOB) return false;
      if (activeTab === 'PPOB' && !p.isPPOB) return false;
      // Filter out physical products with 0 stock
      if (!p.isPPOB && p.stock <= 0) return false;

      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory, activeTab]);

  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  React.useEffect(() => {
    if (activeTab !== 'CATALOG') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handleDownloadQris = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = effectiveQrisUrl || settings.qrisImageUrl;
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = 'QRIS_KSA_Mart.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed', err);
      window.open(url, '_blank');
    }
  };

  // Unique categories based on active tab
  const categories = React.useMemo(() => {
    const tabProducts = products.filter(p => {
      if (activeTab === 'CATALOG' && p.isPPOB) return false;
      if (activeTab === 'PPOB' && !p.isPPOB) return false;
      return true;
    });
    const cats = Array.from(new Set(tabProducts.map(p => p.category))).filter(Boolean).sort();
    return ['Semua', ...cats];
  }, [products, activeTab]);

  // Protect route loosely
  if (!currentUser || currentUser.role !== 'PELANGGAN') {
    const isAdmin = currentUser && currentUser.role !== 'PELANGGAN';
    
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Akses Ditolak</h1>
          {isAdmin ? (
            <>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Halaman ini adalah <strong>Portal Khusus Pelanggan</strong>. 
                Anda saat ini sedang login sebagai <strong className="text-green-700">{currentUser.role}</strong>.
                <br/><br/>
                Jika ingin menguji portal pelanggan, silakan buka tautan ini di <strong>Jendela Samaran (Incognito)</strong>.
              </p>
              <button 
                onClick={() => window.location.href = '#/'} 
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold shadow-sm transition-colors"
              >
                Kembali ke Dashboard Saya
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Anda harus login sebagai Pelanggan/Anggota Koperasi untuk mengakses halaman ini.</p>
              <button 
                onClick={() => {
                  window.location.href = '#/login';
                }} 
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold shadow-sm transition-colors"
              >
                Kembali ke Login
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const myCustomerProfile = customers.find(c => c.name === currentUser.name || c.phone === currentUser.username);
  const points = myCustomerProfile?.points || 0;
  const totalUtang = myCustomerProfile?.debtAmount || 0;
  
  const myOrders = onlineOrders.filter(o => o.customerName === currentUser.name);
  const totalBelanja = myOrders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.totalAmount, 0);

  // Calculate total hemat (discount obtained) by checking if order items had a wholesale price
  let totalHemat = 0;
  myOrders.filter(o => o.status === 'COMPLETED').forEach(o => {
    o.items.forEach(item => {
      const prod = products.find(p => p.name === item.productName);
      if (prod && prod.price > item.price) {
        totalHemat += (prod.price - item.price) * item.quantity;
      }
    });
  });

  const cartTotal = customerCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = customerCart.reduce((sum, item) => sum + item.quantity, 0);



  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  const promoProducts = products.filter(p => p.stock > 0 && (p.wholesalePrice !== undefined && p.wholesalePrice < p.price));

  
    const handleCheckLocation = () => {
      if (!settings.storeLocationLat || !settings.storeLocationLng) {
        alert("Mohon maaf, lokasi toko belum diatur oleh admin. Silakan hubungi admin KSA Mart.");
        return;
      }
      
      setIsCheckingLocation(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          setIsCheckingLocation(false);
          const dist = calculateDistanceKm(
            settings.storeLocationLat!, 
            settings.storeLocationLng!, 
            position.coords.latitude, 
            position.coords.longitude
          );
          setCustomerDistanceKm(dist);
        }, (error) => {
          setIsCheckingLocation(false);
          alert("Gagal mendapatkan lokasi Anda. Pastikan izin akses lokasi/GPS diaktifkan. " + error.message);
        });
      } else {
        setIsCheckingLocation(false);
        alert("Geolocation tidak didukung oleh browser Anda.");
      }
    };

    const handleCheckout = () => {
    if (customerCart.length === 0) return;
    
    // Validasi radius pengiriman maksimal 5KM
    const maxRadius = settings.maxDeliveryRadiusKm || 5;
    if (customerDistanceKm !== null && customerDistanceKm > maxRadius) {
      alert(`Mohon maaf, lokasi Anda berjarak ${customerDistanceKm.toFixed(2)} km dari toko. Maksimal radius pengiriman adalah ${maxRadius} km. Silakan pilih opsi ambil sendiri di toko.`);
      return;
    }
    
    if (!selectedCheckoutBranch) {
      alert("Silakan pilih Cabang Tujuan untuk pesanan ini.");
      return;
    }
    
    // Tentukan payment method dari pilihan pelanggan
    const paymentCode = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentMethodString = checkoutPaymentMethod === 'TRANSFER' ? 'Transfer/QRIS' : (checkoutPaymentMethod === 'POIN' ? 'Potong Poin' : 'Kasbon (Bayar Nanti)');
    
    const finalNotes = `[WAKTU PENGIRIMAN: ${deliveryPeriod}] [PEMBAYARAN: ${paymentMethodString}] ${checkoutNotes ? checkoutNotes : ''}`;
    submitOnlineOrder(currentUser.username, currentUser.name, currentUser.username || "08xxxx", finalNotes, undefined, paymentCode, customerDistanceKm || undefined, selectedCheckoutBranch);
    
    let savedAmount = 0;
    customerCart.forEach(item => {
      const prod = products.find(p => p.id === item.product.id);
      if (prod && prod.price > item.product.price) {
        savedAmount += (prod.price - item.product.price) * item.quantity;
      }
    });

    const waNumber = (selectedBranchData?.phone || settings.storePhone || settings.ownerWhatsapp)?.replace(/^0/, '62');
    if (waNumber) {
      const itemList = customerCart.map(c => `- ${c.quantity}x ${c.product.name}`).join('\n');
      const waMessage = `Assalamualaikum KSA Mart,\n\nSaya, *${currentUser.name}* (Member KSA Mart), ingin memesan:\n${itemList}\n\nTotal Belanja: Rp ${cartTotal.toLocaleString('id-ID')}\nKode Pembayaran: *${paymentCode}*\n\nCatatan & Pengiriman:\n${finalNotes}\n\nMohon segera diproses pesanan saya dan beritahu saya cara pembayarannya. Terima kasih!`;
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank');
    }
    
    if (savedAmount > 0) {
      alert(`Pesanan berhasil dibuat! Anda telah MENGHEMAT Rp ${savedAmount.toLocaleString('id-ID')} pada pesanan ini berkat diskon/promo. Anda akan dialihkan ke WhatsApp Toko KSA Mart untuk konfirmasi.`);
    } else {
      alert("Pesanan berhasil dibuat! Anda akan dialihkan ke WhatsApp Toko KSA Mart untuk konfirmasi.");
    }
    
    setCheckoutNotes('');
    setActiveTab('ORDERS');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !chatText.trim()) return;
    sendChatMessage(selectedOrderId, currentUser.username, currentUser.name, chatText);
    setChatText('');
  };

  return (
    <div className={`min-h-[100dvh] flex flex-col transition-colors ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
      {/* ── STICKY HEADER ──────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-green-700 to-green-600 text-white shadow-lg sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/ksa_mart_logo.png" alt="KSA Mart" className="h-9 w-auto rounded-md shadow-sm" />
            <div>
              <h1 className="font-black text-base leading-tight">Member Portal</h1>
              <p className="text-green-200 text-[11px] font-medium">KSA Mart Syariah</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-medium hidden sm:block">Ahlan wa Sahlan, {currentUser.name}</span>
            <button onClick={toggleDarkMode} className="p-1.5 bg-white dark:bg-slate-900/20 hover:bg-white dark:bg-slate-900/30 rounded-lg transition-colors text-green-700 dark:text-white" title="Ubah Tema">
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin keluar dari Member Portal? Anda harus login kembali setelah ini.")) {
                logout();
              }
            }} className="p-1.5 bg-white dark:bg-slate-900/20 hover:bg-white dark:bg-slate-900/30 rounded-lg transition-colors text-green-700 dark:text-white" title="Keluar">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Desktop Only) */}
        <div className="hidden md:flex overflow-x-auto hide-scrollbar border-t border-green-600">
          {([['DASHBOARD', 'Dashboard'], ['CATALOG', 'Barang'], ['PPOB', 'PPOB'], ['PROMO', 'Promo'], ['CART', 'Keranjang'], ['ORDERS', 'Pesanan'], ['POINTS', 'Poin'], ['GUIDE', 'Panduan']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 min-w-[80px] py-2 text-xs font-bold transition-colors relative flex items-center justify-center gap-1 ${
                activeTab === tab
                  ? 'text-white bg-white dark:bg-slate-900/20'
                  : 'text-green-200 hover:text-white hover:bg-white dark:bg-slate-900/10'
              }`}
            >
              {label}
              {tab === 'CART' && customerCart.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-black rounded-full px-0.5">
                  {customerCart.length}
                </span>
              )}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white dark:bg-slate-900 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
        
        {isOutsideHours && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl mb-6 shadow-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold text-sm">
                {!settings?.operationalHours?.isOpen 
                  ? 'Toko Sedang Tutup'
                  : `Di Luar Jam Operasional (${settings?.operationalHours?.openTime || '07:00'} - ${settings?.operationalHours?.closeTime || '21:00'})`}
              </p>
              <p className="text-xs mt-1 leading-relaxed whitespace-pre-wrap">
                {settings?.operationalHours && !settings.operationalHours.isOpen
                  ? settings.operationalHours.closedMessage
                  : 'Saat ini KSA Mart sedang tutup. Anda tetap dapat melakukan pemesanan, namun pesanan Anda akan diproses dan dikirim pada jam operasional kami berikutnya.'}
              </p>
            </div>
          </div>
        )}


        {/* Tab: Dashboard */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-teal-700 bg-gradient-to-br from-green-600 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><ShoppingBag className="w-24 h-24"/></div>
                <p className="text-green-100 font-medium mb-1">Total Belanja</p>
                <h3 className="text-3xl font-black">Rp {totalBelanja.toLocaleString('id-ID')}</h3>
                <p className="text-xs text-green-200 mt-4 bg-black/20 inline-block px-3 py-1 rounded-full">
                  {myCustomerProfile?.isKoperasiMember ? 'Anggota Koperasi Syariah' : 'Pelanggan Umum'}
                </p>
              </div>
              <div className="bg-blue-700 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Tag className="w-24 h-24"/></div>
                <p className="text-blue-100 font-medium mb-1">Total Hemat & Diskon</p>
                <h3 className="text-3xl font-black">Rp {totalHemat.toLocaleString('id-ID')}</h3>
                <p className="text-[10px] text-blue-200 mt-4 bg-black/20 inline-block px-2 py-1 rounded-full">Akumulasi dari Promo & Grosir</p>
              </div>
              <div className="bg-purple-700 bg-gradient-to-br from-fuchsia-600 to-purple-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Tag className="w-24 h-24"/></div>
                <p className="text-fuchsia-100 font-medium mb-1">Loyalitas Poin</p>
                <h3 className="text-3xl font-black">{points} Poin</h3>
                <p className="text-xs text-fuchsia-200 mt-4 bg-black/20 inline-block px-3 py-1 rounded-full">Senilai Rp {(points * 10).toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-red-600 bg-gradient-to-br from-rose-500 to-red-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><CreditCard className="w-24 h-24"/></div>
                <p className="text-rose-100 font-medium mb-1">Tagihan/Utang Koperasi</p>
                <h3 className="text-3xl font-black">Rp {totalUtang.toLocaleString('id-ID')}</h3>
                <button 
                  onClick={() => alert(`Harap hubungi kasir/toko KSA Mart dengan menyebutkan nama: ${currentUser.name} untuk pembayaran tagihan kasbon sebesar Rp ${totalUtang.toLocaleString('id-ID')}.`)}
                  className="mt-4 bg-white dark:bg-slate-900/25 hover:bg-white dark:bg-slate-900/35 text-white px-4 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  Bayar Tagihan
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Pesanan Aktif Terbaru</h3>
              <div className="space-y-3">
                {myOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">Tidak ada pesanan aktif saat ini.</p>
                ) : (
                  myOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').slice(0,3).map(o => (
                    <div key={o.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-800 cursor-pointer transition-colors" onClick={() => setActiveTab('ORDERS')}>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{o.orderNo}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(o.createdAt).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-700 text-sm">Rp {o.totalAmount.toLocaleString('id-ID')}</p>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{o.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Catalog & PPOB */}
        {(activeTab === 'CATALOG' || activeTab === 'PPOB') && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3"/>
              <input 
                type="text" 
                placeholder="Cari barang kebutuhan Anda..." 
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Category Filter */}
            <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                    selectedCategory === cat
                      ? 'bg-green-600 border-green-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <p>Menampilkan <b className="text-slate-700 dark:text-slate-300">{filteredProducts.length.toLocaleString('id-ID')}</b> produk</p>
              <p>Hal {currentPage} / {totalPages}</p>
            </div>

            {/* Product Grid */}
            {paginatedProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {paginatedProducts.map(p => {
                  const inCart = customerCart.find(c => c.product.id === p.id)?.quantity || 0;
                  return (
                    <div key={p.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
                      {/* Product Image */}
                      <div className="aspect-square w-full overflow-hidden relative flex-shrink-0">
                        {p.image && !p.image.includes('unsplash.com') ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <ProductPlaceholder name={p.name} category={p.category} />
                        )}
                        {/* Category Badge */}
                        <div className="absolute top-1.5 left-1.5">
                          <span className="bg-black/50 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                            {p.category}
                          </span>
                        </div>
                        {inCart > 0 && (
                          <div className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 shadow">
                            {inCart}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-2 flex flex-col flex-1 gap-1.5">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-tight line-clamp-2 flex-1">{p.name}</h3>
                        <p className="text-green-700 font-black text-sm">Rp {p.price.toLocaleString('id-ID')}</p>
                        {p.isPPOB ? (
                          <p className="text-[10px] text-blue-500 font-semibold">Layanan Digital</p>
                        ) : (
                          <p className="text-[10px] text-slate-400">Stok: {p.stock} {p.unit}</p>
                        )}

                        {/* Add to Cart */}
                        {inCart > 0 ? (
                          <div className="flex items-center justify-between bg-green-50 rounded-lg p-0.5 border border-green-200">
                            <button
                              onClick={() => updateCustomerCartQuantity(p.id, inCart - 1)}
                              className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-900 rounded-md text-green-700 font-black hover:bg-green-100 shadow-sm text-sm"
                            >-</button>
                            <span className="font-black text-green-800 text-sm min-w-[1.5rem] text-center">{inCart}</span>
                            <button
                              onClick={() => updateCustomerCartQuantity(p.id, inCart + 1)}
                              disabled={inCart >= p.stock}
                              className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-900 rounded-md text-green-700 font-black hover:bg-green-100 shadow-sm disabled:opacity-40 text-sm"
                            >+</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCustomerCart(p)}
                            className="w-full py-1.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1"
                          >
                            <ShoppingBag className="w-3 h-3" /> Tambah
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 py-6">
                <button
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0 }); }}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0 }); }}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                          page === currentPage
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0 }); }}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
                >
                  Selanjutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Promo */}
        {activeTab === 'PROMO' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Voucher Promos */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">Kupon & Voucher Belanja</h2>
              {promos.filter(pr => pr.isActive).length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">Tidak ada voucher promo aktif saat ini.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promos.filter(pr => pr.isActive).map(pr => (
                    <div key={pr.id} className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="bg-amber-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded inline-block mb-2">VOUCHER BELANJA</div>
                        <h4 className="font-bold text-slate-850 text-base">{pr.name}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Potongan: <strong className="text-green-700">{pr.type === 'PERCENTAGE' ? `${pr.value}%` : `Rp ${pr.value.toLocaleString('id-ID')}`}</strong></p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Min. Belanja: Rp {pr.minPurchase.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="text-[9px] text-amber-800 font-bold mt-3 bg-amber-100/50 p-1.5 rounded text-center">Gunakan saat checkout di kasir dengan menyebutkan promo ini</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Promo Products */}
            <div className="space-y-4 pt-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2">Produk dengan Harga Grosir</h2>
              {promoProducts.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">Tidak ada produk grosir saat ini.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {promoProducts.map(p => {
                    const inCart = customerCart.find(c => c.product.id === p.id)?.quantity || 0;
                    return (
                      <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg hover:border-rose-300 transition-all relative">
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-rose-600 to-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-md z-10 uppercase tracking-widest border border-white/20">GROSIR</div>
                        <div className="h-32 bg-slate-50 dark:bg-slate-800 relative p-2">
                          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-rose-50 overflow-hidden relative">
                            {p.image && !p.image.includes('unsplash.com') ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-rose-50 to-red-50 flex items-center justify-center">
                                <span className="text-3xl font-black text-rose-800 opacity-20 uppercase">{p.name.substring(0,2)}</span>
                              </div>
                            )}
                            <div className="absolute top-1 left-1 bg-white dark:bg-slate-900/90 backdrop-blur-sm text-[8px] font-bold px-1.5 py-0.5 rounded text-rose-700 shadow-sm uppercase tracking-widest">{p.category}</div>
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col bg-white dark:bg-slate-900">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-2 leading-tight mb-2 flex-1">{p.name}</h3>
                          <div className="mt-auto pt-2 border-t border-rose-50 border-dashed">
                            <div className="flex items-end justify-between mb-2">
                              <div>
                                <p className="text-[10px] text-slate-400 line-through">Rp {p.price.toLocaleString('id-ID')}</p>
                                <p className="text-rose-600 font-black text-sm">Rp {p.wholesalePrice?.toLocaleString('id-ID')} <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">/ {p.unit}</span></p>
                              </div>
                              <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-100 shadow-sm text-center">
                                Min Beli<br/>{p.wholesaleMinQty}
                              </span>
                            </div>
                            
                            {inCart > 0 ? (
                              <div className="flex items-center justify-between bg-rose-50 rounded-xl p-1 border border-rose-200 shadow-inner">
                                <button onClick={() => updateCustomerCartQuantity(p.id, inCart - 1)} className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg text-rose-700 font-bold shadow-sm active:scale-95 transition-transform">-</button>
                                <span className="font-bold text-rose-800 text-sm">{inCart}</span>
                                <button onClick={() => updateCustomerCartQuantity(p.id, inCart + 1)} disabled={inCart >= p.stock} className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg text-rose-700 font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-50">+</button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => addToCustomerCart(p)}
                                className="w-full py-2 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-700 hover:to-red-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3"/> Tambah ke Keranjang
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Cart */}
        {activeTab === 'CART' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-green-600"/> Keranjang Belanja
            </h2>
            
            {customerCart.length === 0 ? (
              <div className="text-center py-10">
                <Package className="w-16 h-16 text-slate-200 mx-auto mb-4"/>
                <p className="text-slate-500 dark:text-slate-400">Keranjang masih kosong.</p>
                <button onClick={() => setActiveTab('CATALOG')} className="mt-4 text-green-600 font-bold hover:underline">Belanja Sekarang</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {customerCart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                         {item.product.image ? (
                           <img src={item.product.image} className="w-full h-full object-cover" />
                         ) : (
                           <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.product.name)}&background=random&color=fff&size=200&bold=true`} className="w-full h-full object-cover" />
                         )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.product.name}</h4>
                        <p className="text-green-700 font-bold">Rp {item.product.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                          <button onClick={() => updateCustomerCartQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 bg-white dark:bg-slate-900 rounded shadow-sm text-slate-700 dark:text-slate-300 font-bold">-</button>
                          <span className="w-8 text-center font-bold text-slate-800 dark:text-slate-200">{item.quantity}</span>
                          <button onClick={() => updateCustomerCartQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock} className="w-8 h-8 bg-white dark:bg-slate-900 rounded shadow-sm text-slate-700 dark:text-slate-300 font-bold disabled:opacity-50">+</button>
                        </div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 w-24 text-right">Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-4">
                  {/* Deteksi Lokasi Otomatis */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
                    <p className="font-bold text-blue-800 mb-2">Deteksi Jarak Otomatis (GPS)</p>
                    {customerDistanceKm !== null ? (
                      <p className="text-blue-700">Jarak Anda ke toko KSA Mart: <span className="font-black text-lg">{customerDistanceKm.toFixed(2)} km</span></p>
                    ) : (
                      <p className="text-blue-600 text-xs mb-2">Aktifkan GPS agar kami bisa menghitung jarak pengiriman otomatis.</p>
                    )}
                    <button 
                      onClick={handleCheckLocation}
                      disabled={isCheckingLocation}
                      className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm disabled:opacity-50"
                    >
                      {isCheckingLocation ? 'Mendeteksi...' : (customerDistanceKm !== null ? 'Perbarui Lokasi' : 'Cek Jarak ke Toko')}
                    </button>
                    {customerDistanceKm !== null && settings.maxDeliveryRadiusKm && customerDistanceKm > settings.maxDeliveryRadiusKm && (
                      <p className="mt-2 text-rose-600 text-xs font-bold bg-rose-50 border border-rose-200 p-2 rounded">Perhatian: Jarak Anda melebihi batas pengiriman ({settings.maxDeliveryRadiusKm} km).</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Cabang Tujuan <span className="text-red-700">*</span></label>
                    <select 
                      value={selectedCheckoutBranch}
                      onChange={e => setSelectedCheckoutBranch(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-900 mb-4"
                      required
                    >
                      <option value="" disabled>-- Pilih Cabang KSA Mart --</option>
                      <option value="pusat">Kantor Pusat / Cabang Utama</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>

                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Periode Pengiriman / Pengambilan</label>
                    <select 
                      value={deliveryPeriod}
                      onChange={e => setDeliveryPeriod(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-900 mb-4"
                    >
                      <option value="Periode 1 (08.00-09.00)">Periode 1 (08.00 - 09.00)</option>
                      <option value="Periode 2 (11.00-12.00)">Periode 2 (11.00 - 12.00)</option>
                      <option value="Periode 3 (14.00-15.00)">Periode 3 (14.00 - 15.00)</option>
                      <option value="Periode 4 (17.00-18.00)">Periode 4 (17.00 - 18.00)</option>
                      <option value="Periode 5 (20.00-21.00)">Periode 5 (20.00 - 21.00)</option>
                    </select>

                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Pesanan (Opsional)</label>
                    <input 
                      type="text" 
                      value={checkoutNotes}
                      onChange={e => setCheckoutNotes(e.target.value)}
                      placeholder="Misal: Tolong dibungkus rapi, diambil sore..."
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  
                  {/* Opsi Metode Pembayaran Lengkap */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                    <p className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">Pilih Metode Pembayaran</p>
                    
                    <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="TRANSFER" 
                        checked={checkoutPaymentMethod === 'TRANSFER'} 
                        onChange={() => setCheckoutPaymentMethod('TRANSFER')}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">💳 Transfer Bank / QRIS</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="POIN" 
                        checked={checkoutPaymentMethod === 'POIN'} 
                        onChange={() => setCheckoutPaymentMethod('POIN')}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                        disabled={points < cartTotal}
                      />
                      <span className={`font-semibold ${points < cartTotal ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        💰 Potong Saldo Poin (Tersedia: {points} Poin)
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="KASBON" 
                        checked={checkoutPaymentMethod === 'KASBON'} 
                        onChange={() => setCheckoutPaymentMethod('KASBON')}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">📝 Bayar Nanti (Kasbon)</span>
                    </label>
                  </div>

                  {/* Panduan Pembayaran (Hanya jika Transfer) */}
                  {checkoutPaymentMethod === 'TRANSFER' && (
                  <div className="bg-green-50/50 border border-green-200/50 rounded-xl p-3 text-xs space-y-2">
                    <p className="font-bold text-green-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-green-700"/> Instruksi Transfer {selectedBranchData ? `(${selectedBranchData.name})` : ''}
                    </p>
                    <div className="space-y-1.5 text-gray-700 dark:text-slate-300">
                      {(!effectivePaymentMethods?.bankTransfer || effectivePaymentMethods.bankTransfer.length === 0) && 
                       (!effectivePaymentMethods?.ewallet || effectivePaymentMethods.ewallet.length === 0) ? (
                        <div className="p-2 bg-white dark:bg-slate-900 rounded border border-green-100">
                          <p className="font-bold text-green-800">Transfer Bank Syariah (BSI)</p>
                          <p className="text-[11px] font-mono">No. Rek: <span className="font-bold text-slate-900 dark:text-white">7182938495</span></p>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400">a.n. KSA Mart Syariah</p>
                        </div>
                      ) : (
                        <>
                          {effectivePaymentMethods?.bankTransfer?.map((b, idx) => (
                            <div key={idx} className="p-2 bg-white dark:bg-slate-900 rounded border border-green-100">
                              <p className="font-bold text-green-800">{b.bankName}</p>
                              <p className="text-[11px] font-mono">No. Rek: <span className="font-bold text-slate-900 dark:text-white">{b.accountNumber}</span></p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400">a.n. {b.accountName}</p>
                            </div>
                          ))}
                          {effectivePaymentMethods?.ewallet?.map((w, idx) => (
                            <div key={idx} className="p-2 bg-white dark:bg-slate-900 rounded border border-green-100">
                              <p className="font-bold text-purple-800">{w.provider}</p>
                              <p className="text-[11px] font-mono">No / ID: <span className="font-bold text-slate-900 dark:text-white">{w.number}</span></p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400">a.n. {w.accountName}</p>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {effectiveQrisUrl && (
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-green-200 flex flex-col items-center shadow-sm">
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-center mb-3">Scan QRIS untuk Membayar</p>
                          <img 
                            src={effectiveQrisUrl} 
                            alt="QRIS KSA Mart" 
                            className="w-full max-w-[200px] h-auto object-contain rounded cursor-pointer hover:opacity-90 transition-opacity border-2 border-slate-100 dark:border-slate-800 p-1" 
                            onClick={() => setShowQrisZoom(true)}
                          />
                          <p className="text-[10px] text-green-600 mt-2 font-bold bg-green-50 px-2 py-1 rounded-full">
                            Tuk Ketuk untuk memperbesar & mengunduh
                          </p>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 italic mt-1">
                        * Silakan lakukan transfer sesuai total belanja Anda. Setelah memesan, Admin akan segera memproses dan mengonfirmasi pesanan Anda via WhatsApp.
                      </p>
                    </div>
                  </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Total Pembayaran</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-green-700 block">Rp {cartTotal.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-slate-500 italic block">* Belum termasuk Ongkos Kirim</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-green-900/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-6 h-6"/> Buat Pesanan Sekarang
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Orders & Chat */}
        {activeTab === 'ORDERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* List Pesanan */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 overflow-y-auto max-h-[70vh]">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><History className="w-5 h-5 text-green-600"/> Riwayat Pesanan</h3>
              <div className="space-y-3">
                {myOrders.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">Belum ada riwayat pesanan.</p>
                ) : (
                  myOrders.map(o => (
                    <div 
                      key={o.id} 
                      onClick={() => setSelectedOrderId(o.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-colors ${selectedOrderId === o.id ? 'bg-green-50 border-green-300 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-green-200 hover:bg-slate-50 dark:bg-slate-800'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{o.orderNo}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${o.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : o.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-green-700 font-bold text-sm">Rp {(o.totalAmount + (o.shippingFee || 0)).toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{new Date(o.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detail Pesanan & Chat */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[70vh]">
              {selectedOrderId ? (() => {
                const order = myOrders.find(o => o.id === selectedOrderId);
                if (!order) return null;
                const msgs = chatMessages.filter(m => m.orderId === selectedOrderId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                
                return (
                  <>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center rounded-t-2xl">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{order.orderNo}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total: Rp {(order.totalAmount + (order.shippingFee || 0)).toLocaleString('id-ID')} | Status: <strong className="text-green-700">{order.status}</strong></p>
                      </div>
                      <button onClick={() => setSelectedOrderId(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 lg:hidden"><ArrowLeft className="w-6 h-6"/></button>
                    </div>
                    
                    {/* Items List (Brief) */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 max-h-32 overflow-y-auto">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Item Dibeli:</p>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700 dark:text-slate-300">{item.quantity}x {item.productName}</span>
                          <span className="font-medium">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      {(order.shippingFee && order.shippingFee > 0) ? (
                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-slate-700 dark:text-slate-300 font-bold">Ongkos Kirim</span>
                          <span className="font-bold text-green-700">Rp {order.shippingFee.toLocaleString('id-ID')}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-800/50 space-y-3">
                      {msgs.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm mt-10">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                          Belum ada pesan. Silakan hubungi admin toko.
                        </div>
                      ) : (
                        msgs.map(msg => {
                          const isMe = msg.senderId === currentUser.username;
                          return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-green-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                                {!isMe && <p className="text-[10px] font-bold text-green-700 mb-1">{msg.senderName}</p>}
                                <p>{msg.text}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-2xl flex gap-2">
                      <input 
                        type="text" 
                        value={chatText}
                        onChange={e => setChatText(e.target.value)}
                        placeholder="Ketik pesan untuk admin toko..."
                        className="flex-1 border border-slate-300 dark:border-slate-600 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:bg-slate-900 transition-colors"
                      />
                      <button type="submit" disabled={!chatText.trim()} className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                        <Send className="w-4 h-4 ml-[-2px]"/>
                      </button>
                    </form>
                  </>
                );
              })() : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <MessageSquare className="w-16 h-16 text-slate-200 mb-4"/>
                  <h3 className="font-bold text-slate-600 dark:text-slate-400 mb-1">Pilih Pesanan</h3>
                  <p className="text-sm">Klik salah satu pesanan di sebelah kiri untuk melihat detail atau menghubungi admin toko.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Tab: Points */}
        {activeTab === 'POINTS' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-fuchsia-700 bg-gradient-to-br from-fuchsia-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Tag className="w-24 h-24"/></div>
              <p className="text-fuchsia-100 font-medium mb-1">Total Poin Terkumpul</p>
              <h3 className="text-4xl font-black">{points} Poin</h3>
              <p className="text-sm text-fuchsia-200 mt-2 bg-black/20 inline-block px-3 py-1 rounded-full">
                Senilai Rp {(points * 10).toLocaleString('id-ID')}
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500 dark:text-slate-400" /> Riwayat Perolehan Poin
              </h3>
              <div className="space-y-3">
                {myOrders.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">Belum ada riwayat transaksi yang menghasilkan poin.</p>
                ) : (
                  myOrders.map(o => (
                    <div key={o.id} className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Transaksi {o.orderNo}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(o.createdAt).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-fuchsia-600 bg-fuchsia-50 px-3 py-1 rounded-lg border border-fuchsia-100">
                          + {Math.floor(o.totalAmount / 1000)} Pts
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Guide & Info */}
        {activeTab === 'GUIDE' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 border-b pb-4">
                <HelpCircle className="w-6 h-6 text-green-600" /> Pusat Bantuan & Informasi Pelanggan
              </h2>
              
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                  <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Jam Operasional & Syarat Ketentuan
                  </h3>
                  <ul className="text-amber-800 text-sm leading-relaxed space-y-2 list-disc list-inside">
                    <li><strong>Jam Operasional KSA Mart:</strong> 07.00 - 21.00 WIB setiap hari.</li>
                    <li>Pesanan yang masuk <strong>di luar jam operasional</strong> akan otomatis diproses dan dikirimkan pada jam kerja operasional berikutnya.</li>
                    <li>Layanan pesan antar (delivery) berlaku untuk jarak <strong>maksimal 5 KM</strong> dari lokasi KSA Mart.</li>
                    <li>Pastikan alamat pengiriman Anda sudah benar dan nomor HP / WhatsApp Anda aktif untuk memudahkan kurir/kasir melakukan konfirmasi pesanan.</li>
                    <li>Pembayaran dapat dilakukan melalui transfer atau QRIS sesuai yang diinstruksikan oleh admin kami melalui WhatsApp.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-green-800 mb-2">1. Cara Memesan Barang</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Buka tab <strong>Katalog Belanja</strong>, cari barang yang Anda butuhkan, lalu klik tombol "Tambah" untuk memasukkan barang ke Keranjang. Setelah selesai memilih, buka tab <strong>Keranjang</strong>, periksa daftar belanjaan Anda, dan klik tombol "Checkout". Pesanan akan diteruskan ke admin KSA Mart.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-green-800 mb-2">2. Memantau Status Pesanan & Chat Admin</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Buka tab <strong>Pesanan Saya</strong> untuk melihat status pesanan (PENDING, diproses, atau selesai). Klik pada salah satu pesanan untuk melihat detail barang. Di halaman detail pesanan, Anda bisa menggunakan fitur <strong>Chat / Diskusi</strong> untuk bertanya atau memberi catatan tambahan langsung kepada kasir yang bertugas.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-green-800 mb-2">3. Tagihan & Poin Loyalitas</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Di tab <strong>Dashboard</strong>, Anda bisa memantau akumulasi total belanja Anda, serta jumlah Poin Loyalitas yang Anda miliki untuk ditukarkan menjadi diskon di kasir KSA Mart.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                  <h3 className="font-bold text-green-800 mb-1 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Keamanan Privasi Akun
                  </h3>
                  <p className="text-green-700 text-sm leading-relaxed">
                    Sebagai pelanggan / anggota koperasi, akun Anda terproteksi secara privat. Anda tidak dapat melihat pesanan pelanggan lain ataupun mengakses data internal toko KSA Mart.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── FLOATING CART BUTTON (only when catalog tab & has items) ── */}
      {activeTab === 'CATALOG' && cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 pointer-events-none flex justify-center">
          <button
            onClick={() => setActiveTab('CART')}
            className="pointer-events-auto flex items-center gap-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-black py-3 px-6 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Lihat Keranjang ({cartCount} item)</span>
            <span className="bg-white dark:bg-slate-900/20 px-2.5 py-0.5 rounded-full font-black text-sm">
              Rp {cartTotal.toLocaleString('id-ID')}
            </span>
          </button>
        </div>
      )}
      {/* Modal Zoom QRIS */}
      {showQrisZoom && (effectiveQrisUrl || settings.qrisImageUrl) && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setShowQrisZoom(false)}>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowQrisZoom(false)}
              className="absolute -top-4 -right-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 rounded-full shadow-lg hover:bg-slate-100 dark:bg-slate-800"
            >
              <X className="w-5 h-5"/>
            </button>
            <h3 className="text-center font-bold text-slate-800 dark:text-slate-200 mb-4">Scan QRIS KSA Mart</h3>
            
            <div className="text-center mb-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Pembayaran</p>
              <p className="text-2xl font-black text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-slate-500 italic">* Belum termasuk Ongkos Kirim</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 mb-4 flex justify-center">
              <img src={effectiveQrisUrl || settings.qrisImageUrl} alt="QRIS KSA Mart Besar" className="w-full h-auto object-contain" />
            </div>
            <button 
              onClick={handleDownloadQris}
              className="w-full block text-center py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md transition-colors mt-4"
            >
              Unduh QRIS
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between px-2 py-2 z-50 md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-safe">
        {[
          { id: 'DASHBOARD', label: 'Home', icon: Home },
          { id: 'CATALOG', label: 'Belanja', icon: Grid },
          { id: 'PPOB', label: 'PPOB', icon: Smartphone },
          { id: 'CART', label: 'Keranjang', icon: ShoppingCart },
          { id: 'ORDERS', label: 'Pesanan', icon: ClipboardList }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
                isActive ? 'text-green-600' : 'text-slate-400 hover:text-green-500'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'fill-green-100' : ''}`} />
                {tab.id === 'CART' && customerCart.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-black rounded-full px-0.5 border border-white shadow-sm">
                    {customerCart.length}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-green-700' : 'font-medium'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      {/* Spacer so content is not hidden by the bottom nav */}
      <div className="h-16 md:hidden flex-shrink-0"></div>

      {/* ─── GLOBAL FOOTER ─────────────────────────────────────── */}
      <footer className="bg-[#1e3a2b] text-white py-1.5 px-4 text-[10px] md:text-xs flex justify-between items-center z-40 border-t border-[#0e441b] shrink-0 mt-auto">
        <span>Copyright &copy; Team Development KSA Mart 2026. All rights reserved.</span>
        <span>ver 1.0</span>
      </footer>
    </div>
  );
}
