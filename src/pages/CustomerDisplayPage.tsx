import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ShoppingBag, CheckCircle, Smile, Frown, Send, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';

export default function CustomerDisplayPage() {
  const { cart, lastTransactionId, transactions, updateTransactionFeedback, settings } = useAppStore();
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Dynamic pricing for wholesale
  const getDynamicPrice = (item: CartItem) => {
    if (item.product.isPromoActive && item.product.promoPrice) {
      return item.product.promoPrice;
    }
    if (item.product.wholesalePrice && item.product.wholesaleMinQty && item.quantity >= item.product.wholesaleMinQty) {
      return item.product.wholesalePrice;
    }
    return item.product.price;
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (getDynamicPrice(item) * item.quantity), 0);
  };

  const lastTx = lastTransactionId ? transactions.find(t => t.id === lastTransactionId) : null;

  const handleFeedback = (rating: 'PUAS' | 'TIDAK_PUAS') => {
    if (!lastTransactionId) return;
    updateTransactionFeedback(lastTransactionId, rating, feedbackText);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFeedbackText('');
      useAppStore.setState({ lastTransactionId: null });
    }, 4000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-3xl shadow-xl max-w-lg w-full border border-green-100">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} />
          </div>
          <h1 className="text-3xl font-black text-green-800 mb-4">Terima Kasih!</h1>
          <p className="text-slate-600 text-lg">Masukan Anda sangat berarti bagi KSA Mart.</p>
        </motion.div>
      </div>
    );
  }

  // TRANSAKSI SELESAI - FEEDBACK MODE
  if (lastTx) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6">
        <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
          {/* Kiri: Struk Ringkas */}
          <div className="w-full md:w-1/3 bg-green-900 text-white p-8 flex flex-col justify-center text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-300" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Pembayaran Berhasil</h2>
            <p className="text-green-200 mb-8">{lastTx.invoiceNo}</p>
            
            <div className="text-sm text-green-100 uppercase tracking-widest mb-1">Total Pembayaran</div>
            <div className="text-4xl font-black text-amber-300 mb-8">Rp {lastTx.totalAmount.toLocaleString('id-ID')}</div>
            
            <div className="text-sm text-green-100 uppercase tracking-widest mb-1">Metode</div>
            <div className="text-xl font-bold">{lastTx.paymentMethod.replace('_', ' ')}</div>
          </div>
          
          {/* Kanan: Feedback Form */}
          <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col justify-center">
            <h1 className="text-3xl font-black text-slate-800 mb-2">Bagaimana Pelayanan Kami?</h1>
            <p className="text-slate-500 mb-10 text-lg">Bantu kami meningkatkan kualitas layanan KSA Mart.</p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <button 
                onClick={() => handleFeedback('PUAS')}
                className="group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all duration-300"
              >
                <div className="w-24 h-24 rounded-full bg-slate-100 group-hover:bg-green-100 flex items-center justify-center mb-4 transition-colors">
                  <Smile size={48} className="text-slate-400 group-hover:text-green-600" />
                </div>
                <span className="text-xl font-bold text-slate-600 group-hover:text-green-700">Sangat Puas</span>
              </button>
              
              <button 
                onClick={() => handleFeedback('TIDAK_PUAS')}
                className="group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-slate-200 hover:border-rose-500 hover:bg-rose-50 transition-all duration-300"
              >
                <div className="w-24 h-24 rounded-full bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center mb-4 transition-colors">
                  <Frown size={48} className="text-slate-400 group-hover:text-rose-600" />
                </div>
                <span className="text-xl font-bold text-slate-600 group-hover:text-rose-700">Kurang Puas</span>
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Pesan & Kesan (Opsional)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Ketik masukkan Anda di sini..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-lg"
                />
                <button 
                  onClick={() => handleFeedback('PUAS')} // Default send uses 'PUAS' if they just typed something
                  disabled={!feedbackText}
                  className="bg-green-600 text-white px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-bold"
                >
                  <Send size={20} /> Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDBY ATAU CART MODE
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col p-4 sm:p-6 overflow-hidden">
      {/* Header */}
      <header className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between mb-4 sm:mb-6 shrink-0 z-10 border border-slate-200">
        <div className="flex items-center gap-3">
          <img src="/ksa_mart_logo.png" alt="Logo" className="h-10 w-auto" />
          <div>
            <h1 className="font-black text-xl text-green-900">{settings.storeName || 'KSA Mart'}</h1>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Customer Display</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-500">Total Tagihan</div>
          <div className="text-3xl font-black text-green-700">Rp {calculateTotal().toLocaleString('id-ID')}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 flex gap-4 sm:gap-6 z-10">
        {/* Left: Cart Items */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-green-50 p-4 border-b border-green-100">
            <h2 className="font-bold text-green-800 flex items-center gap-2">
              <ShoppingBag size={20} /> Daftar Belanjaan
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
            <AnimatePresence>
              {cart.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-slate-400"
                >
                  <MonitorPlay size={64} className="mb-4 text-slate-300" />
                  <p className="text-xl font-bold">Silakan bawa barang Anda ke kasir.</p>
                  <p className="text-sm">Layar ini akan menampilkan daftar belanjaan Anda.</p>
                </motion.div>
              ) : (
                cart.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-sm"
                  >
                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-lg truncate">{item.product.name}</h3>
                      <div className="text-sm font-medium text-slate-500">
                        {item.quantity} {item.isBox ? 'Dus/Box' : 'Pcs'} × Rp {getDynamicPrice(item).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-lg text-slate-800">
                        Rp {(getDynamicPrice(item) * item.quantity).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Promotions / Ads */}
        <div className="w-1/3 hidden lg:flex flex-col gap-4">
          <div className="flex-1 bg-gradient-to-br from-green-600 to-green-900 rounded-3xl shadow-sm overflow-hidden relative text-white p-8 flex flex-col justify-center items-center text-center">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
            <h2 className="text-3xl font-black mb-4">Mari Berbelanja Sambil Beramal</h2>
            <p className="text-green-100 text-lg mb-8">Sebagian keuntungan KSA Mart disalurkan untuk ziswaf dan pemberdayaan umat.</p>
            {settings.qrisImageUrl && (
              <div className="bg-white p-4 rounded-2xl z-10 relative">
                <p className="text-green-800 font-bold mb-2">Scan QRIS untuk Bayar</p>
                <img src={settings.qrisImageUrl} alt="QRIS" className="w-48 h-48 object-contain mx-auto" />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Decorative background blobs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-green-200 opacity-50"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none bg-amber-200 opacity-30"></div>
    </div>
  );
}
