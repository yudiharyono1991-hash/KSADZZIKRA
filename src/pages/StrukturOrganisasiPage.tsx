import React from 'react';
import { useAppStore } from '../store';
import { Users, Crown, ShieldCheck, UserCircle, ArrowDown, ShoppingBag, Briefcase, Scale, Building, ArrowDownRight, ArrowDownLeft, Network } from 'lucide-react';

export default function StrukturOrganisasiPage() {
  const { users, customers, currentUser } = useAppStore();

  const isGlobalAdmin = !currentUser?.branchId || ['OWNER', 'SUPERADMIN', 'PENGURUS'].includes(currentUser?.role || '');
  const userBranchId = currentUser?.branchId;

  const getRoleUsers = (role: string) => users.filter(u => {
    if (u.role !== role) return false;
    // For operational staff, filter by branch if not global admin
    if (!isGlobalAdmin && (role === 'MANAGER' || role === 'ADMIN' || role === 'CASHIER')) {
      if (u.branchId !== userBranchId) return false;
    }
    return true;
  });
  
  const owner = users.find(u => u.role === 'OWNER') || { id: 'owner_1', name: 'Dr. Grandis Imama Hendra, S.E.I., M.Sc (Acc), SAS.', jobTitle: 'Ketua Koperasi' };
  const allPengurus = getRoleUsers('PENGURUS');
  
  const dewanPengawasDps = allPengurus.filter(p => p.jobTitle?.toLowerCase().includes('pengawas') || p.jobTitle?.toLowerCase().includes('dps'));
  const jajaranPengurus = allPengurus.filter(p => !(p.jobTitle?.toLowerCase().includes('pengawas') || p.jobTitle?.toLowerCase().includes('dps')));
  
  const managers = getRoleUsers('MANAGER');
  const admins = getRoleUsers('ADMIN');
  const cashiers = getRoleUsers('CASHIER');
  
  // Pelanggan/Anggota
  const totalPelanggan = customers.length;
  const pelangganUsers = getRoleUsers('PELANGGAN').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 text-green-800 rounded-xl">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Struktur Organisasi</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Hierarki Standar Koperasi Syariah KSA Mart</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-4 md:p-12 w-full mx-auto overflow-x-auto flex flex-col items-center min-w-[700px]">
        
        {/* Level 1: R.A.T / ANGGOTA (TOP LEVEL) */}
        <div className="flex flex-col items-center w-full">
          <div className="bg-rose-50 border-2 border-rose-400 p-6 rounded-2xl w-full max-w-lg text-center shadow-lg relative z-10">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-100 p-2 rounded-full border-2 border-rose-400">
              <Users className="w-6 h-6 text-rose-600" />
            </div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mt-2">Kekuasaan Tertinggi (Pemilik)</p>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">R.A.T & ANGGOTA KOPERASI</h2>
            <div className="flex justify-center gap-4 mt-3">
              <span className="bg-white dark:bg-slate-900 border border-rose-200 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">{totalPelanggan} Anggota Terdaftar</span>
            </div>
          </div>
          
          {/* Stem branching down */}
          <div className="h-8 w-1 bg-slate-300 relative"></div>
          
          {/* Horizontal Split Line */}
          <div className="w-[500px] h-1 bg-slate-300 relative flex justify-between">
            <div className="w-1 h-8 bg-slate-300 absolute left-0 top-0"></div>
            <div className="w-1 h-8 bg-slate-300 absolute right-0 top-0"></div>
          </div>
        </div>

        {/* Level 2: PENGAWAS vs PENGURUS (SIDE-BY-SIDE) */}
        <div className="flex justify-center gap-16 w-[700px] mt-8 relative z-10">
          
          {/* LEFT SIDE: PENGAWAS & DPS */}
          <div className="flex flex-col items-center flex-1">
            <div className="bg-purple-50 border-2 border-purple-400 p-6 rounded-2xl w-full text-center shadow-lg relative z-10">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-purple-100 p-2 rounded-full border-2 border-purple-400">
                <Scale className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-1">Lembaga Pengawas</p>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">PENGAWAS & DPS</h2>
              <div className="mt-4 flex flex-col gap-2">
                {dewanPengawasDps.length > 0 ? dewanPengawasDps.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-purple-200 shadow-sm flex flex-col">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{p.name}</span>
                    <span className="text-[9px] font-bold text-purple-600 uppercase">{p.jobTitle}</span>
                  </div>
                )) : (
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-purple-200 text-xs text-slate-400 italic shadow-sm">Belum ada ditunjuk</div>
                )}
              </div>
            </div>
            {/* Visual dashed line pointing to Pengurus to show supervision */}
            <div className="w-12 border-b-2 border-dashed border-purple-300 absolute top-24 right-[50%] translate-x-[4.5rem]"></div>
          </div>

          {/* RIGHT SIDE: PENGURUS (Ketua) */}
          <div className="flex flex-col items-center flex-1">
            <div className="bg-amber-50 border-2 border-amber-400 p-6 rounded-2xl w-full text-center shadow-lg relative z-10">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-100 p-2 rounded-full border-2 border-amber-400">
                <Building className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Eksekutif / Manajemen</p>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">PENGURUS</h2>
              <div className="mt-4 flex flex-col gap-2">
                <div className="bg-amber-100 p-2 rounded-lg border-2 border-amber-300 shadow-sm flex flex-col">
                    <span className="font-black text-slate-800 dark:text-slate-200 text-sm">{owner.name}</span>
                    <span className="text-[9px] font-bold text-amber-700 uppercase">{owner.jobTitle || 'Ketua Koperasi'}</span>
                </div>
                {jajaranPengurus.map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-amber-200 shadow-sm flex flex-col">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{p.name}</span>
                    <span className="text-[9px] font-bold text-amber-600 uppercase">{p.jobTitle || 'Pengurus'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-10 w-1 bg-slate-300 relative"><ArrowDown className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-6 text-slate-400" /></div>
          </div>
        </div>

        {/* Level 3: MANAGER */}
        <div className="flex flex-col items-center w-full mt-4 translate-x-[183px]">
          <div className="bg-indigo-50 border-2 border-indigo-400 p-4 rounded-2xl w-[318px] text-center shadow-lg relative z-10">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Operasional</p>
            <h2 className="text-md font-black text-slate-800 dark:text-slate-200">MANAGER</h2>
            <div className="mt-2 flex flex-col gap-1">
              {managers.length > 0 ? managers.map(m => (
                <div key={m.id} className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-indigo-200 font-bold text-slate-700 dark:text-slate-300 text-sm shadow-sm">{m.name}</div>
              )) : (
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-indigo-200 text-xs text-slate-400 italic shadow-sm">Belum ditunjuk</div>
              )}
            </div>
          </div>
          <div className="h-8 w-1 bg-slate-300 relative"><ArrowDown className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 text-slate-400" /></div>
        </div>

        {/* Level 4: ADMIN */}
        <div className="flex flex-col items-center w-full mt-3 translate-x-[183px]">
          <div className="bg-blue-50 border-2 border-blue-400 p-4 rounded-2xl w-[318px] text-center shadow-lg relative z-10">
            <h2 className="text-md font-black text-slate-800 dark:text-slate-200">ADMINISTRATOR</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {admins.length > 0 ? admins.map(a => (
                <div key={a.id} className="bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-blue-200 font-bold text-slate-700 dark:text-slate-300 text-xs shadow-sm">{a.name}</div>
              )) : (
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-blue-200 text-xs text-slate-400 italic shadow-sm w-full">Belum ditunjuk</div>
              )}
            </div>
          </div>
          <div className="h-8 w-1 bg-slate-300 relative"><ArrowDown className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 text-slate-400" /></div>
        </div>

        {/* Level 5: KASIR */}
        <div className="flex flex-col items-center w-full mt-3 translate-x-[183px]">
          <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl w-[318px] text-center shadow-lg relative z-10">
            <h2 className="text-md font-black text-slate-800 dark:text-slate-200">TIM KASIR</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {cashiers.length > 0 ? cashiers.map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-emerald-200 font-bold text-slate-700 dark:text-slate-300 text-xs shadow-sm">{c.name}</div>
              )) : (
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-emerald-200 text-xs text-slate-400 italic shadow-sm w-full">Belum ditunjuk</div>
              )}
            </div>
          </div>
          <div className="h-8 w-1 bg-slate-300 relative"><ArrowDown className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 text-slate-400" /></div>
        </div>

        {/* Level 6: PELANGGAN NON-ANGGOTA (BOTTOM) */}
        <div className="flex flex-col items-center w-full mt-3 translate-x-[183px]">
          <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 p-4 rounded-2xl w-[318px] text-center shadow-lg relative z-10">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Konsumen</p>
            <h2 className="text-md font-black text-slate-800 dark:text-slate-200">PELANGGAN UMUM</h2>
            <div className="mt-2">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 shadow-sm flex items-center justify-between mt-1 text-xs">
                <span>Akun Portal Konsumen</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{pelangganUsers}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
