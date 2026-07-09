import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ShoppingBag, CreditCard, History, Search, MessageSquare, Send, CheckCircle, Package, ArrowLeft, LogOut, HelpCircle, Tag, AlertTriangle, MapPin } from 'lucide-react';
import { calculateDistanceKm } from '../utils/distance';

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
    settings
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CATALOG' | 'PROMO' | 'CART' | 'ORDERS' | 'POINTS' | 'GUIDE'>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [deliveryPeriod, setDeliveryPeriod] = useState('Periode 1 (08.00-09.00)');
  const [customerDistanceKm, setCustomerDistanceKm] = useState<number | null>(null);
    const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');

  const [isOutsideHours, setIsOutsideHours] = useState(false);

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

  const { customers, promos } = useAppStore();

  // Protect route loosely
  if (!currentUser || currentUser.role !== 'PELANGGAN') {
    const isAdmin = currentUser && currentUser.role !== 'PELANGGAN';
    
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Akses Ditolak</h1>
          {isAdmin ? (
            <>
              <p className="text-slate-600 mb-6">
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
              <p className="text-slate-600 mb-6">Anda harus login sebagai Pelanggan/Anggota Koperasi untuk mengakses halaman ini.</p>
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

  const filteredProducts = products.filter(p => p.stock > 0 && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
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
    
    // Asumsikan semua pesanan di portal pelanggan menggunakan transfer/QRIS untuk simplicity mock
    const paymentCode = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const finalNotes = `[WAKTU PENGIRIMAN: ${deliveryPeriod}] ${checkoutNotes ? checkoutNotes : ''}`;
    submitOnlineOrder(currentUser.username, currentUser.name, currentUser.username || "08xxxx", finalNotes, undefined, paymentCode, customerDistanceKm || undefined);
    
    let savedAmount = 0;
    customerCart.forEach(item => {
      const prod = products.find(p => p.id === item.product.id);
      if (prod && prod.price > item.product.price) {
        savedAmount += (prod.price - item.product.price) * item.quantity;
      }
    });

    const waNumber = settings.ownerWhatsapp?.replace(/^0/, '62');
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-green-700 text-white p-4 shadow-md sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/ksa_mart_logo.png" alt="KSA Mart" className="h-10 w-auto rounded-md" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Member Portal</h1>
            <p className="text-green-100 text-xs">KSA Mart</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium hidden sm:block">Ahlan wa Sahlan, {currentUser.name}</span>
          <button onClick={() => {
            if (window.confirm("Apakah Anda yakin ingin keluar dari Member Portal? Anda harus login kembali setelah ini.")) {
              logout();
            }
          }} className="p-2 bg-green-800 hover:bg-green-900 rounded-lg transition-colors" title="Keluar">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
        
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
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'DASHBOARD' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'}`}
          >
            <CreditCard className="w-4 h-4"/> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('CATALOG')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'CATALOG' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'}`}
          >
            <Package className="w-4 h-4"/> Katalog Belanja
          </button>
          <button 
            onClick={() => setActiveTab('PROMO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'PROMO' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'}`}
          >
            <Tag className="w-4 h-4"/> Promo Spesial
          </button>
          <button 
            onClick={() => setActiveTab('CART')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === 'CART' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'}`}
          >
            <ShoppingBag className="w-4 h-4"/> Keranjang
            {customerCart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-black border-2 border-white">{customerCart.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('ORDERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'ORDERS' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'}`}
          >
            <History className="w-4 h-4"/> Pesanan Saya
          </button>
          <button 
            onClick={() => setActiveTab('POINTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'POINTS' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'}`}
          >
            <Tag className="w-4 h-4"/> Riwayat Poin
          </button>
          <button 
            onClick={() => setActiveTab('GUIDE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'GUIDE' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'}`}
          >
            <HelpCircle className="w-4 h-4"/> Panduan & Info
          </button>
        </div>

        {/* Tab: Dashboard */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-600 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><ShoppingBag className="w-24 h-24"/></div>
                <p className="text-green-100 font-medium mb-1">Total Belanja</p>
                <h3 className="text-3xl font-black">Rp {totalBelanja.toLocaleString('id-ID')}</h3>
                <p className="text-xs text-green-200 mt-4 bg-black/20 inline-block px-3 py-1 rounded-full">
                  {myCustomerProfile?.isKoperasiMember ? 'Anggota Koperasi Syariah' : 'Pelanggan Umum'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Tag className="w-24 h-24"/></div>
                <p className="text-blue-100 font-medium mb-1">Total Hemat & Diskon</p>
                <h3 className="text-3xl font-black">Rp {totalHemat.toLocaleString('id-ID')}</h3>
                <p className="text-[10px] text-blue-200 mt-4 bg-black/20 inline-block px-2 py-1 rounded-full">Akumulasi dari Promo & Grosir</p>
              </div>
              <div className="bg-gradient-to-br from-fuchsia-600 to-purple-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Tag className="w-24 h-24"/></div>
                <p className="text-fuchsia-100 font-medium mb-1">Loyalitas Poin</p>
                <h3 className="text-3xl font-black">{points} Poin</h3>
                <p className="text-xs text-fuchsia-200 mt-4 bg-black/20 inline-block px-3 py-1 rounded-full">Senilai Rp {(points * 10).toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-red-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><CreditCard className="w-24 h-24"/></div>
                <p className="text-rose-100 font-medium mb-1">Tagihan/Utang Koperasi</p>
                <h3 className="text-3xl font-black">Rp {totalUtang.toLocaleString('id-ID')}</h3>
                <button 
                  onClick={() => alert(`Harap hubungi kasir/toko KSA Mart dengan menyebutkan nama: ${currentUser.name} untuk pembayaran tagihan kasbon sebesar Rp ${totalUtang.toLocaleString('id-ID')}.`)}
                  className="mt-4 bg-white/25 hover:bg-white/35 text-white px-4 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  Bayar Tagihan
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Pesanan Aktif Terbaru</h3>
              <div className="space-y-3">
                {myOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Tidak ada pesanan aktif saat ini.</p>
                ) : (
                  myOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').slice(0,3).map(o => (
                    <div key={o.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors" onClick={() => setActiveTab('ORDERS')}>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{o.orderNo}</p>
                        <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString('id-ID')}</p>
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

        {/* Tab: Catalog */}
        {activeTab === 'CATALOG' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3"/>
              <input 
                type="text" 
                placeholder="Cari barang kebutuhan Anda..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

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
                          <Plus className="w-4 h-4"/> Tambah
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Promo */}
        {activeTab === 'PROMO' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Voucher Promos */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Kupon & Voucher Belanja</h2>
              {promos.filter(pr => pr.isActive).length === 0 ? (
                <p className="text-sm text-slate-500 italic">Tidak ada voucher promo aktif saat ini.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promos.filter(pr => pr.isActive).map(pr => (
                    <div key={pr.id} className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="bg-amber-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded inline-block mb-2">VOUCHER BELANJA</div>
                        <h4 className="font-bold text-slate-850 text-base">{pr.name}</h4>
                        <p className="text-xs text-slate-600 mt-1">Potongan: <strong className="text-green-700">{pr.type === 'PERCENTAGE' ? `${pr.value}%` : `Rp ${pr.value.toLocaleString('id-ID')}`}</strong></p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Min. Belanja: Rp {pr.minPurchase.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="text-[9px] text-amber-800 font-bold mt-3 bg-amber-100/50 p-1.5 rounded text-center">Gunakan saat checkout di kasir dengan menyebutkan promo ini</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Promo Products */}
            <div className="space-y-4 pt-6">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Produk dengan Harga Grosir</h2>
              {promoProducts.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Tidak ada produk grosir saat ini.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {promoProducts.map(p => {
                    const inCart = customerCart.find(c => c.product.id === p.id)?.quantity || 0;
                    return (
                      <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow relative">
                        <div className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-sm z-10">GROSIR</div>
                        <div className="h-32 bg-slate-100 relative">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&color=fff&size=200&bold=true`} alt={p.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight mb-1 flex-1">{p.name}</h3>
                          <div className="mb-2">
                            <p className="text-[10px] text-slate-400 line-through">Rp {p.price.toLocaleString('id-ID')}</p>
                            <p className="text-green-700 font-black text-base">Rp {p.wholesalePrice?.toLocaleString('id-ID')} <span className="text-[9px] font-normal text-slate-500">/ {p.unit}</span></p>
                            <p className="text-[9px] text-amber-700 font-bold">Min. Beli: {p.wholesaleMinQty} {p.unit}</p>
                          </div>
                          {inCart > 0 ? (
                            <div className="flex items-center justify-between bg-green-50 rounded-lg p-1 border border-green-100">
                              <button onClick={() => updateCustomerCartQuantity(p.id, inCart - 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-green-700 font-bold hover:bg-green-100 shadow-sm">-</button>
                              <span className="font-bold text-green-800">{inCart}</span>
                              <button onClick={() => updateCustomerCartQuantity(p.id, inCart + 1)} disabled={inCart >= p.stock} className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-green-700 font-bold hover:bg-green-100 shadow-sm disabled:opacity-50">+</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCustomerCart(p)}
                              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-4 h-4"/> Tambah
                            </button>
                          )}
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-in fade-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-green-600"/> Keranjang Belanja
            </h2>
            
            {customerCart.length === 0 ? (
              <div className="text-center py-10">
                <Package className="w-16 h-16 text-slate-200 mx-auto mb-4"/>
                <p className="text-slate-500">Keranjang masih kosong.</p>
                <button onClick={() => setActiveTab('CATALOG')} className="mt-4 text-green-600 font-bold hover:underline">Belanja Sekarang</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {customerCart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-4 py-4 border-b border-slate-100">
                      <div className="w-20 h-20 bg-slate-100 rounded-xl flex-shrink-0 border border-slate-200 overflow-hidden relative">
                         {item.product.image ? (
                           <img src={item.product.image} className="w-full h-full object-cover" />
                         ) : (
                           <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.product.name)}&background=random&color=fff&size=200&bold=true`} className="w-full h-full object-cover" />
                         )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{item.product.name}</h4>
                        <p className="text-green-700 font-bold">Rp {item.product.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                          <button onClick={() => updateCustomerCartQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 bg-white rounded shadow-sm text-slate-700 font-bold">-</button>
                          <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                          <button onClick={() => updateCustomerCartQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock} className="w-8 h-8 bg-white rounded shadow-sm text-slate-700 font-bold disabled:opacity-50">+</button>
                        </div>
                        <p className="font-bold text-slate-800 w-24 text-right">Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
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
                    <label className="block text-sm font-bold text-slate-700 mb-1">Periode Pengiriman / Pengambilan</label>
                    <select 
                      value={deliveryPeriod}
                      onChange={e => setDeliveryPeriod(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white mb-4"
                    >
                      <option value="Periode 1 (08.00-09.00)">Periode 1 (08.00 - 09.00)</option>
                      <option value="Periode 2 (11.00-12.00)">Periode 2 (11.00 - 12.00)</option>
                      <option value="Periode 3 (14.00-15.00)">Periode 3 (14.00 - 15.00)</option>
                      <option value="Periode 4 (17.00-18.00)">Periode 4 (17.00 - 18.00)</option>
                      <option value="Periode 5 (20.00-21.00)">Periode 5 (20.00 - 21.00)</option>
                    </select>

                    <label className="block text-sm font-bold text-slate-700 mb-1">Catatan Pesanan (Opsional)</label>
                    <input 
                      type="text" 
                      value={checkoutNotes}
                      onChange={e => setCheckoutNotes(e.target.value)}
                      placeholder="Misal: Tolong dibungkus rapi, diambil sore..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  
                  {/* Panduan Pembayaran */}
                  <div className="bg-green-50/50 border border-green-200/50 rounded-xl p-3 text-xs space-y-2">
                    <p className="font-bold text-green-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-green-700"/> Metode Pembayaran
                    </p>
                    <div className="space-y-1.5 text-gray-700">
                      {(!settings.paymentMethods?.bankTransfer || settings.paymentMethods.bankTransfer.length === 0) && 
                       (!settings.paymentMethods?.ewallet || settings.paymentMethods.ewallet.length === 0) ? (
                        <div className="p-2 bg-white rounded border border-green-100">
                          <p className="font-bold text-green-800">Transfer Bank Syariah (BSI)</p>
                          <p className="text-[11px] font-mono">No. Rek: <span className="font-bold text-slate-900">7182938495</span></p>
                          <p className="text-[10px] text-gray-500">a.n. KSA Mart Syariah</p>
                        </div>
                      ) : (
                        <>
                          {settings.paymentMethods?.bankTransfer?.map((b, idx) => (
                            <div key={idx} className="p-2 bg-white rounded border border-green-100">
                              <p className="font-bold text-green-800">{b.bankName}</p>
                              <p className="text-[11px] font-mono">No. Rek: <span className="font-bold text-slate-900">{b.accountNumber}</span></p>
                              <p className="text-[10px] text-gray-500">a.n. {b.accountName}</p>
                            </div>
                          ))}
                          {settings.paymentMethods?.ewallet?.map((w, idx) => (
                            <div key={idx} className="p-2 bg-white rounded border border-green-100">
                              <p className="font-bold text-purple-800">{w.provider}</p>
                              <p className="text-[11px] font-mono">No / ID: <span className="font-bold text-slate-900">{w.number}</span></p>
                              <p className="text-[10px] text-gray-500">a.n. {w.accountName}</p>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {settings.qrisImageUrl && (
                        <div className="p-2 bg-white rounded border border-green-100 flex flex-col items-center">
                          <p className="font-bold text-slate-800 text-center mb-2">Scan QRIS</p>
                          <img src={settings.qrisImageUrl} alt="QRIS KSA Mart" className="w-full max-w-[200px] h-auto object-contain rounded" />
                        </div>
                      )}
                      <p className="text-[10px] text-gray-500 italic mt-1">
                        * Silakan lakukan transfer sesuai total belanja Anda. Setelah memesan, Admin akan segera memproses dan mengonfirmasi pesanan Anda via WhatsApp.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <span className="font-bold text-slate-600">Total Pembayaran</span>
                    <span className="text-2xl font-black text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</span>
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
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-y-auto max-h-[70vh]">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History className="w-5 h-5 text-green-600"/> Riwayat Pesanan</h3>
              <div className="space-y-3">
                {myOrders.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-4">Belum ada riwayat pesanan.</p>
                ) : (
                  myOrders.map(o => (
                    <div 
                      key={o.id} 
                      onClick={() => setSelectedOrderId(o.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-colors ${selectedOrderId === o.id ? 'bg-green-50 border-green-300 shadow-sm' : 'bg-white border-slate-100 hover:border-green-200 hover:bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-slate-800 text-sm">{o.orderNo}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${o.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : o.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-green-700 font-bold text-sm">Rp {o.totalAmount.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(o.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detail Pesanan & Chat */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[70vh]">
              {selectedOrderId ? (() => {
                const order = myOrders.find(o => o.id === selectedOrderId);
                if (!order) return null;
                const msgs = chatMessages.filter(m => m.orderId === selectedOrderId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                
                return (
                  <>
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-2xl">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{order.orderNo}</h3>
                        <p className="text-sm text-slate-500">Total: Rp {order.totalAmount.toLocaleString('id-ID')} | Status: <strong className="text-green-700">{order.status}</strong></p>
                      </div>
                      <button onClick={() => setSelectedOrderId(null)} className="text-slate-400 hover:text-slate-600 lg:hidden"><ArrowLeft className="w-6 h-6"/></button>
                    </div>
                    
                    {/* Items List (Brief) */}
                    <div className="p-4 border-b border-slate-100 max-h-32 overflow-y-auto">
                      <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Item Dibeli:</p>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700">{item.quantity}x {item.productName}</span>
                          <span className="font-medium">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3">
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
                              <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-green-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
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
                    <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 bg-white rounded-b-2xl flex gap-2">
                      <input 
                        type="text" 
                        value={chatText}
                        onChange={e => setChatText(e.target.value)}
                        placeholder="Ketik pesan untuk admin toko..."
                        className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-slate-50 focus:bg-white transition-colors"
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
                  <h3 className="font-bold text-slate-600 mb-1">Pilih Pesanan</h3>
                  <p className="text-sm">Klik salah satu pesanan di sebelah kiri untuk melihat detail atau menghubungi admin toko.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Tab: Points */}
        {activeTab === 'POINTS' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-fuchsia-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Tag className="w-24 h-24"/></div>
              <p className="text-fuchsia-100 font-medium mb-1">Total Poin Terkumpul</p>
              <h3 className="text-4xl font-black">{points} Poin</h3>
              <p className="text-sm text-fuchsia-200 mt-2 bg-black/20 inline-block px-3 py-1 rounded-full">
                Senilai Rp {(points * 10).toLocaleString('id-ID')}
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500" /> Riwayat Perolehan Poin
              </h3>
              <div className="space-y-3">
                {myOrders.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-4">Belum ada riwayat transaksi yang menghasilkan poin.</p>
                ) : (
                  myOrders.map(o => (
                    <div key={o.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-700 text-sm">Transaksi {o.orderNo}</p>
                        <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString('id-ID')}</p>
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
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
                <HelpCircle className="w-6 h-6 text-green-600" /> Pusat Bantuan & Informasi Pelanggan
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
                  <h3 className="font-bold text-green-800 mb-2">1. Cara Memesan Barang</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Buka tab <strong>Katalog Belanja</strong>, cari barang yang Anda butuhkan, lalu klik tombol "Tambah" untuk memasukkan barang ke Keranjang. Setelah selesai memilih, buka tab <strong>Keranjang</strong>, periksa daftar belanjaan Anda, dan klik tombol "Checkout". Pesanan akan diteruskan ke admin KSA Mart.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-green-800 mb-2">2. Memantau Status Pesanan & Chat Admin</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Buka tab <strong>Pesanan Saya</strong> untuk melihat status pesanan (PENDING, diproses, atau selesai). Klik pada salah satu pesanan untuk melihat detail barang. Di halaman detail pesanan, Anda bisa menggunakan fitur <strong>Chat / Diskusi</strong> untuk bertanya atau memberi catatan tambahan langsung kepada kasir yang bertugas.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-green-800 mb-2">3. Tagihan & Poin Loyalitas</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
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
    </div>
  );
}

// Plus Icon missing fix
const Plus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
