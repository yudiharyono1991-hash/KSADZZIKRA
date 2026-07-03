import React from 'react';
import { useAppStore } from '../store';
import { DollarSign, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';

export default function ArusKasPage() {
  const { transactions, expenses, journalEntries } = useAppStore();

  const cashMovements: any[] = [];
  
  transactions.forEach(t => {
    if (t.splitPayments && t.splitPayments.length > 0) {
      t.splitPayments.forEach((sp: any, i: number) => {
        cashMovements.push({
          id: `${t.id}_${i}`,
          date: t.timestamp,
          description: `Pendapatan Penjualan ${t.invoiceNo} (Split: ${sp.method})`,
          type: 'IN',
          amount: sp.amount - (i === 0 ? t.changeAmount : 0), // Adjust change on first payment
          method: sp.method
        });
      });
    } else if (t.paymentMethod !== 'KASBON') {
      cashMovements.push({
        id: t.id,
        date: t.timestamp,
        description: `Pendapatan Penjualan ${t.invoiceNo} (${t.paymentMethod})`,
        type: 'IN',
        amount: t.totalAmount,
        method: t.paymentMethod
      });
    }
  });

  const allMovements = [
    ...cashMovements,
    ...expenses.map(e => ({
      id: e.id,
      date: e.date,
      description: `Pengeluaran: ${e.description}`,
      type: 'OUT' as const,
      amount: e.amount,
      method: 'CASH'
    })),
    ...journalEntries
      .filter(je => je.account === 'KAS' && je.description.includes('Pelunasan piutang'))
      .map(je => ({
        id: je.id,
        date: je.date,
        description: je.description,
        type: 'IN' as const,
        amount: je.debit,
        method: 'CASH'
      }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalInTunai = allMovements.filter(m => m.type === 'IN' && m.method === 'CASH').reduce((sum, m) => sum + m.amount, 0);
  const totalInBank = allMovements.filter(m => m.type === 'IN' && m.method !== 'CASH').reduce((sum, m) => sum + m.amount, 0);
  const totalOut = allMovements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.amount, 0);
  const netCash = (totalInTunai + totalInBank) - totalOut;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-green-100 text-green-800 rounded-xl">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan Arus Kas</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Pantau pergerakan uang masuk (Tunai & Non-Tunai) dan keluar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Masuk (Tunai)</p>
            <p className="text-lg font-mono font-bold text-green-600">Rp {totalInTunai.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-full flex-shrink-0">
            <ArrowDownLeft className="w-5 h-5 text-green-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Masuk (Transfer/QRIS)</p>
            <p className="text-lg font-mono font-bold text-blue-600">Rp {totalInBank.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full flex-shrink-0">
            <ArrowDownLeft className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kas Keluar</p>
            <p className="text-lg font-mono font-bold text-red-600">Rp {totalOut.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-full flex-shrink-0">
            <ArrowUpRight className="w-5 h-5 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Saldo Bersih</p>
            <p className="text-xl font-mono font-black text-slate-800">Rp {netCash.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-full flex-shrink-0">
            <DollarSign className="w-5 h-5 text-slate-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-700">Rincian Pergerakan Kas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4 text-center">Tipe</th>
                <th className="p-4 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {allMovements.map((movement) => (
                <tr key={movement.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(movement.date).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{movement.description}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                      movement.type === 'IN' 
                        ? (movement.method === 'CASH' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800') 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movement.type === 'IN' ? <ArrowDownLeft className="w-3 h-3"/> : <ArrowUpRight className="w-3 h-3"/>}
                      <span>{movement.type === 'IN' ? (movement.method === 'CASH' ? 'MASUK TUNAI' : 'MASUK NON-TUNAI') : 'KELUAR'}</span>
                    </span>
                  </td>
                  <td className={`p-4 text-right font-mono font-bold ${movement.type === 'IN' ? (movement.method === 'CASH' ? 'text-green-600' : 'text-blue-600') : 'text-red-600'}`}>
                    {movement.type === 'IN' ? '+' : '-'}{movement.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allMovements.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Belum ada pergerakan kas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
