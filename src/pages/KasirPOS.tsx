import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Product } from '../types';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  CheckCircle, 
  Plus, 
  Minus, 
  Coins, 
  QrCode, 
  CreditCard,
  Building,
  Check,
  AlertCircle,
  Package,
  Users,
  AlertTriangle
} from 'lucide-react';

export default function KasirPOS() {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    checkout,
    customers,
    promos,
    settings,
    activeBranchId
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI' | 'KASBON'>('CASH');
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [receiptTx, setReceiptTx] = useState<any>(null); // To show transaction receipt after checkout
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Payment Simulation States for Presentation
  const [isQrisSimulated, setIsQrisSimulated] = useState(false);
  const [isTransferSimulated, setIsTransferSimulated] = useState(false);
  const [transferSenderName, setTransferSenderName] = useState('');
  
  const [qrisScanMode, setQrisScanMode] = useState<'MERCHANT' | 'CUSTOMER'>('MERCHANT');
  const [scannedCustomerToken, setScannedCustomerToken] = useState('');
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');

  // Categories
  const categories = ['ALL', 'Sembako', 'Fresh Food', 'Minuman', 'Kebutuhan Rumah'];

  // Filtered Products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesBranch = !activeBranchId || product.branchId === activeBranchId || !product.branchId;
    return matchesSearch && matchesCategory && matchesBranch;
  });

  const getDynamicPrice = (item: any) => {
    if (item.product.wholesalePrice && item.product.wholesaleMinQty && item.quantity >= item.product.wholesaleMinQty) {
      return item.product.wholesalePrice;
    }
    return item.product.price;
  };

  const baseTotal = cart.reduce((sum, item) => sum + (getDynamicPrice(item) * item.quantity), 0);

  const selectedPromo = promos.find(p => p.id === selectedPromoId);
  let discountAmount = 0;
  if (selectedPromo && selectedPromo.isActive && baseTotal >= selectedPromo.minPurchase) {
    if (selectedPromo.type === 'PERCENTAGE') {
      discountAmount = baseTotal * (selectedPromo.value / 100);
    } else {
      discountAmount = selectedPromo.value;
    }
  }

  let cartTotal = baseTotal - discountAmount;
  let taxAmount = 0;
  if (settings.isTaxEnabled) {
    taxAmount = cartTotal * (settings.taxRate / 100);
    cartTotal += taxAmount;
  }

  const handleCheckoutSubmit = () => {
    let finalPaymentMethod: any = paymentMethod;
    let finalAmountPaid = paymentMethod === 'CASH' ? Number(amountPaidInput) : cartTotal;
    let splitParams = undefined;

    if (finalAmountPaid < cartTotal) {
      alert("Jumlah uang dibayarkan kurang dari total belanja.");
      return;
    }
    
    const tx = checkout({
      paymentMethod: finalPaymentMethod,
      amountPaid: finalAmountPaid,
      customerId: selectedCustomerId || undefined,
      promoId: selectedPromoId || undefined,
      splitPayments: splitParams
    });
    if (tx) {
      setReceiptTx(tx);
      setAmountPaidInput('');
    } else {
      alert("Sistem POS mendapati kegagalan sirkulasi transaksi. Periksa kembali stok barang.");
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    if (!receiptTx) return;
    if (!customerPhone) {
      alert("Silakan masukkan nomor WhatsApp pelanggan terlebih dahulu.");
      return;
    }
    
    // Format nomor HP agar menggunakan kode negara (mengubah 0 di depan ke 62)
    let formattedPhone = customerPhone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    
    const itemsText = receiptTx.items.map((it: any) => 
      `• ${it.productName} (${it.quantity}x @ Rp ${it.price.toLocaleString('id-ID')}) -> Rp ${(it.price * it.quantity).toLocaleString('id-ID')}`
    ).join('\n');
    
    const textMessage = `🕌 *Toko Berkah Amanah Mart* 🕌\n` +
      `Toko Berkah Amanah Mart, Indonesia\n` +
      `Telp: 082210027952\n` +
      `===============================\n` +
      `📄 *No Invoice:* ${receiptTx.invoiceNo}\n` +
      `⏰ *Waktu:* ${new Date(receiptTx.timestamp).toLocaleString('id-ID')}\n` +
      `👤 *Kasir:* ${receiptTx.cashierName}\n` +
      `💳 *Metode:* ${receiptTx.paymentMethod}\n` +
      `===============================\n\n` +
      `===============================\n\n` +
      `${itemsText}\n\n` +
      `===============================\n` +
      `===============================\n` +
      (receiptTx.discountAmount > 0 ? `🎊 *Diskon Promo:* -Rp ${receiptTx.discountAmount.toLocaleString('id-ID')}\n` : '') +
      (receiptTx.taxAmount > 0 ? `🧾 *Pajak:* Rp ${receiptTx.taxAmount.toLocaleString('id-ID')}\n` : '') +
      `💰 *Total Belanja:* Rp ${receiptTx.totalAmount.toLocaleString('id-ID')}\n` +
      `💵 *Uang Diterima:* Rp ${receiptTx.amountPaid.toLocaleString('id-ID')}\n` +
      `🪙 *Uang Kembali:* Rp ${receiptTx.changeAmount.toLocaleString('id-ID')}\n\n` +
      `*Misi Berkah Beramal:*\n` +
      `Zakat Kontribusi Sebesar *Rp ${receiptTx.zakatContribution.toLocaleString('id-ID')}* dari transaksi ini dicadangkan untuk kaum Dhuafa. Terima kasih atas kepercayaan Anda membeli barang halal di Toko Berkah Amanah Mart. Semoga berkah!`;

    const encodedText = encodeURIComponent(textMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 h-auto md:h-[calc(100vh-120px)]">
      {/* Product Catalog Grid - Left */}
      <div className="md:col-span-7 lg:col-span-8 flex flex-col h-[55vh] md:h-full space-y-4">
        {/* Search & Filter Header */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600"
              placeholder="Cari item berdasar nama produk / SKU / No Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog List scrollable area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Produk tidak ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const cartQty = cart.find(c => c.product.id === p.id)?.quantity || 0;
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock <= p.minStock && p.stock > 0;

                return (
                  <div 
                    key={p.id}
                    className={`bg-white rounded-xl border flex flex-col overflow-hidden transition-all relative ${
                      isOutOfStock ? 'opacity-65 border-gray-200' : 'border-gray-200 hover:shadow-md hover:border-emerald-300'
                    }`}
                  >
                    {/* Halal Badge */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-emerald-100 uppercase tracking-widest shadow-sm backdrop-blur-md">
                        Halal
                      </span>
                    </div>

                    {/* Product Image */}
                    <div className="w-full h-32 bg-slate-100 flex-shrink-0 relative">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <Package className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">No Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <div className="mb-2">
                        <span className="text-[10px] text-gray-400 font-mono font-semibold block">{p.sku}</span>
                        <h3 className="font-bold text-sm text-gray-800 line-clamp-2 mt-1 leading-snug h-10">{p.name}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase mt-1">{p.category}</p>
                      </div>

                      <div className="mt-auto pt-2 border-t border-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-800 text-sm">
                          Rp {p.price.toLocaleString('id-ID')}
                        </span>
                        
                        {/* Stock pill */}
                        {isOutOfStock ? (
                          <span className="text-[10px] font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full">Habis</span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">{p.stock} {p.unit}</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{p.stock} {p.unit}</span>
                        )}
                      </div>

                      {/* Add button / active inventory controller */}
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="w-full bg-slate-100 text-gray-400 py-1.5 rounded-lg text-xs font-semibold cursor-not-allowed"
                        >
                          Stok Kosong
                        </button>
                      ) : (
                        <button
                          onClick={() => addToCart(p)}
                          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 shadow-xs active:scale-98 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 mr-0.5" />
                          <span>Pilih Produk</span>
                          {cartQty > 0 && (
                            <span className="bg-amber-400 text-emerald-950 font-bold ml-1 px-1.5 py-0.1 rounded-full text-[10px]">
                              {cartQty}
                            </span>
                          )}
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

      {/* Shopping Cart Section - Right */}
      <div className="md:col-span-5 lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-xs flex flex-col h-[70vh] md:h-full overflow-hidden mt-4 md:mt-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-emerald-800" />
            <h2 className="font-bold text-gray-800 text-md">Keranjang Belanja</h2>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {cart.reduce((s, c) => s + c.quantity, 0)} Pcs
          </span>
        </div>

        {/* Shariah Compliance & Locked Prices Indicator */}
        <div className="bg-emerald-800 text-white p-3 border-b border-[#0e441b] text-[10px] space-y-1">
          <p className="font-black uppercase tracking-wider flex items-center justify-between">
            <span>AKAD: MURABAHAH (JUAL BELI)</span>
            <span className="bg-amber-400 text-emerald-950 font-black px-1.5 py-0.5 rounded text-[8px]">TERKUNCI</span>
          </p>
          <p className="text-gray-100/90 leading-relaxed font-medium">
            Harga beli dan jual barang/komoditas sudah otomatis ditentukan oleh sistem berdasarkan ketetapan Owner & Admin Syariah.
          </p>
        </div>

        {/* Active Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10 text-gray-400">
              <ShoppingCart className="w-12 h-12 text-slate-200" />
              <p className="text-xs font-medium">Belum ada item ditambahkan.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.product.id}
                className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-slate-50/50"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-gray-800 truncate" title={item.product.name}>
                    {item.product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-gray-400 font-semibold">
                      Rp {getDynamicPrice(item).toLocaleString('id-ID')} / {item.product.unit}
                    </p>
                    {getDynamicPrice(item) < item.product.price && (
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold">Harga Grosir</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-slate-100 focus:outline-none"
                  >
                    <Minus className="w-3 h-3 text-gray-500" />
                  </button>
                  <span className="text-xs font-bold text-gray-800 w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-slate-100 focus:outline-none"
                  >
                    <Plus className="w-3 h-3 text-gray-500" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                    title="Buang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Promo Selection */}
        <div className="px-4 pb-2 pt-1 border-t border-gray-100 bg-white grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Pelanggan</label>
            <select 
              className="w-full text-xs border border-gray-200 rounded p-1 outline-none focus:border-emerald-500"
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Umum --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Promo</label>
            <select 
              className="w-full text-xs border border-gray-200 rounded p-1 outline-none focus:border-emerald-500"
              value={selectedPromoId}
              onChange={e => setSelectedPromoId(e.target.value)}
            >
              <option value="">-- Tanpa Promo --</option>
              {promos.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Checkout Summaries Section */}
        <div className="p-4 border-t border-gray-100 bg-slate-50">
          <div className="space-y-1 mb-4">
            <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
              <span>Subtotal</span>
              <span>Rp {baseTotal.toLocaleString('id-ID')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-fuchsia-600 font-medium">
                <span>Diskon Promo</span>
                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {settings.isTaxEnabled && (
              <div className="flex justify-between items-center text-xs text-amber-600 font-medium">
                <span>Pajak PPN ({settings.taxRate}%)</span>
                <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-gray-500 font-medium pb-2 border-b border-gray-200 mt-1">
              <span>Zakat Kontribusi (Est.)</span>
              <span className="text-emerald-700">Rp {((cartTotal - taxAmount - cart.reduce((s, i) => s + i.product.costPrice * i.quantity, 0)) * 0.025 > 0 ? (cartTotal - taxAmount - cart.reduce((s, i) => s + i.product.costPrice * i.quantity, 0)) * 0.025 : 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-1">
              <span className="font-bold text-gray-800 text-sm">Total Pembayaran</span>
              <span className="font-extrabold text-gray-900 text-lg">Rp {cartTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                cart.length === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              Kosongkan
            </button>
            <button
              onClick={() => {
                if(cart.length > 0) setIsCheckoutOpen(true);
              }}
              disabled={cart.length === 0}
              className={`py-2 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center space-x-1 shadow-xs ${
                cart.length === 0
                  ? 'bg-emerald-500/20 text-white/50 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <span>Bayar Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Processing Dialog / Modal overlay */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-md">Pencatatan Pembayaran POS</h3>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 text-center">
                <p className="text-xs text-gray-500 font-medium">Total Tagihan Belanja</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">Rp {cartTotal.toLocaleString('id-ID')}</p>
              </div>

              {/* Payment Method selectors */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Metode Pembayaran Syariah</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => { setPaymentMethod('CASH'); setAmountPaidInput(''); setIsQrisSimulated(false); setIsTransferSimulated(false); setScannedCustomerToken(''); }}
                    className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center space-y-1.5 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 hover:bg-slate-50 text-gray-600'
                    }`}
                  >
                    <Coins className="w-5 h-5 text-emerald-700" />
                    <span className="text-[9px] font-bold">Tunai</span>
                  </button>

                  <button
                    disabled={settings.qrisEnabled === false}
                    onClick={() => { setPaymentMethod('QRIS_SHARIAH'); setAmountPaidInput(cartTotal.toString()); setIsQrisSimulated(false); setIsTransferSimulated(false); setScannedCustomerToken(''); }}
                    className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center space-y-1.5 transition-all ${
                      paymentMethod === 'QRIS_SHARIAH'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 hover:bg-slate-50 text-gray-600'
                    } ${settings.qrisEnabled === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                  >
                    <QrCode className="w-5 h-5 text-emerald-700" />
                    <span className="text-[9px] font-bold">QRIS</span>
                  </button>

                  <button
                    onClick={() => { setPaymentMethod('TRANSFER_BSI'); setAmountPaidInput(cartTotal.toString()); setIsQrisSimulated(false); setIsTransferSimulated(false); setScannedCustomerToken(''); }}
                    className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center space-y-1.5 transition-all ${
                      paymentMethod === 'TRANSFER_BSI'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 hover:bg-slate-50 text-gray-600'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-700" />
                    <span className="text-[9px] font-bold">Transfer</span>
                  </button>
                  
                  <button
                    onClick={() => { setPaymentMethod('KASBON'); setAmountPaidInput('0'); setIsQrisSimulated(false); setIsTransferSimulated(false); setScannedCustomerToken(''); }}
                    className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center space-y-1.5 transition-all ${
                      paymentMethod === 'KASBON'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-gray-200 hover:bg-slate-50 text-gray-600'
                    }`}
                  >
                    <Users className="w-5 h-5 text-rose-700" />
                    <span className="text-[9px] font-bold">Kasbon</span>
                  </button>
                </div>
              </div>

              {/* Input fields based on method */}
              {paymentMethod === 'CASH' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Terima Uang Cash (Rp)</label>
                  <input
                    type="number"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Masukkan jumlah yang diserahkan pelanggan..."
                  />
                  
                  {/* Suggestions block */}
                  <div className="flex gap-1.5 mt-1">
                    {[cartTotal, Math.ceil(cartTotal / 10000) * 10000, Math.ceil(cartTotal / 50000) * 50000, 100000, 200000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setAmountPaidInput(val.toString())}
                        className="bg-slate-100 hover:bg-slate-200 text-gray-600 text-[10px] px-2 py-1 rounded"
                      >
                        Rp {val.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                </div>
              ) : paymentMethod === 'KASBON' ? (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-start gap-3 text-rose-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-bold">Peringatan Transaksi Kasbon!</p>
                      <p className="text-xs mt-1 text-rose-700/80">Anda wajib memilih <b>Nama Pelanggan</b> di bagian atas untuk mencatat piutang ini. Total belanja akan otomatis masuk ke tagihan (hutang) pelanggan tersebut.</p>
                    </div>
                  </div>
                  {!selectedCustomerId && (
                    <div className="bg-white p-3 rounded-lg border border-rose-200 text-center text-rose-600 font-bold text-xs animate-pulse shadow-sm shadow-rose-100">
                      ⚠️ SILAKAN PILIH PELANGGAN DULU!
                    </div>
                  )}
                  {selectedCustomerId && (
                    <div className="bg-white p-3 rounded-lg border border-emerald-200 text-center text-emerald-700 font-bold text-xs shadow-sm shadow-emerald-100 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Pelanggan Dipilih. Siap Proses!
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-3 border border-gray-100 text-xs text-slate-500 leading-relaxed">
                  {paymentMethod === 'QRIS_SHARIAH' ? (
                    <div className="flex flex-col space-y-3">
                      {/* Tabs for Scan Mode */}
                      <div className="flex bg-slate-200/50 p-1 rounded-lg">
                        <button 
                          onClick={() => setQrisScanMode('MERCHANT')}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${qrisScanMode === 'MERCHANT' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Pelanggan Scan QR Toko
                        </button>
                        <button 
                          onClick={() => { setQrisScanMode('CUSTOMER'); setTimeout(() => document.getElementById('barcode-scanner-input')?.focus(), 100); }}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${qrisScanMode === 'CUSTOMER' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Kasir Scan QR Pelanggan
                        </button>
                      </div>

                      {qrisScanMode === 'MERCHANT' ? (
                        <div className="flex flex-col items-center">
                          <p className="text-center font-medium mb-3">Arahkan pelanggan untuk scan QR Code statis toko dan tunjukkan bukti berhasil pada layar HP mereka.</p>
                          <div className="w-40 h-40 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-2 shadow-sm overflow-hidden mb-3">
                            {settings.qrisImageUrl ? (
                              <img src={settings.qrisImageUrl} alt="QRIS Toko" className="w-full h-full object-contain" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-emerald-800 opacity-60">
                                <QrCode className="w-16 h-16 mb-2" />
                                <span className="text-[10px] text-center">Belum ada QRIS<br/>Upload di Pengaturan</span>
                              </div>
                            )}
                          </div>
                          {!isQrisSimulated ? (
                            <button 
                              onClick={() => setIsQrisSimulated(true)}
                              className="w-full py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg border border-emerald-300 transition-colors"
                            >
                              Verifikasi Bukti QRIS Selesai
                            </button>
                          ) : (
                            <div className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg text-center flex items-center justify-center space-x-1 shadow-xs">
                              <CheckCircle className="w-4 h-4" />
                              <span>Pembayaran QRIS Diterima!</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-3">
                          <p className="text-center font-medium">Arahkan Scanner (Barcode Gun) ke layar HP pelanggan (GoPay/OVO/Dana) lalu tekan tombol tembak.</p>
                          
                          <div className="relative">
                            <input
                              id="barcode-scanner-input"
                              type="text"
                              autoFocus
                              value={scannedCustomerToken}
                              onChange={(e) => setScannedCustomerToken(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && scannedCustomerToken.length > 5) {
                                  setIsQrisSimulated(true);
                                }
                              }}
                              className="w-full border-2 border-emerald-400 rounded-lg py-3 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/20 bg-white text-center font-mono font-bold tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:font-normal"
                              placeholder="Klik di sini & Tembakkan Scanner..."
                            />
                            {!isQrisSimulated && (
                               <div className="absolute right-3 top-4 flex space-x-1">
                                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                                 <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                               </div>
                            )}
                          </div>

                          {!isQrisSimulated ? (
                            <button 
                              onClick={() => {
                                if (scannedCustomerToken.length > 5) setIsQrisSimulated(true);
                                else alert("Silakan scan barcode pelanggan terlebih dahulu (minimal 6 karakter token).");
                              }}
                              className="w-full py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg border border-emerald-300 transition-colors"
                            >
                              Tarik Dana dari Pelanggan
                            </button>
                          ) : (
                            <div className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg text-center flex items-center justify-center space-x-1 shadow-xs">
                              <CheckCircle className="w-4 h-4" />
                              <span>Dana Berhasil Ditarik!</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p>Pastikan dana masuk ke rekening: <b>{settings.ownerBankName || 'BSI'}</b> No. Rek: <b>{settings.ownerBankAccount || '-'}</b>.</p>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-600 uppercase">Nama Pengirim (Sesuai Mutasi Bank)</label>
                        <input
                          type="text"
                          value={transferSenderName}
                          onChange={(e) => setTransferSenderName(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                          placeholder="Masukkan nama pengirim untuk dicatat..."
                        />
                      </div>

                      {!isTransferSimulated ? (
                        <button 
                          onClick={() => {
                            if (!transferSenderName) { alert("Masukkan nama pengirim untuk verifikasi!"); return; }
                            setIsTransferSimulated(true);
                          }}
                          className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg border border-blue-300 transition-colors"
                        >
                          Verifikasi Dana Masuk (Mutasi)
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg text-center flex items-center justify-center space-x-1 shadow-xs">
                          <CheckCircle className="w-4 h-4" />
                          <span>Dana Masuk Diverifikasi!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Show Cash changes */}
              {paymentMethod === 'CASH' && Number(amountPaidInput) > 0 && (
                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border text-xs">
                  <span className="font-semibold text-gray-500">Uang Kembalian</span>
                  <span className={`font-bold text-sm ${Number(amountPaidInput) - cartTotal < 0 ? 'text-red-500' : 'text-emerald-700'}`}>
                    {Number(amountPaidInput) - cartTotal < 0 
                      ? `Kurang Rp ${(cartTotal - Number(amountPaidInput)).toLocaleString('id-ID')}` 
                      : `Rp ${(Number(amountPaidInput) - cartTotal).toLocaleString('id-ID')}`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-gray-100 grid grid-cols-2 gap-2">
              <button
                onClick={() => { setIsCheckoutOpen(false); setIsQrisSimulated(false); setIsTransferSimulated(false); }}
                className="py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handleCheckoutSubmit();
                  setIsCheckoutOpen(false);
                  setIsQrisSimulated(false);
                  setIsTransferSimulated(false);
                }}
                disabled={
                  cart.length === 0 || 
                  (paymentMethod === 'CASH' && Number(amountPaidInput) < cartTotal) ||
                  (paymentMethod === 'QRIS_SHARIAH' && !isQrisSimulated) ||
                  (paymentMethod === 'TRANSFER_BSI' && !isTransferSimulated) ||
                  (paymentMethod === 'KASBON' && !selectedCustomerId)
                }
                className={`py-2.5 text-xs font-bold rounded-lg shadow-xs transition-colors ${
                  (paymentMethod === 'CASH' && Number(amountPaidInput) < cartTotal) ||
                  (paymentMethod === 'QRIS_SHARIAH' && !isQrisSimulated) ||
                  (paymentMethod === 'TRANSFER_BSI' && !isTransferSimulated) ||
                  (paymentMethod === 'KASBON' && !selectedCustomerId)
                    ? 'bg-emerald-300 text-emerald-50 cursor-not-allowed'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                Selesaikan Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Shariah Print Receipt Popup card */}
      {receiptTx && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body * { visibility: hidden; }
              .printable-thermal, .printable-thermal * { visibility: visible; }
              .printable-thermal { position: absolute; left: 0; top: 0; width: 80mm; padding: 2mm; margin: 0; border: none; max-height: none; overflow: visible; }
            }
          `}} />
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Receipt headers */}
            <div className="p-6 text-center border-b border-gray-100 bg-emerald-50/20">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-extrabold text-gray-800 text-md">Pembayaran Sukses!</h3>
              <p className="text-xs text-gray-400 mt-1">Struk Digital penjualan BA Mart</p>
            </div>

            {/* Simulated Thermic strip content */}
            <div className="printable-area printable-thermal p-6 space-y-4 text-xs font-mono text-gray-700 border-b border-dashed border-gray-200 max-h-96 overflow-y-auto">
              <div className="text-center space-y-0.5 border-b border-gray-100 pb-3">
                <p className="font-bold text-gray-800 text-sm">Toko Berkah Amanah Mart</p>
                <p className="text-slate-400 text-[10px] uppercase">{activeBranchId ? `Cabang ${activeBranchId}` : 'Kantor Pusat'}, Indonesia</p>
                <p className="text-slate-400">Telp: 082210027952</p>
              </div>

              <div className="space-y-1 text-xs">
                <p><span className="text-slate-400">No Invoice:</span> {receiptTx.invoiceNo}</p>
                <p><span className="text-slate-400">Waktu:</span> {new Date(receiptTx.timestamp).toLocaleString('id-ID')}</p>
                <p><span className="text-slate-400">Kasir:</span> {receiptTx.cashierName}</p>
                <p><span className="text-slate-400">Pelanggan:</span> {receiptTx.customerName || 'Umum'}</p>
                <p><span className="text-slate-400">Metode:</span> {receiptTx.paymentMethod}</p>
              </div>

              <div className="border-t border-b border-gray-100 py-2 space-y-2">
                {receiptTx.items.map((it: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{it.productName}</p>
                      <p className="text-slate-400 text-[10px]">{it.quantity} x Rp {it.price.toLocaleString('id-ID')}</p>
                    </div>
                    <span>Rp {(it.price * it.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right mt-2 text-xs">
                {receiptTx.discountAmount > 0 && (
                  <div className="flex justify-between text-fuchsia-600 font-bold border-b border-dashed border-gray-100 pb-1 mb-1">
                    <span>Diskon Promo:</span>
                    <span>- Rp {receiptTx.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {receiptTx.taxAmount > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold border-b border-dashed border-gray-100 pb-1 mb-1">
                    <span>Pajak (PPN):</span>
                    <span>Rp {receiptTx.taxAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm mt-2">
                  <span>Total Belanja:</span>
                  <span>Rp {receiptTx.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                {receiptTx.splitPayments ? (
                  <>
                    {receiptTx.splitPayments.map((sp: any, i: number) => (
                      <div key={i} className="flex justify-between text-gray-600">
                        <span>Bayar {sp.method}:</span>
                        <span>Rp {sp.amount.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>Uang Diterima:</span>
                    <span>Rp {receiptTx.amountPaid.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-emerald-700 border-t border-gray-100 pt-1.5 mt-1">
                  <span>Uang Kembali:</span>
                  <span>Rp {receiptTx.changeAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="border-t border-emerald-900/20 pt-3 text-center text-[10px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 leading-normal">
                <p className="font-bold uppercase tracking-wider mb-1">Misi Berkah Beramal</p>
                <p>Zakat Kontribusi Sebesar <b>Rp {receiptTx.zakatContribution.toLocaleString('id-ID')}</b> dari transaksi ini dicadangkan untuk kaum Dhuafa.</p>
              </div>
            </div>

            {/* Kirim WhatsApp Struk */}
            <div className="px-6 py-4 bg-emerald-50/30 border-t border-b border-gray-100 flex flex-col space-y-2">
              <label className="text-[11px] font-bold text-gray-700 flex items-center space-x-1">
                <span>📱 Kirim Struk Digital via WhatsApp</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="No WhatsApp (misal: 08123456789)"
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                />
                <button
                  onClick={handleSendWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center space-x-1"
                >
                  Kirim WA
                </button>
              </div>
            </div>

            {/* Modal footer printers */}
            <div className="p-4 bg-slate-50 flex gap-2">
              <button
                onClick={() => setReceiptTx(null)}
                className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold text-xs text-center"
              >
                Tutup
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg text-center shadow-xs"
              >
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
