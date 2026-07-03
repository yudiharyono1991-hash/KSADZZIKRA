import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ShoppingBag, Package, ArrowLeft, Send, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KatalogUmumPage() {
  const { 
    products, 
    customerCart, 
    addToCustomerCart, 
    updateCustomerCartQuantity, 
    removeFromCustomerCart, 
    submitOnlineOrder,
    settings
  } = useAppStore();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'CATALOG' | 'CART' | 'GUIDE'>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  const cartTotal = customerCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const filteredProducts = products.filter(p => p.stock > 0 && p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerCart.length === 0) return;
    
    // We use a generated ID since it's a public user
    const customerId = `public_${Date.now()}`;
    
    submitOnlineOrder(
      customerId, 
      customerName, 
      customerPhone, 
      checkoutNotes,
      customerAddress
    );
    
    alert("Pesanan berhasil dibuat! Admin kami akan segera menghubungi WhatsApp Anda.");
    
    // Reset Form
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCheckoutNotes('');
    setActiveTab('CATALOG');
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
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
        
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
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-bold transition-colors ${activeTab === 'GUIDE' ? 'border-b-4 border-green-600 text-green-700' : 'text-slate-500 hover:text-green-600'}`}
          >
            <HelpCircle className="w-4 h-4"/> Cara Pesan
          </button>
        </div>

        {/* Tab: Catalog */}
        {activeTab === 'CATALOG' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari barang..." 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
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
                          <ShoppingBag className="w-4 h-4"/> Tambah
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Tidak ada produk yang sesuai pencarian.</p>
              </div>
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Pesanan (Opsional)</label>
                      <input type="text" value={checkoutNotes} onChange={e => setCheckoutNotes(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Misal: Tambah sambal, dsb." />
                    </div>
                    
                    {/* Panduan Pembayaran */}
                    <div className="bg-green-50/50 border border-green-200/50 rounded-xl p-3 text-xs space-y-2">
                      <p className="font-bold text-green-800 flex items-center gap-1.5">
                        <span className="text-green-700">💳</span> Metode Pembayaran
                      </p>
                      <div className="space-y-1.5 text-gray-700">
                        {(!settings.paymentMethods?.bankTransfer || settings.paymentMethods.bankTransfer.length === 0) && 
                         (!settings.paymentMethods?.ewallet || settings.paymentMethods.ewallet.length === 0) ? (
                          <div className="p-2 bg-white rounded border border-green-100 shadow-xs">
                            <p className="font-bold text-green-800">Transfer Bank Syariah (BSI)</p>
                            <p className="text-[11px] font-mono">No. Rek: <span className="font-bold text-slate-900">7182938495</span></p>
                            <p className="text-[10px] text-gray-500">a.n. KSA Mart Syariah</p>
                          </div>
                        ) : (
                          <>
                            {settings.paymentMethods?.bankTransfer?.map((b, idx) => (
                              <div key={idx} className="p-2 bg-white rounded border border-green-100 shadow-xs">
                                <p className="font-bold text-green-800">{b.bankName}</p>
                                <p className="text-[11px] font-mono">No. Rek: <span className="font-bold text-slate-900">{b.accountNumber}</span></p>
                                <p className="text-[10px] text-gray-500">a.n. {b.accountName}</p>
                              </div>
                            ))}
                            {settings.paymentMethods?.ewallet?.map((w, idx) => (
                              <div key={idx} className="p-2 bg-white rounded border border-green-100 shadow-xs">
                                <p className="font-bold text-purple-800">{w.provider}</p>
                                <p className="text-[11px] font-mono">No / ID: <span className="font-bold text-slate-900">{w.number}</span></p>
                                <p className="text-[10px] text-gray-500">a.n. {w.accountName}</p>
                              </div>
                            ))}
                          </>
                        )}
                        <p className="text-[10px] text-gray-500 italic mt-1 leading-relaxed">
                          * Silakan lakukan transfer ke rekening/ewallet di atas. Admin kami akan segera memproses & mengonfirmasi pesanan Anda via WhatsApp.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-600 font-medium">Total Belanja</span>
                        <span className="text-xl font-black text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</span>
                      </div>
                      <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-colors">
                        <Send className="w-5 h-5"/> Buat Pesanan
                      </button>
                      <p className="text-center text-[10px] text-slate-400 mt-2">Dengan menekan tombol ini, Anda akan dihubungi oleh Admin kami.</p>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Guide */}
        {activeTab === 'GUIDE' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto mt-8">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
                <HelpCircle className="w-6 h-6 text-green-600" /> Panduan Pemesanan (Pelanggan Umum)
              </h2>
              
              <div className="space-y-6">
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
                  <h3 className="font-bold text-green-800 mb-2">3. Buat Pesanan</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Tekan tombol "Buat Pesanan". Sistem akan menyimpan pesanan Anda dan <strong>Admin Toko KSA Mart akan langsung menghubungi nomor WhatsApp Anda</strong> untuk memproses pembayaran dan pengiriman barang.
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
