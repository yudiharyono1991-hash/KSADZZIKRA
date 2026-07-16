import React from 'react';
import { useAppStore } from '../../store';

export default function PrintFooter() {
  const { currentUser, activeBranchId } = useAppStore();
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const location = activeBranchId ? `Cabang ${activeBranchId}` : 'Kantor Pusat';

  return (
    <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '2px solid #374151' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            {/* Dibuat Oleh - Kasir */}
            <td style={{ textAlign: 'center', padding: '0 8px', verticalAlign: 'bottom' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '48px' }}>Dibuat Oleh,</p>
              <div style={{ borderBottom: '1px solid black', width: '100%', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {currentUser?.role === 'CASHIER' ? currentUser.name : '( Kasir )'}
              </p>
            </td>

            {/* Diperiksa Oleh - Admin */}
            <td style={{ textAlign: 'center', padding: '0 8px', verticalAlign: 'bottom', borderLeft: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '48px' }}>Diperiksa Oleh,</p>
              <div style={{ borderBottom: '1px solid black', width: '100%', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {currentUser?.role === 'ADMIN' ? currentUser.name : '( Admin )'}
              </p>
            </td>

            {/* Disetujui Oleh - Manager */}
            <td style={{ textAlign: 'center', padding: '0 8px', verticalAlign: 'bottom', borderLeft: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '48px' }}>Disetujui Oleh,</p>
              <div style={{ borderBottom: '1px solid black', width: '100%', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {currentUser?.role === 'MANAGER' ? currentUser.name : '( Manager Cabang )'}
              </p>
            </td>

            {/* Mengetahui - Ketua/Owner */}
            <td style={{ textAlign: 'center', padding: '0 8px', verticalAlign: 'bottom', borderLeft: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '10px', color: '#4b5563', marginBottom: '4px' }}>{location}, {today}</p>
              <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '48px' }}>Mengetahui,</p>
              <div style={{ borderBottom: '1px solid black', width: '100%', marginBottom: '4px' }}></div>
              <p style={{ fontSize: '10px', fontWeight: 'bold' }}>
                Dr. Grandis Imama Hendra,
              </p>
              <p style={{ fontSize: '9px', color: '#6b7280' }}>
                S.E.I., M.Sc (Acc), SAS.
              </p>
              <p style={{ fontSize: '9px', color: '#6b7280' }}>Ketua Toko Koperasi KSA Mart</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
