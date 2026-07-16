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
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px', borderBottom: '2px solid black', paddingBottom: '12px', color: 'black' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left: Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '56px', height: '56px', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', flexShrink: 0 }}>
            <img
              src="/ksa_mart_logo.png"
              alt="Logo KSA Mart"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{tenantName}</h1>
            <h2 style={{ fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{title}</h2>
            {period && <p style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px', margin: 0 }}>Periode: {period}</p>}
          </div>
        </div>

        {/* Right: Date/Time/Printed by */}
        <div style={{ textAlign: 'right', fontSize: '11px' }}>
          <p style={{ fontWeight: '600', margin: '0 0 2px 0' }}>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          <p style={{ fontWeight: '600', margin: '0 0 2px 0' }}>Jam Cetak: {new Date().toLocaleTimeString('id-ID')}</p>
          <p style={{ fontWeight: '600', marginTop: '6px', marginBottom: '2px' }}>Dicetak oleh:</p>
          <p style={{ fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{currentUser?.name || 'Sistem'}</p>
        </div>
      </div>
    </div>
  );
}
