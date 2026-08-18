import React from 'react';
import { useAppStore } from '../../store';

interface PrintHeaderProps {
  title: string;
  period?: string;
}

export default function PrintHeader({ title, period }: PrintHeaderProps) {
  const { currentUser, tenants } = useAppStore();
  
  // Find current active branch/tenant name
  const tenantName = tenants.find(t => t.id === currentUser?.tenantId)?.name || 'KSA Mart Syariah';

  return (
    <div className="flex flex-col mb-4 md:mb-6 border-b-2 border-black pb-3 text-black w-full">
      <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start gap-3 sm:gap-0">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-14 md:h-14 print:w-14 print:h-14 border border-slate-300 rounded-lg flex items-center justify-center p-1 shrink-0">
            <img
              src="/ksa_mart_logo.png"
              alt="Logo KSA Mart"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm md:text-lg print:text-xl font-black uppercase tracking-wider m-0 leading-tight">{tenantName}</h1>
            <h2 className="text-xs md:text-sm print:text-base font-bold uppercase m-0 leading-tight mt-0.5">{title}</h2>
            {period && <p className="text-[10px] md:text-xs print:text-xs font-semibold mt-1 mb-0">Periode: {period}</p>}
          </div>
        </div>

        {/* Right: Date/Time/Printed by */}
        <div className="text-left sm:text-right print:text-right text-[9px] md:text-[11px] print:text-[11px] w-full sm:w-auto mt-2 sm:mt-0 print:mt-0 flex flex-row sm:flex-col print:flex-col justify-between sm:justify-start print:justify-start">
          <div>
            <p className="font-semibold m-0 mb-0.5">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
            <p className="font-semibold m-0 mb-0.5">Jam Cetak: {new Date().toLocaleTimeString('id-ID')}</p>
          </div>
          <div className="text-right sm:text-right print:text-right sm:mt-1.5 print:mt-1.5">
            <p className="font-semibold m-0 mb-0.5">Dicetak oleh:</p>
            <p className="font-bold uppercase m-0">{currentUser?.name || 'Sistem'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
