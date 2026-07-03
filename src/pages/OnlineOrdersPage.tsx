import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ShoppingCart, MessageSquare, Check, X, Clock, Send, Store } from 'lucide-react';

export default function OnlineOrdersPage() {
  const { 
    currentUser, 
    onlineOrders, 
    updateOrderStatus, 
    processOnlineOrderPayment,
    chatMessages, 
    sendChatMessage 
  } = useAppStore();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !chatText.trim() || !currentUser) return;
    sendChatMessage(selectedOrderId, currentUser.username, currentUser.name, chatText);
    setChatText('');
  };

  const handleStatusChange = (orderId: string, status: any) => {
    if (confirm(`Ubah status pesanan menjadi ${status}?`)) {
      updateOrderStatus(orderId, status);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-indigo-600" />
          Pesanan Online Masuk
        </h1>
        <p className="text-sm text-slate-500 mt-1">Kelola pesanan dari pelanggan aplikasi dan balas chat mereka.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left Col: Order List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex justify-between items-center">
            <span>Daftar Pesanan</span>
            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs">{onlineOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {onlineOrders.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-sm">Belum ada pesanan masuk.</p>
            ) : (
              onlineOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedOrderId === order.id ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800">{order.orderNo}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mb-1 flex items-center gap-1"><Store className="w-3 h-3"/> {order.customerName}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(order.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                    <span className="font-bold text-indigo-700">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Detail & Chat */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {selectedOrderId ? (() => {
            const order = onlineOrders.find(o => o.id === selectedOrderId);
            if (!order) return null;
            const msgs = chatMessages.filter(m => m.orderId === selectedOrderId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            return (
              <>
                {/* Header Detail */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{order.orderNo}</h3>
                    <p className="text-sm text-slate-600">Pelanggan: <strong className="text-slate-800">{order.customerName}</strong> ({order.customerPhone})</p>
                    {order.notes && <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1 border border-amber-100">Catatan: {order.notes}</p>}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {order.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleStatusChange(order.id, 'PROCESSED')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Check className="w-4 h-4"/> Proses Pesanan</button>
                        <button onClick={() => handleStatusChange(order.id, 'CANCELLED')} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><X className="w-4 h-4"/> Tolak</button>
                      </>
                    )}
                    {order.status === 'PROCESSED' && (
                      <button onClick={() => handleStatusChange(order.id, 'READY')} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Tandai Siap Ambil/Kirim</button>
                    )}
                    {order.status === 'READY' && (
                      <div className="flex flex-col gap-1">
                        <button onClick={() => { if(confirm('Terima pembayaran Tunai dan Selesaikan Pesanan?')) processOnlineOrderPayment(order.id, 'CASH'); }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold w-full text-center">Bayar Cash & Selesai</button>
                        <button onClick={() => { if(confirm('Terima pembayaran Transfer BSI dan Selesaikan Pesanan?')) processOnlineOrderPayment(order.id, 'TRANSFER_BSI'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold w-full text-center">Bayar Transfer BSI & Selesai</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 border-b border-slate-100 bg-white">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Item Pesanan ({order.items.length})</h4>
                   <div className="space-y-1">
                     {order.items.map((item, i) => (
                       <div key={i} className="flex justify-between text-sm">
                         <span><span className="font-bold mr-2">{item.quantity}x</span>{item.productName}</span>
                         <span className="font-medium text-slate-700">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                       </div>
                     ))}
                   </div>
                   <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 font-bold text-lg">
                     <span>TOTAL</span>
                     <span className="text-indigo-700">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                   </div>
                </div>

                {/* Chat */}
                <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3">
                  {msgs.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm mt-10">Belum ada obrolan. Sapa pelanggan terlebih dahulu.</div>
                  ) : (
                    msgs.map(msg => {
                      const isAdmin = msg.senderId === currentUser?.username; // Assuming admin/cashier senderId match
                      return (
                        <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isAdmin ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
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
                <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 bg-white rounded-b-2xl flex gap-2">
                  <input 
                    type="text" 
                    value={chatText}
                    onChange={e => setChatText(e.target.value)}
                    placeholder="Balas chat pelanggan..."
                    className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                  />
                  <button type="submit" disabled={!chatText.trim()} className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                    <Send className="w-4 h-4 ml-[-2px]"/>
                  </button>
                </form>

              </>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center bg-slate-50/50">
              <MessageSquare className="w-16 h-16 text-slate-200 mb-4"/>
              <h3 className="font-bold text-slate-600 mb-1">Pilih Pesanan Masuk</h3>
              <p className="text-sm">Klik salah satu pesanan di daftar sebelah kiri untuk memproses atau membalas chat.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
