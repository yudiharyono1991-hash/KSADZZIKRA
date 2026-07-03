import React from 'react';
import { useAppStore } from '../store';
import { Users, Crown, ShieldCheck, UserCircle, ArrowDown, Store } from 'lucide-react';

export default function StrukturOrganisasiPage() {
  const { users, branches } = useAppStore();

  const owner = users.find(u => u.role === 'OWNER') || { name: 'Dr. Grandis Imama Hendra, S.E.I., M.Sc (Acc), SAS.', role: 'OWNER' };
  
  // Group branches
  const getBranchUsers = (branchId: string, role: string) => {
    return users.filter(u => u.branchId === branchId && u.role === role);
  };

  const getPusatUsers = (role: string) => {
    return users.filter(u => !u.branchId && u.role === role);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 text-green-800 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Struktur Organisasi</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">Bagan hierarki dan alur pelaporan KSA Mart</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-8 max-w-6xl mx-auto overflow-x-auto">
        
        {/* Level 1: Owner */}
        <div className="flex flex-col items-center min-w-max">
          <div className="bg-amber-50 border-2 border-amber-400 p-6 rounded-2xl w-64 text-center shadow-lg relative z-10">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-100 p-2 rounded-full border-2 border-amber-400">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="mt-2 text-lg font-black text-slate-800">{owner.name}</h3>
            <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mt-1">Ketua Toko Koperasi KSA Mart</p>
            <p className="text-[10px] text-slate-500 mt-2 leading-tight">Menerima dan menyetujui seluruh laporan keuangan dari semua cabang.</p>
          </div>
          
          <div className="h-12 w-0.5 bg-slate-300 relative">
            <ArrowDown className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Level 2 & 3: Branches Container */}
        <div className="flex gap-8 justify-center min-w-max relative mt-4">
          
          {/* Kantor Pusat (No Branch) */}
          <div className="flex flex-col items-center flex-1 min-w-[300px] border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
             <div className="flex items-center gap-2 mb-6 bg-slate-800 text-white px-4 py-1.5 rounded-full">
               <Store className="w-4 h-4" />
               <span className="text-xs font-bold uppercase tracking-wider">Kantor Pusat</span>
             </div>

             {/* Pusat Admins */}
             <div className="bg-blue-50 border-2 border-blue-400 p-4 rounded-xl w-full text-center shadow-sm relative z-10 mb-8">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-100 p-1.5 rounded-full border border-blue-400">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 mt-1">Administrator</p>
                <div className="flex flex-col gap-2">
                  {getPusatUsers('ADMIN').length > 0 ? getPusatUsers('ADMIN').map(admin => (
                    <div key={admin.id} className="bg-white px-2 py-1.5 rounded shadow-xs border border-blue-100">
                      <p className="font-bold text-sm text-slate-800">{admin.name}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic">Belum ada Admin</p>
                  )}
                </div>
             </div>

             {/* Pusat Cashiers */}
             <div className="bg-green-50 border-2 border-green-400 p-4 rounded-xl w-full text-center shadow-sm relative z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-100 p-1.5 rounded-full border border-green-400">
                  <UserCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2 mt-1">Tim Kasir</p>
                <div className="grid grid-cols-2 gap-2">
                  {getPusatUsers('CASHIER').length > 0 ? getPusatUsers('CASHIER').map(cashier => (
                    <div key={cashier.id} className="bg-white px-2 py-1.5 rounded shadow-xs border border-green-100">
                      <p className="font-bold text-xs text-slate-800">{cashier.name}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic col-span-2">Belum ada Kasir</p>
                  )}
                </div>
             </div>
          </div>

          {/* Dynamic Branches */}
          {branches.map(branch => (
            <div key={branch.id} className="flex flex-col items-center flex-1 min-w-[300px] border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-6 bg-slate-800 text-white px-4 py-1.5 rounded-full">
                <Store className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{branch.name}</span>
              </div>

              {/* Branch Admins */}
              <div className="bg-blue-50 border-2 border-blue-400 p-4 rounded-xl w-full text-center shadow-sm relative z-10 mb-8">
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-100 p-1.5 rounded-full border border-blue-400">
                   <ShieldCheck className="w-4 h-4 text-blue-600" />
                 </div>
                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 mt-1">Admin Cabang</p>
                 <div className="flex flex-col gap-2">
                   {getBranchUsers(branch.id, 'ADMIN').length > 0 ? getBranchUsers(branch.id, 'ADMIN').map(admin => (
                     <div key={admin.id} className="bg-white px-2 py-1.5 rounded shadow-xs border border-blue-100">
                       <p className="font-bold text-sm text-slate-800">{admin.name}</p>
                     </div>
                   )) : (
                     <p className="text-xs text-slate-400 italic">Belum ada Admin</p>
                   )}
                 </div>
              </div>

              {/* Branch Cashiers */}
              <div className="bg-green-50 border-2 border-green-400 p-4 rounded-xl w-full text-center shadow-sm relative z-10">
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-100 p-1.5 rounded-full border border-green-400">
                   <UserCircle className="w-4 h-4 text-green-600" />
                 </div>
                 <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2 mt-1">Tim Kasir</p>
                 <div className="grid grid-cols-2 gap-2">
                   {getBranchUsers(branch.id, 'CASHIER').length > 0 ? getBranchUsers(branch.id, 'CASHIER').map(cashier => (
                     <div key={cashier.id} className="bg-white px-2 py-1.5 rounded shadow-xs border border-green-100">
                       <p className="font-bold text-xs text-slate-800">{cashier.name}</p>
                     </div>
                   )) : (
                     <p className="text-xs text-slate-400 italic col-span-2">Belum ada Kasir</p>
                   )}
                 </div>
              </div>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}
