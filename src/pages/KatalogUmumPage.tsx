import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ShoppingBag, Package, ArrowLeft, Send, HelpCircle, AlertTriangle, MessageCircle, Loader } from 'lucide-react';
import { calculateDistanceKm } from '../utils/distance';
import { useNavigate } from 'react-router-dom';

export default function KatalogUmumPage() {
  const { 
    products, 
    customerCart, 
    addToCustomerCart, 
    updateCustomerCartQuantity, 
    removeFromCustomerCart, 
    submitOnlineOrder,
    settings,
    customers,
    addCustomer,
    initializeStore,
    isLoading
  } = useAppStore();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'CATALOG' | 'CART' | 'GUIDE'>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDataSyncing, setIsDataSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [isOutsideHours, setIsOutsideHours] = useState(false);

  // Ensure data is synced on component mount and periodically refresh
  React.useEffect(() => {
    const syncData = async () => {
      setIsDataSyncing(true);
      setSyncError(null);
      try {
        await initializeStore();
        setSyncError(null);
      } catch (err: any) {
        console.error('Failed to sync catalog data:', err);
        setSyncError('Gagal memuat data produk dari server. Data ditampilkan dari cache lokal.');
      } finally {
        setIsDataSyncing(false);
      }
    };

    syncData();
    
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(syncData, 30000);
    return () => clearInterval(interval);
  }, [initializeStore]);

  React.useEffect(() => {
    const checkHours = () => {
      const currentHour = new Date().getHours();
      // Operational hours: 07:00 (7) to 18:59 (19 is outside)
      if (currentHour < 7 || currentHour >= 19) {
        setIsOutsideHours(true);
      } else {
        setIsOutsideHours(false);
      }
    };
    checkHours();
    const interval = setInterval(checkHours, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [deliveryPeriod, setDeliveryPeriod] = useState('Periode 1 (08.00-09.00)');
  const [customerDistanceKm, setCustomerDistanceKm] = useState<number | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'TRANSFER' | 'QRIS' | 'EWALLET'>('COD');
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  const cartTotal = customerCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const filteredProducts = products.filter(p => p.stock > 0 && p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  
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

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerCart.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert("Mohon lengkapi Nama, No WhatsApp, dan Alamat Pengiriman!");
      return;
    }
    if (paymentMethod !== 'COD' && !isPaymentConfirmed) {
      alert("Mohon centang konfirmasi bahwa Anda sudah melakukan transfer/pembayaran.");
      return;
    }
    
    // We use a generated ID since it's a public user
    const customerId = `public_${Date.now()}`;
    
    const finalNotes = `[WAKTU PENGIRIMAN: ${deliveryPeriod}] [Metode: ${paymentMethod}] ${checkoutNotes ? checkoutNotes : ''}`;
    
    // Generate unique payment code if not COD
    const paymentCode = paymentMethod !== 'COD' ? `PAY-${Math.floor(100000 + Math.random() * 900000)}` : undefined;

    // ✅ Auto-rekam data pelanggan baru (jika nomor HP belum terdaftar)
    if (customerPhone && customerName) {
      const existing = customers.find(c => 
        c.phone === customerPhone || 
        c.phone === customerPhone.replace(/^0/, '62') ||
        c.phone.replace(/^0/, '62') === customerPhone.replace(/^0/, '62')
      );
      if (!existing) {
        // Pelanggan baru - tambahkan ke database
        addCustomer({
          tenantId: 'tenant_default',
          name: customerName,
          phone: customerPhone,
          points: 0,
          debtAmount: 0,
        });
      }
    }
    
    submitOnlineOrder(
      customerId, 
      customerName, 
      customerPhone, 
      finalNotes,
      customerAddress,
      paymentCode
    );
    
    // Redirect to WhatsApp
    const defaultWa = '085881893650'; // Fallback to Pak Grandis's number
    const storeWa = settings.ownerWhatsapp || defaultWa;
    const waNumber = storeWa.replace(/^0/, '62');
    
    if (waNumber) {
      const itemList = customerCart.map(c => `▪ ${c.quantity}x ${c.product.name}`).join('\n');
      
      // Format payment method text for better readability
      let paymentText = paymentMethod;
      if (paymentMethod === 'TRANSFER') paymentText = 'Transfer Bank';
      if (paymentMethod === 'QRIS') paymentText = 'QRIS Syariah';
      if (paymentMethod === 'EWALLET') paymentText = 'E-Wallet';
      
      let waMessage = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\nAdmin KSA Mart, saya ingin melakukan pemesanan barang dengan rincian sebagai berikut:\n\n*🛒 DAFTAR PESANAN:*\n${itemList}\n\n*💰 TOTAL BELANJA:* Rp ${cartTotal.toLocaleString('id-ID')}\n*💳 METODE PEMBAYARAN:* (${paymentText})`;
      
      if (paymentCode) {
        waMessage += `\n*🔢 KODE PEMBAYARAN:* ${paymentCode}`;
      }
      
      waMessage += `\n\n*📦 DATA PENGIRIMAN:*\n- Nama: ${customerName}\n- No. HP: ${customerPhone}\n- Alamat: ${customerAddress}`;
      
      if (checkoutNotes) {
        waMessage += `\n- Catatan: ${checkoutNotes}`;
      }
      
      waMessage += `\n- Waktu Pengiriman: ${deliveryPeriod}`;
      
      waMessage += `\n\nMohon bantuannya untuk segera diproses. Berikut saya lampirkan bukti pembayarannya (jika non-COD).\nTerima kasih! 🙏`;
      
      // Use official wa.me link which guarantees opening the App on Mobile (Android/iOS)
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
      
      // Reset Form first before navigating away
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCheckoutNotes('');
      setIsPaymentConfirmed(false);
      setPaymentMethod('COD');
      setActiveTab('CATALOG');
      
      // Navigate in the same tab to avoid Pop-up Blockers which cause infinite spinning
      window.location.href = waUrl;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-green-700 text-white p-4 shadow-md sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-green-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/ksa_mart_logo.png" alt="KSA Mart" className="h-10 w-auto rounded-md" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Katalog Publik</h1>
            <p className="text-green-100 text-xs">KSA Mart</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 pb-24">
        
        {isOutsideHours && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl mb-6 shadow-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold text-sm">Di Luar Jam Operasional (07:00 - 19:00)</p>
              <p className="text-xs mt-1 leading-relaxed">
                Saat ini KSA Mart sedang tutup. Anda tetap dapat melakukan pemesanan, namun pesanan Anda akan diproses dan dikirim pada jam operasional kami berikutnya.
              </p>
            </div>
          </div>
        )}
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setActiveTab('CATALOG')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-bold transition-colors ${activeTab === 'CATALOG' ? 'border-b-4 border-green-600 text-green-700' : 'text-slate-500 hover:text-green-600'}`}
          >
            <Package className="w-4 h-4"/> Katalog Belanja
          </button>
          <button 
            onClick={() => setActiveTab('CART')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-bold transition-colors relative ${activeTab === 'CART' ? 'border-b-4 border-green-600 text-green-700' : 'text-slate-500 hover:text-green-600'}`}
          >
            <ShoppingBag className="w-4 h-4"/> Keranjang
            {customerCart.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-rose-500 text-white rounded-full text-xs">{customerCart.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('GUIDE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'GUIDE' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <HelpCircle className="w-4 h-4"/> Panduan & Info
          </button>
        </div>

        {/* Tab: Catalog */}
        {activeTab === 'CATALOG' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Sync Status Messages */}
            {isDataSyncing && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-2xl shadow-sm flex items-center gap-3">
                <Loader className="w-5 h-5 animate-spin" />
                <p className="text-sm font-medium">Menyinkronkan data produk...</p>
              </div>
            )}
            
            {syncError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl shadow-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{syncError}</p>
                  <button 
                    onClick={() => initializeStore().then(() => setSyncError(null)).catch(e => setSyncError('Retry gagal'))}
                    className="text-xs mt-1 underline hover:no-underline"
                  >
                    Coba lagi
                  </button>
                </div>
              </div>
            )}

            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari barang..." 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Loading State */}
            {isDataSyncing && products.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-block">
                  <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-slate-600 text-sm">Memuat produk...</p>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {!isDataSyncing && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map(p => {
                    const inCart = customerCart.find(c => c.product.id === p.id)?.quantity || 0;
                    return (
                      <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                        <div className="h-32 bg-slate-100 relative">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Package className="w-12 h-12" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded text-slate-600 shadow-sm">{p.category}</div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight mb-1 flex-1">{p.name}</h3>
                          <p className="text-green-700 font-black text-lg">Rp {p.price.toLocaleString('id-ID')}</p>
                          <p className="text-xs text-slate-500 mb-3">Stok: {p.stock} {p.unit}</p>
                          
                          {inCart > 0 ? (
                            <div className="flex items-center justify-between bg-green-50 rounded-lg p-1 border border-green-100">
                              <button onClick={() => updateCustomerCartQuantity(p.id, inCart - 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-green-700 font-bold hover:bg-green-100 shadow-sm">-</button>
                              <span className="font-bold text-green-800">{inCart}</span>
                              <button onClick={() => updateCustomerCartQuantity(p.id, inCart + 1)} disabled={inCart >= p.stock} className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-green-700 font-bold hover:bg-green-100 shadow-sm disabled:opacity-50">+</button>
                            </div>
                      ) : (
                        <button 
                          onClick={() => addToCustomerCart(p)}
                          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-1"
                        >
                          <ShoppingBag className="w-4 h-4"/> Tambah
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredProducts.length === 0 && products.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-slate-600 font-bold text-lg mb-2">Belum Ada Produk</p>
                <p className="text-slate-500 text-sm mb-4 px-6">Data produk sedang dimuat dari server. Jika terus kosong, silakan hubungi admin KSA Mart.</p>
                <button 
                  onClick={() => initializeStore().then(() => setSyncError(null)).catch(e => setSyncError('Retry gagal'))}
                  className="text-sm text-green-600 hover:text-green-700 font-bold underline"
                >
                  Refresh Halaman
                </button>
              </div>
            )}
            {filteredProducts.length === 0 && products.length > 0 && (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Tidak ada produk yang sesuai dengan pencarian "{searchQuery}".</p>
              </div>
            )}
              </>
            )}
          </div>
        )}

        {/* Tab: Cart & Checkout */}
        {activeTab === 'CART' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {customerCart.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                <ShoppingBag className="w-20 h-20 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Keranjang Anda Kosong</h3>
                <p className="text-slate-500 mb-6">Silakan pilih produk kebutuhan Anda di Katalog.</p>
                <button onClick={() => setActiveTab('CATALOG')} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700">Kembali ke Katalog</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  {customerCart.map(item => (
                    <div key={item.product.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                       <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                       </div>
                       <div className="flex-1">
                         <h4 className="font-bold text-slate-800 leading-tight">{item.product.name}</h4>
                         <p className="text-green-600 font-bold">Rp {item.product.price.toLocaleString('id-ID')}</p>
                       </div>
                       <div className="flex items-center gap-2">
                         <button onClick={() => updateCustomerCartQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">-</button>
                         <span className="w-6 text-center font-bold">{item.quantity}</span>
                         <button onClick={() => updateCustomerCartQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">+</button>
                         <button onClick={() => removeFromCustomerCart(item.product.id)} className="ml-2 p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                         </button>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-24">
                  <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-2">Informasi Pengiriman</h3>
                  <form onSubmit={handleCheckout} className="space-y-4">
                    {/* Deteksi Lokasi Otomatis */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
                      <p className="font-bold text-blue-800 mb-2">Deteksi Jarak Otomatis (GPS)</p>
                      {customerDistanceKm !== null ? (
                        <p className="text-blue-700">Jarak Anda ke toko KSA Mart: <span className="font-black text-lg">{customerDistanceKm.toFixed(2)} km</span></p>
                      ) : (
                        <p className="text-blue-600 text-xs mb-2">Aktifkan GPS agar kami bisa menghitung jarak pengiriman otomatis.</p>
                      )}
                      <button 
                        type="button"
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                      <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Masukkan Nama Lengkap" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp *</label>
                      <input type="tel" required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Misal: 08123456789" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Pengiriman Lengkap *</label>
                      <textarea required value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none h-20" placeholder="Masukkan alamat lengkap pengiriman..."></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Periode Pengiriman / Pengambilan *</label>
                      <select 
                        value={deliveryPeriod}
                        onChange={e => setDeliveryPeriod(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
                      >
                        <option value="Periode 1 (08.00-09.00)">Periode 1 (08.00 - 09.00)</option>
                        <option value="Periode 2 (11.00-12.00)">Periode 2 (11.00 - 12.00)</option>
                        <option value="Periode 3 (14.00-15.00)">Periode 3 (14.00 - 15.00)</option>
                        <option value="Periode 4 (17.00-18.00)">Periode 4 (17.00 - 18.00)</option>
                        <option value="Periode 5 (20.00-21.00)">Periode 5 (20.00 - 21.00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                      <input type="text" value={checkoutNotes} onChange={e => setCheckoutNotes(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Misal: Tambah sambal, dsb." />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Metode Pembayaran *</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button type="button" onClick={() => setPaymentMethod('COD')} className={`p-2 rounded-lg border text-[10px] font-bold text-center ${paymentMethod === 'COD' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>Bayar di Tempat (COD)</button>
                        <button type="button" onClick={() => setPaymentMethod('TRANSFER')} className={`p-2 rounded-lg border text-[10px] font-bold text-center ${paymentMethod === 'TRANSFER' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>Transfer Bank</button>
                        <button type="button" onClick={() => setPaymentMethod('EWALLET')} className={`p-2 rounded-lg border text-[10px] font-bold text-center ${paymentMethod === 'EWALLET' ? 'bg-purple-100 border-purple-500 text-purple-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>E-Wallet (Dana/OVO)</button>
                        <button type="button" onClick={() => setPaymentMethod('QRIS')} className={`p-2 rounded-lg border text-[10px] font-bold text-center ${paymentMethod === 'QRIS' ? 'bg-fuchsia-100 border-fuchsia-500 text-fuchsia-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>QRIS Toko</button>
                      </div>
                    </div>
                    
                    {/* Panduan Pembayaran Berdasarkan Pilihan */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                        <span className="text-xl">💳</span> Instruksi Pembayaran
                      </p>
                      
                      {paymentMethod === 'COD' && (
                        <p className="text-slate-600 leading-relaxed">
                          Anda memilih <b>Bayar di Tempat (COD)</b>. Silakan siapkan uang pas sebesar <b className="text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</b> saat kurir atau admin kami mengantarkan pesanan ke alamat Anda.
                        </p>
                      )}

                      {paymentMethod === 'TRANSFER' && (
                        <div className="space-y-2">
                          <p className="text-slate-600">Silakan transfer sebesar <b className="text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</b> ke rekening berikut:</p>
                          {(!settings.paymentMethods?.bankTransfer || settings.paymentMethods.bankTransfer.length === 0) ? (
                            <div className="p-3 bg-white rounded border border-blue-200 shadow-sm">
                              <p className="font-bold text-blue-800">Bank Syariah Indonesia (BSI)</p>
                              <p className="font-mono text-base mt-1">7182938495</p>
                              <p className="text-gray-500 mt-1">a.n. KSA Mart Syariah</p>
                            </div>
                          ) : (
                            settings.paymentMethods.bankTransfer.map((b, idx) => (
                              <div key={idx} className="p-3 bg-white rounded border border-blue-200 shadow-sm">
                                <p className="font-bold text-blue-800">{b.bankName}</p>
                                <p className="font-mono text-base mt-1">{b.accountNumber}</p>
                                <p className="text-gray-500 mt-1">a.n. {b.accountName}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {paymentMethod === 'EWALLET' && (
                        <div className="space-y-2">
                          <p className="text-slate-600">Silakan transfer sebesar <b className="text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</b> ke e-wallet berikut:</p>
                          {(!settings.paymentMethods?.ewallet || settings.paymentMethods.ewallet.length === 0) ? (
                            <div className="p-3 bg-white rounded border border-purple-200 shadow-sm">
                              <p className="font-bold text-purple-800">DANA / OVO</p>
                              <p className="font-mono text-base mt-1">Belum diatur oleh toko</p>
                            </div>
                          ) : (
                            settings.paymentMethods.ewallet.map((w, idx) => (
                              <div key={idx} className="p-3 bg-white rounded border border-purple-200 shadow-sm">
                                <p className="font-bold text-purple-800">{w.provider}</p>
                                <p className="font-mono text-base mt-1">{w.number}</p>
                                <p className="text-gray-500 mt-1">a.n. {w.accountName}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {paymentMethod === 'QRIS' && (
                        <div className="space-y-2 flex flex-col items-center">
                          <p className="text-slate-600 text-center w-full">Silakan scan kode QRIS di bawah ini dengan nominal <b className="text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</b>:</p>
                          {settings.qrisImageUrl ? (
                            <img src={settings.qrisImageUrl} alt="QRIS KSA Mart" className="w-full max-w-[200px] h-auto object-contain rounded-xl border-2 border-fuchsia-200 shadow-sm p-1 bg-white" />
                          ) : (
                            <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-center w-full">
                              Toko belum mengunggah kode QRIS. Silakan pilih metode lain.
                            </div>
                          )}
                        </div>
                      )}
                      
                      {paymentMethod !== 'COD' && (
                        <label className="flex items-start gap-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                          <input 
                            type="checkbox" 
                            required 
                            checked={isPaymentConfirmed} 
                            onChange={e => setIsPaymentConfirmed(e.target.checked)} 
                            className="mt-0.5 w-4 h-4 text-blue-600" 
                          />
                          <span className="text-blue-900 font-medium text-xs leading-relaxed">
                            Saya <b>sudah</b> melakukan transfer/pembayaran sebesar Rp {cartTotal.toLocaleString('id-ID')} sesuai instruksi di atas dan siap mengirimkan bukti transfer via WhatsApp ke admin.
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-600 font-medium">Total Belanja</span>
                        <span className="text-xl font-black text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</span>
                      </div>
                      <button 
                        type="submit" 
                        className={`w-full py-3 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-colors ${
                          (paymentMethod !== 'COD' && !isPaymentConfirmed) ? 'bg-slate-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                        }`}
                        disabled={paymentMethod !== 'COD' && !isPaymentConfirmed}
                      >
                        <Send className="w-5 h-5"/> Buat Pesanan Sekarang
                      </button>
                      <p className="text-center text-[10px] text-slate-400 mt-2">Dengan menekan tombol ini, Anda akan otomatis dihubungi oleh Admin kami.</p>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Guide & Info */}
        {activeTab === 'GUIDE' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto mt-8">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
                <HelpCircle className="w-6 h-6 text-green-600" /> Panduan & Informasi Umum
              </h2>
              
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                  <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Jam Operasional & Syarat Ketentuan
                  </h3>
                  <ul className="text-amber-800 text-sm leading-relaxed space-y-2 list-disc list-inside">
                    <li><strong>Jam Operasional KSA Mart:</strong> 07.00 - 19.00 WIB setiap hari.</li>
                    <li>Pesanan yang masuk <strong>di luar jam operasional</strong> akan otomatis diproses dan dikirimkan pada jam kerja operasional berikutnya.</li>
                    <li>Layanan pesan antar (delivery) berlaku untuk jarak <strong>maksimal 5 KM</strong> dari lokasi KSA Mart.</li>
                    <li>Pastikan alamat pengiriman Anda sudah benar dan nomor HP / WhatsApp Anda aktif untuk memudahkan kurir/kasir melakukan konfirmasi pesanan.</li>
                    <li>Pembayaran dapat dilakukan melalui transfer atau QRIS sesuai yang diinstruksikan oleh admin kami melalui WhatsApp.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-green-800 mb-2">1. Pilih Barang Anda</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Lihat daftar barang kami di <strong>Katalog Belanja</strong>. Tekan tombol "Tambah" di barang yang ingin dibeli. Anda juga bisa menggunakan fitur pencarian untuk menemukan produk tertentu.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-green-800 mb-2">2. Cek Keranjang & Isi Alamat</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Setelah selesai memilih, buka tab <strong>Keranjang</strong>. Pastikan jumlah barang sudah sesuai. Lalu isikan data diri lengkap Anda: <strong>Nama Lengkap, Nomor WhatsApp, dan Alamat Pengiriman</strong>.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-green-800 mb-2">3. Buat Pesanan & Bayar via WhatsApp</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Tekan tombol "Buat Pesanan". <strong>Sistem akan otomatis mengarahkan Anda ke aplikasi WhatsApp</strong> dengan format pesanan yang sudah rapi. Anda bisa langsung chat dengan Admin Toko, mengirimkan bukti pembayaran, dan melacak status pengiriman.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 💬 Tombol WhatsApp Floating — Selalu Terlihat */}
      {settings.ownerWhatsapp && (
        <a
          href={`https://wa.me/${settings.ownerWhatsapp.replace(/^0/, '62')}?text=${encodeURIComponent('Assalamu\'alaikum Admin KSA Mart, saya ingin bertanya tentang produk/pesanan.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group"
          title="Chat WhatsApp dengan Admin KSA Mart"
          id="wa-float-btn"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            Chat Admin
          </span>
        </a>
      )}
    </div>
  );
}
