import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Settings, Percent, Save, CheckCircle, Lock, AlertCircle, Building2, Wallet, Store, Copy, Link } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, currentUser, users, updateUser } = useAppStore();
  const [isTaxEnabled, setIsTaxEnabled] = useState(settings.isTaxEnabled);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [ownerBankName, setOwnerBankName] = useState(settings.ownerBankName || 'BSI (Bank Syariah Indonesia)');
  const [ownerBankAccount, setOwnerBankAccount] = useState(settings.ownerBankAccount || '7182938495');
  const [qrisEnabled, setQrisEnabled] = useState(settings.qrisEnabled ?? true);
  const [qrisImageUrl, setQrisImageUrl] = useState(settings.qrisImageUrl || '');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [ownerName, setOwnerName] = useState(currentUser?.name || '');
  const [storeName, setStoreName] = useState(settings.storeName || 'BA Mart Syariah');
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress || '');
  const [storePhone, setStorePhone] = useState(settings.storePhone || '');
  const [businessType, setBusinessType] = useState<'KOPERASI' | 'UMUM'>(settings.businessType || 'KOPERASI');

  const isOwner = currentUser?.role === 'OWNER';

  useEffect(() => {
    setIsTaxEnabled(settings.isTaxEnabled);
    setTaxRate(settings.taxRate.toString());
  }, [settings]);

  const handleSave = () => {
    // PROTEKSI AKUN DEMO: Hanya Pengembang Utama yang bisa merubah pengaturan profil toko asli
    if (currentUser?.username !== 'admin' && currentUser?.username !== 'pengembang' && currentUser?.username !== 'yudiharyono1991@gmail.com') {
      alert("⚠️ MODE DEMO (UJI COBA) ⚠️\n\nMaaf, Anda tidak diizinkan merubah Pengaturan Toko, Pajak, dan QRIS karena ini adalah akun uji coba. Hanya Bapak Yudi Haryono (Pengembang) yang memiliki otoritas untuk merubah data Master Profil Toko.");
      return;
    }

    updateSettings({
      isTaxEnabled,
      taxRate: Number(taxRate) || 0,
      ownerBankName,
      ownerBankAccount,
      qrisEnabled,
      storeName,
      storeAddress,
      storePhone,
      businessType
    });

    if (isOwner && currentUser) {
      const ownerUser = users.find(u => u.username === currentUser.username);
      if (ownerUser && ownerUser.name !== ownerName) {
        updateUser(ownerUser.id, { name: ownerName });
      }
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
                        disabled={!isOwner}
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className={`w-full border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
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
                    disabled={!isOwner}
                    value={ownerBankName}
                    onChange={(e) => setOwnerBankName(e.target.value)}
                    placeholder="Contoh: BSI (Bank Syariah Indonesia)"
                    className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Nomor Rekening</label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={ownerBankAccount}
                    onChange={(e) => setOwnerBankAccount(e.target.value)}
                    placeholder="Contoh: 7182938495"
                    className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
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

                {qrisEnabled && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Upload QRIS Statis Toko (Opsional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setQrisImageUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-gray-200 p-1 rounded-lg"
                    />
                    {qrisImageUrl && (
                      <div className="mt-2 w-32 h-32 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <img src={qrisImageUrl} alt="QRIS" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">Upload barcode QRIS toko Anda agar pelanggan bisa menscan langsung saat checkout.</p>
                  </div>
                )}

                {isOwner ? (
                  <button 
                    onClick={handleSave}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Pengaturan
                  </button>
                ) : (
                  <div className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 font-bold py-2.5 rounded-xl border border-gray-200">
                    <Lock className="w-4 h-4" />
                    Hanya Owner Yang Bisa Mengubah Data
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profil Toko Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-800">Profil & Identitas Toko</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Nama Pemilik (Owner)</label>
              <input
                type="text"
                disabled={!isOwner}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Misal: Bapak/Ibu Owner"
                className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Nama Toko (Sesuai KTP/NIB)</label>
              <input
                type="text"
                disabled={!isOwner}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Misal: Berkah Amanah Mart"
                className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                disabled={!isOwner}
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="Misal: 08123456789"
                className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Alamat Lengkap Toko</label>
              <textarea
                disabled={!isOwner}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Misal: Jl. Sudirman No. 123, Jakarta"
                rows={3}
                className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Tipe Usaha</label>
              <select
                disabled={!isOwner}
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as 'KOPERASI' | 'UMUM')}
                className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              >
                <option value="KOPERASI">Toko Koperasi (Lengkap dengan SHU)</option>
                <option value="UMUM">Toko Umum / Ritel Biasa</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 block mb-2">Portal Pelanggan (Online Order)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/#/member`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-500"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/#/member`);
                    alert("Tautan berhasil disalin!");
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shrink-0"
                >
                  <Copy size={16} /> Salin
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Bagikan tautan ini ke pelanggan agar mereka bisa memesan barang secara online (Sesuai PSAK Syariah).</p>
            </div>

            {isOwner ? (
              <button 
                onClick={handleSave}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Profil Toko
              </button>
            ) : (
              <div className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 font-bold py-2.5 rounded-xl border border-gray-200">
                <Lock className="w-4 h-4" />
                Akses Terkunci (Khusus Owner)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
