import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ShoppingBag, Plus, Search, CheckCircle, ShieldAlert, Send, FileText, Check } from 'lucide-react';

export default function PurchaseOrderPage() {
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrder, suppliers, currentUser } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  
  const [poNumber, setPoNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [notes, setNotes] = useState('');
  // Simplified for MVP: just taking a generic description of items and a total expected amount
  const [totalAmount, setTotalAmount] = useState(0);

  const [receivingPoId, setReceivingPoId] = useState<string | null>(null);
  const [invoiceInput, setInvoiceInput] = useState('');

  // Prevent accessing if not admin or owner
  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'OWNER') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-400" />
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p>Anda tidak memiliki izin untuk mengakses halaman Purchase Order.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber || !supplier || totalAmount <= 0) return;

    const selectedSupplier = suppliers.find(s => s.name === supplier);
    const supplierContact = selectedSupplier ? selectedSupplier.phone : supplierPhone;

    addPurchaseOrder({
      poNumber,
      supplier,
      date: new Date().toISOString(),
      items: [], // For simplicity in this demo, items are recorded in notes or skipped
      totalAmount,
      status: 'ORDERED',
      createdBy: currentUser.name,
      notes: notes + (supplierContact ? `\nKontak: ${supplierContact}` : '')
    });

    setIsAdding(false);
    setPoNumber('');
    setSupplier('');
    setSupplierPhone('');
    setTotalAmount(0);
    setNotes('');
  };

  const handleSendWA = (po: any) => {
    // Extract phone from notes if exists (simple parsing for demo)
    const phoneMatch = po.notes?.match(/Kontak:\s*([0-9]+)/);
    let phone = phoneMatch ? phoneMatch[1] : '';
    
    if (!phone) {
      phone = prompt('Masukkan nomor WA Supplier (misal: 0812...):', '');
      if (!phone) return;
    }

    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.slice(1);

    const textMessage = `*PURCHASE ORDER BA MART*\n` +
      `No PO: ${po.poNumber}\n` +
      `Tanggal: ${new Date(po.date).toLocaleDateString('id-ID')}\n` +
      `====================\n` +
      `Kepada Yth. ${po.supplier}\n\n` +
      `Kami ingin memesan barang dengan rincian:\n` +
      `${po.notes?.replace(/Kontak:.*/g, '').trim()}\n\n` +
      `Estimasi Total: Rp ${po.totalAmount.toLocaleString('id-ID')}\n\n` +
      `Mohon konfirmasi ketersediaan dan kirimkan invoice jika pesanan sudah diproses.\n` +
      `Terima kasih.`;

    const encodedText = encodeURIComponent(textMessage);
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`, '_blank');
  };

  const handleReceivePO = (poId: string) => {
    if (!invoiceInput) {
      alert('Nomor/Link Invoice dari Supplier wajib diisi!');
      return;
    }
    updatePurchaseOrder(poId, {
      status: 'RECEIVED',
      invoiceSupplier: invoiceInput
    });
    setReceivingPoId(null);
    setInvoiceInput('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Purchase Order (PO)</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">Catat pesanan barang ke supplier.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 transition-all active:scale-95"
        >
          {isAdding ? <><Search className="w-4 h-4"/> <span>Lihat Daftar PO</span></> : <><Plus className="w-4 h-4"/> <span>Buat PO Baru</span></>}
        </button>
      </div>

      {isAdding ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Formulir Purchase Order</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Nomor PO</label>
                <input type="text" required value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO-2026-001" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Nama Supplier</label>
                <select 
                  required 
                  value={supplier} 
                  onChange={(e) => {
                    setSupplier(e.target.value);
                    const sup = suppliers.find(s => s.name === e.target.value);
                    if (sup) setSupplierPhone(sup.phone);
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="" disabled>Pilih Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                  <option value="Supplier Lainnya">Supplier Lainnya (Input Manual)</option>
                </select>
                {supplier === 'Supplier Lainnya' && (
                  <input type="text" required value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ketik nama supplier..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-2" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Total Estimasi Harga (Rp)</label>
                <input type="number" required min="0" value={totalAmount} onChange={(e) => setTotalAmount(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">No. WA Supplier (Opsional)</label>
                <input type="text" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} placeholder="08123456789" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Total Estimasi Harga (Rp)</label>
              <input type="number" required min="0" value={totalAmount} onChange={(e) => setTotalAmount(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Catatan / Rincian Barang</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Minyak 10 dus, Beras 50 karung..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors">Simpan PO</button>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-4">Tanggal & No. PO</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4 text-right">Total (Rp)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Pembuat</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {purchaseOrders.map((po) => (
                  <React.Fragment key={po.id}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{po.poNumber}</p>
                      <p className="text-[10px] text-slate-500">{new Date(po.date).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{po.supplier}</td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-700">
                      {po.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                        po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' : 
                        po.status === 'ORDERED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                        <span>{po.status}</span>
                      </span>
                      {po.invoiceSupplier && (
                        <div className="text-[9px] mt-1 text-slate-400 truncate max-w-[100px]" title={po.invoiceSupplier}>
                          Inv: {po.invoiceSupplier}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500">{po.createdBy}</td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleSendWA(po)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                        title="Kirim PO via WhatsApp"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      {po.status === 'ORDERED' && (
                        <button 
                          onClick={() => setReceivingPoId(po.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                          title="Tandai Diterima (Terima Barang)"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  
                  {/* Receive Action Form inline row */}
                  {receivingPoId === po.id && (
                    <tr className="bg-blue-50/50 border-b border-slate-200">
                      <td colSpan={6} className="p-4">
                        <div className="flex items-center gap-3 max-w-xl ml-auto">
                          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Input Invoice Supplier:</label>
                          <input 
                            type="text" 
                            placeholder="INV-SUP-123 atau URL" 
                            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={invoiceInput}
                            onChange={(e) => setInvoiceInput(e.target.value)}
                          />
                          <button 
                            onClick={() => handleReceivePO(po.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Simpan
                          </button>
                          <button 
                            onClick={() => setReceivingPoId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-bold"
                          >
                            Batal
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                ))}
              </tbody>
            </table>
            {purchaseOrders.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                Belum ada data Purchase Order.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
