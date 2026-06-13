import React from 'react';
import { useAppStore } from '../store';
import { DollarSign, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';

export default function ArusKasPage() {
  const { transactions, expenses } = useAppStore();

  // Sort all cash movements by date
  const cashMovements = [
    ...transactions.map(t => ({
      id: t.id,
      date: t.timestamp,
      description: `Penjualan ${t.invoiceNo}`,
      type: 'IN' as const,
      amount: t.totalAmount, // Assuming totalAmount is paid in cash or equivalents
    })),
    ...expenses.map(e => ({
      id: e.id,
      date: e.date,
      description: `Pengeluaran: ${e.description}`,
      type: 'OUT' as const,
      amount: e.amount,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIn = cashMovements.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.amount, 0);
  const totalOut = cashMovements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.amount, 0);
  const netCash = totalIn - totalOut;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan Arus Kas</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Pantau pergerakan uang masuk dan keluar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kas Masuk</p>
            <p className="text-xl font-mono font-bold text-emerald-600">Rp {totalIn.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-full">
            <ArrowDownLeft className="w-6 h-6 text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kas Keluar</p>
            <p className="text-xl font-mono font-bold text-red-600">Rp {totalOut.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-full">
            <ArrowUpRight className="w-6 h-6 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Saldo Kas Bersih</p>
            <p className="text-2xl font-mono font-black text-slate-800">Rp {netCash.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-full">
            <DollarSign className="w-6 h-6 text-slate-600" />
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
              {cashMovements.map((movement) => (
                <tr key={movement.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(movement.date).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{movement.description}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                      movement.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {movement.type === 'IN' ? <ArrowDownLeft className="w-3 h-3"/> : <ArrowUpRight className="w-3 h-3"/>}
                      <span>{movement.type === 'IN' ? 'MASUK' : 'KELUAR'}</span>
                    </span>
                  </td>
                  <td className={`p-4 text-right font-mono font-bold ${movement.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {movement.type === 'IN' ? '+' : '-'}{movement.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cashMovements.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Belum ada pergerakan kas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
