import React, { useState } from 'react';
import { useBranchData } from '../hooks/useBranchData';
import { ShoppingCart, MessageSquare, Check, X, Clock, Send, Store, Calendar } from 'lucide-react';

export default function OnlineOrdersPage() {
  const { 
    currentUser, 
    onlineOrders, 
    updateOrderStatus, 
    processOnlineOrderPayment,
    chatMessages, 
    sendChatMessage 
  } = useBranchData();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !chatText.trim() || !currentUser) return;
    sendChatMessage(selectedOrderId, currentUser.username, currentUser.name, chatText);
    
    const textToSend = chatText;
    setChatText('');

    // Simulate customer reply after a short delay to make it functional/alive
    const order = onlineOrders.find(o => o.id === selectedOrderId);
    if (order) {
      setTimeout(() => {
        const replyText = textToSend.toLowerCase().includes('siap') || textToSend.toLowerCase().includes('kirim')
          ? "Siap kak, ditunggu ya."
          : "Baik kak, terima kasih atas informasinya.";
        sendChatMessage(selectedOrderId, order.customerId, order.customerName, replyText);
      }, 2000);
    }
  };

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');
  const currentDay = today.toLocaleDateString('en-CA');
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(currentDay);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredOrders = onlineOrders.filter(o => {
    if (startDate && new Date(o.createdAt).getTime() < new Date(startDate).setHours(0,0,0,0)) return false;
    if (endDate && new Date(o.createdAt).getTime() > new Date(endDate).setHours(23,59,59,999)) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleStatusChange = (orderId: string, status: any) => {
    if (confirm(`Ubah status pesanan menjadi ${status}?`)) {
      updateOrderStatus(orderId, status);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-indigo-600" />
          Pesanan Online Masuk
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola pesanan dari pelanggan aplikasi dan balas chat mereka.</p>
        <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center">
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-fit">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDate} 
              onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none w-32"
            />
            <span className="text-slate-400 text-sm">s/d</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none w-32"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left Col: Order List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
            <span>Daftar Pesanan</span>
            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs">{filteredOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {paginatedOrders.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-sm">Tidak ada pesanan.</p>
            ) : (
              paginatedOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedOrderId === order.id ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{order.orderNo}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1"><Store className="w-3 h-3"/> {order.customerName}</div>
                  {order.distanceKm !== undefined && (
                    <div className="text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-1.5 py-0.5 rounded mb-1 border border-blue-100">
                      Jarak: {order.distanceKm.toFixed(2)} km
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(order.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})} {new Date(order.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                    <span className="font-bold text-indigo-700">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center text-sm">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-slate-600 dark:text-slate-400 font-bold">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Detail & Chat */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          {selectedOrderId ? (() => {
            const order = onlineOrders.find(o => o.id === selectedOrderId);
            if (!order) return null;
            const msgs = chatMessages.filter(m => m.orderId === selectedOrderId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            return (
              <>
                {/* Header Detail */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{order.orderNo}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Pelanggan: <strong className="text-slate-800 dark:text-slate-200">{order.customerName}</strong> ({order.customerPhone})</p>
                    {order.distanceKm !== undefined && (
                      <p className="text-xs mt-1 text-blue-700 font-bold bg-blue-50 w-fit px-2 py-0.5 rounded border border-blue-200">
                        Jarak Pengiriman: {order.distanceKm.toFixed(2)} km
                      </p>
                    )}
                    {order.notes && <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1 border border-amber-100">Catatan: {order.notes}</p>}
                    {order.paymentCode && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-[10px] text-blue-600 font-bold uppercase">Kode Pembayaran (Validasi)</p>
                        <p className="font-mono text-lg font-black text-blue-800 tracking-wider">{order.paymentCode}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {order.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleStatusChange(order.id, 'PROCESSED')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Check className="w-4 h-4"/> Proses Pesanan</button>
                        <button onClick={() => handleStatusChange(order.id, 'CANCELLED')} className="bg-white dark:bg-slate-900 border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><X className="w-4 h-4"/> Tolak</button>
                      </>
                    )}
                    {order.status === 'PROCESSED' && (
                      <button onClick={() => handleStatusChange(order.id, 'READY')} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Tandai Siap Ambil/Kirim</button>
                    )}
                    {order.status === 'READY' && (
                      <div className="flex flex-col gap-1">
                        <button onClick={() => { if(confirm('Terima pembayaran Tunai dan Selesaikan Pesanan?')) processOnlineOrderPayment(order.id, 'CASH'); }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold w-full text-center">Bayar Cash & Selesai</button>
                        <button onClick={() => { if(confirm('Terima pembayaran Transfer BSI dan Selesaikan Pesanan? Pastikan Kode Pembayaran sesuai.')) processOnlineOrderPayment(order.id, 'TRANSFER_BSI'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold w-full text-center">Bayar Transfer BSI & Selesai</button>
                        <button onClick={() => { if(confirm('Terima pembayaran QRIS dan Selesaikan Pesanan? Pastikan Kode Pembayaran sesuai.')) processOnlineOrderPayment(order.id, 'QRIS_SHARIAH'); }} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold w-full text-center">Bayar QRIS & Selesai</button>
                      </div>
                    )}
                    {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
                      <button onClick={() => { if(confirm('Reset status pesanan ke PENDING?')) handleStatusChange(order.id, 'PENDING'); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold w-full text-center">Reset ke Pending</button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                   <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Item Pesanan ({order.items.length})</h4>
                   <div className="space-y-1">
                     {order.items.map((item, i) => (
                       <div key={i} className="flex justify-between text-sm">
                         <span><span className="font-bold mr-2">{item.quantity}x</span>{item.productName}</span>
                         <span className="font-medium text-slate-700 dark:text-slate-300">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                       </div>
                     ))}
                   </div>
                   <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 font-bold text-lg">
                     <span>TOTAL</span>
                     <span className="text-indigo-700">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                   </div>
                </div>

                {/* Chat */}
                <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-800/50 space-y-3">
                  {msgs.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm mt-10">Belum ada obrolan. Sapa pelanggan terlebih dahulu.</div>
                  ) : (
                    msgs.map(msg => {
                      const isAdmin = msg.senderId === currentUser?.username; // Assuming admin/cashier senderId match
                      return (
                        <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isAdmin ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                            {!isAdmin && <p className="text-[10px] font-bold text-indigo-700 mb-1">{msg.senderName}</p>}
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
                    placeholder="Balas chat pelanggan..."
                    className="flex-1 border border-slate-300 dark:border-slate-600 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:bg-slate-900 transition-colors"
                  />
                  <button type="submit" disabled={!chatText.trim()} className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Send className="w-4 h-4 ml-[-2px]"/>
                  </button>
                </form>

              </>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center bg-slate-50 dark:bg-slate-800/50">
              <MessageSquare className="w-16 h-16 text-slate-200 mb-4"/>
              <h3 className="font-bold text-slate-600 dark:text-slate-400 mb-1">Pilih Pesanan Masuk</h3>
              <p className="text-sm">Klik salah satu pesanan di daftar sebelah kiri untuk memproses atau membalas chat.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
