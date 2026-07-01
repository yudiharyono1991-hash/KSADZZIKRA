import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ShoppingBag, CreditCard, History, Search, MessageSquare, Send, CheckCircle, Package, ArrowLeft, LogOut } from 'lucide-react';

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
    sendChatMessage
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CATALOG' | 'CART' | 'ORDERS'>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');

  // Protect route loosely
  if (!currentUser || currentUser.role !== 'PELANGGAN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Akses Ditolak</h1>
        <p className="text-slate-600 mb-4">Anda harus login sebagai Pelanggan/Anggota Koperasi.</p>
        <button onClick={logout} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">Kembali ke Login</button>
      </div>
    );
  }

  const myOrders = onlineOrders.filter(o => o.customerName === currentUser.name);
  const totalUtang = 0; // In a full implementation, this connects to the Customer's debtAmount
  const totalBelanja = myOrders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.totalAmount, 0);

  const cartTotal = customerCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const filteredProducts = products.filter(p => p.stock > 0 && p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCheckout = () => {
    if (customerCart.length === 0) return;
    submitOnlineOrder(currentUser.username, currentUser.name, "08xxxx", checkoutNotes);
    alert("Pesanan berhasil dibuat! Notifikasi WhatsApp telah dikirim ke Admin/Toko.");
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
      <header className="bg-emerald-700 text-white p-4 shadow-md sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-emerald-800 font-black text-xl">BA</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Member Portal</h1>
            <p className="text-emerald-100 text-xs">Berkah Amanah Mart</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium hidden sm:block">Ahlan wa Sahlan, {currentUser.name}</span>
          <button onClick={logout} className="p-2 bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors" title="Keluar">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'DASHBOARD' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <CreditCard className="w-4 h-4"/> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('CATALOG')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'CATALOG' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <Package className="w-4 h-4"/> Katalog Belanja
          </button>
          <button 
            onClick={() => setActiveTab('CART')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === 'CART' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <ShoppingBag className="w-4 h-4"/> Keranjang
            {customerCart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-black border-2 border-white">{customerCart.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('ORDERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'ORDERS' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <History className="w-4 h-4"/> Pesanan Saya
          </button>
        </div>

        {/* Tab: Dashboard */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><ShoppingBag className="w-24 h-24"/></div>
                <p className="text-emerald-100 font-medium mb-1">Total Belanja Selesai</p>
                <h3 className="text-3xl font-black">Rp {totalBelanja.toLocaleString('id-ID')}</h3>
                <p className="text-sm text-emerald-200 mt-4 bg-black/20 inline-block px-3 py-1 rounded-full">Member Koperasi Aktif</p>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-red-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><CreditCard className="w-24 h-24"/></div>
                <p className="text-rose-100 font-medium mb-1">Total Tagihan / Utang Koperasi</p>
                <h3 className="text-3xl font-black">Rp {totalUtang.toLocaleString('id-ID')}</h3>
                <button className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-colors">Lunasi Tagihan</button>
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
                        <p className="font-bold text-emerald-700 text-sm">Rp {o.totalAmount.toLocaleString('id-ID')}</p>
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
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                      <p className="text-emerald-700 font-black text-lg">Rp {p.price.toLocaleString('id-ID')}</p>
                      <p className="text-xs text-slate-500 mb-3">Stok: {p.stock} {p.unit}</p>
                      
                      {inCart > 0 ? (
                        <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-1 border border-emerald-100">
                          <button onClick={() => updateCustomerCartQuantity(p.id, inCart - 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-emerald-700 font-bold hover:bg-emerald-100 shadow-sm">-</button>
                          <span className="font-bold text-emerald-800">{inCart}</span>
                          <button onClick={() => updateCustomerCartQuantity(p.id, inCart + 1)} disabled={inCart >= p.stock} className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-emerald-700 font-bold hover:bg-emerald-100 shadow-sm disabled:opacity-50">+</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCustomerCart(p)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-1"
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

        {/* Tab: Cart */}
        {activeTab === 'CART' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-in fade-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-emerald-600"/> Keranjang Belanja
            </h2>
            
            {customerCart.length === 0 ? (
              <div className="text-center py-10">
                <Package className="w-16 h-16 text-slate-200 mx-auto mb-4"/>
                <p className="text-slate-500">Keranjang masih kosong.</p>
                <button onClick={() => setActiveTab('CATALOG')} className="mt-4 text-emerald-600 font-bold hover:underline">Belanja Sekarang</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {customerCart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-4 py-4 border-b border-slate-100">
                      <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                         {item.product.image ? <img src={item.product.image} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-slate-300 m-auto mt-4" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{item.product.name}</h4>
                        <p className="text-emerald-700 font-bold">Rp {item.product.price.toLocaleString('id-ID')}</p>
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
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Catatan Pesanan (Opsional)</label>
                    <input 
                      type="text" 
                      value={checkoutNotes}
                      onChange={e => setCheckoutNotes(e.target.value)}
                      placeholder="Misal: Tolong dibungkus rapi, diambil sore..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <span className="font-bold text-slate-600">Total Pembayaran</span>
                    <span className="text-2xl font-black text-emerald-700">Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
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
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History className="w-5 h-5 text-emerald-600"/> Riwayat Pesanan</h3>
              <div className="space-y-3">
                {myOrders.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-4">Belum ada riwayat pesanan.</p>
                ) : (
                  myOrders.map(o => (
                    <div 
                      key={o.id} 
                      onClick={() => setSelectedOrderId(o.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-colors ${selectedOrderId === o.id ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-slate-800 text-sm">{o.orderNo}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${o.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : o.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-emerald-700 font-bold text-sm">Rp {o.totalAmount.toLocaleString('id-ID')}</p>
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
                        <p className="text-sm text-slate-500">Total: Rp {order.totalAmount.toLocaleString('id-ID')} | Status: <strong className="text-emerald-700">{order.status}</strong></p>
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
                              <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                                {!isMe && <p className="text-[10px] font-bold text-emerald-700 mb-1">{msg.senderName}</p>}
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
                        className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                      />
                      <button type="submit" disabled={!chatText.trim()} className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
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

      </main>
    </div>
  );
}

// Plus Icon missing fix
const Plus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
