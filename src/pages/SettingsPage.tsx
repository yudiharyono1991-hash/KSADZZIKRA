import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Settings, Percent, Save, CheckCircle, Lock, AlertCircle, Building2, Wallet } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, currentUser } = useAppStore();
  const [isTaxEnabled, setIsTaxEnabled] = useState(settings.isTaxEnabled);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [ownerBankName, setOwnerBankName] = useState(settings.ownerBankName || 'BSI (Bank Syariah Indonesia)');
  const [ownerBankAccount, setOwnerBankAccount] = useState(settings.ownerBankAccount || '7182938495');
  const [qrisEnabled, setQrisEnabled] = useState(settings.qrisEnabled ?? true);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Password state
  const { users, updateUser } = useAppStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Jika owner saja yang boleh akses
  // (Pajak hanya untuk Owner/Admin, Ganti Sandi untuk Semua User)

  useEffect(() => {
    setIsTaxEnabled(settings.isTaxEnabled);
    setTaxRate(settings.taxRate.toString());
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      isTaxEnabled,
      taxRate: Number(taxRate) || 0,
      ownerBankName,
      ownerBankAccount,
      qrisEnabled
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwdError('Harap isi semua kolom kata sandi.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Kata sandi baru tidak cocok.');
      return;
    }

    // Cari data user lengkap berdasarkan username currentUser
    const fullUser = users.find(u => u.username === currentUser?.username);
    
    if (!fullUser) {
      setPwdError('Data pengguna tidak ditemukan.');
      return;
    }

    if (fullUser.password !== oldPassword) {
      setPwdError('Kata sandi lama salah.');
      return;
    }

    // Update password
    updateUser(fullUser.id, { password: newPassword });
    
    setPwdSuccess('Kata sandi berhasil diubah!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwdSuccess(''), 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pengaturan Toko</h1>
            <p className="text-sm text-gray-500">Konfigurasi operasional dan perpajakan sistem POS.</p>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-sm">Pengaturan berhasil disimpan!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-gray-800">Pajak Pertambahan Nilai (PPN/PB1)</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-gray-800 block text-sm">Aktifkan Pajak</label>
                    <p className="text-xs text-gray-500 mt-1">Pajak akan ditambahkan ke total belanja secara otomatis di Kasir.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={isTaxEnabled}
                      onChange={(e) => setIsTaxEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {isTaxEnabled && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="font-bold text-gray-800 block text-sm">Persentase Pajak (%)</label>
                    <div className="relative w-1/2">
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Contoh: 11 untuk PPN Indonesia saat ini.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-gray-800">Informasi Rekening & QRIS Owner</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Nama Bank Tujuan</label>
                  <input
                    type="text"
                    value={ownerBankName}
                    onChange={(e) => setOwnerBankName(e.target.value)}
                    placeholder="Contoh: BSI (Bank Syariah Indonesia)"
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Nomor Rekening</label>
                  <input
                    type="text"
                    value={ownerBankAccount}
                    onChange={(e) => setOwnerBankAccount(e.target.value)}
                    placeholder="Contoh: 7182938495"
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <label className="font-bold text-gray-800 block text-sm">Aktifkan QRIS</label>
                    <p className="text-xs text-gray-500 mt-1">Izinkan pelanggan membayar via scan QRIS.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={qrisEnabled}
                      onChange={(e) => setQrisEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <button 
                  onClick={handleSave}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Simpan Pengaturan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-800">Keamanan Akun (Ganti Sandi)</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              {pwdError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{pwdError}</span>
                </div>
              )}
              {pwdSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Sandi Saat Ini</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan sandi lama"
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan sandi baru"
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Konfirmasi Sandi Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang sandi baru"
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button 
                type="submit"
                className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Ganti Kata Sandi
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
