import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Settings, Percent, Save, CheckCircle, Lock, Building2, Wallet, Store, Copy, Database, Plus, Trash2, CreditCard, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, currentUser, users, updateUser, clearAllData } = useAppStore();
  const [isTaxEnabled, setIsTaxEnabled] = useState(settings.isTaxEnabled);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [ownerBankName, setOwnerBankName] = useState(settings.ownerBankName || 'BSI (Bank Syariah Indonesia)');
  const [ownerBankAccount, setOwnerBankAccount] = useState(settings.ownerBankAccount || '7182938495');
  const [qrisEnabled, setQrisEnabled] = useState(settings.qrisEnabled ?? true);
  const [qrisImageUrl, setQrisImageUrl] = useState(settings.qrisImageUrl || '');
  const [showSuccess, setShowSuccess] = useState(false);
  const [ownerName, setOwnerName] = useState(currentUser?.name || '');
  const [storeName, setStoreName] = useState(settings.storeName || 'KSA Mart Syariah');
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress || '');
  const [storePhone, setStorePhone] = useState(settings.storePhone || '');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(settings.ownerWhatsapp || '');
  const [businessType, setBusinessType] = useState<'KOPERASI' | 'UMUM'>(settings.businessType || 'KOPERASI');
  const [ownerUsername, setOwnerUsername] = useState(currentUser?.username || '');
  const [ownerPassword, setOwnerPassword] = useState('');

  // Payment Methods
  type BankEntry = { enabled: boolean; bankName: string; accountNumber: string; accountName: string; };
  type EwalletEntry = { enabled: boolean; provider: string; number: string; accountName: string; };
  const [bankTransfers, setBankTransfers] = useState<BankEntry[]>(
    settings.paymentMethods?.bankTransfer || [
      { enabled: true, bankName: 'BSI (Bank Syariah Indonesia)', accountNumber: '7182938495', accountName: 'KSA Mart' },
    ]
  );
  const [ewallets, setEwallets] = useState<EwalletEntry[]>(
    settings.paymentMethods?.ewallet || []
  );

  const isOwner = currentUser?.role === 'OWNER';

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
      qrisEnabled,
      qrisImageUrl,
      storeName,
      storeAddress,
      storePhone,
      businessType,
      ownerWhatsapp,
      paymentMethods: {
        bankTransfer: bankTransfers,
        ewallet: ewallets,
      },
    });

    if (isOwner && currentUser) {
      const ownerUser = users.find(u => u.username === currentUser.username);
      if (ownerUser) {
        const updates: Partial<any> = {};
        if (ownerName && ownerUser.name !== ownerName) updates.name = ownerName;
        if (ownerUsername && ownerUser.username !== ownerUsername) updates.username = ownerUsername;
        if (ownerPassword) updates.password = ownerPassword;
        if (Object.keys(updates).length > 0) {
          updateUser(ownerUser.id, updates);
        }
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
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
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
                          reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 400;
                              const scaleSize = MAX_WIDTH / img.width;
                              canvas.width = MAX_WIDTH;
                              canvas.height = img.height * scaleSize;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                              setQrisImageUrl(dataUrl);
                            };
                            img.src = event.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer border border-gray-200 p-1 rounded-lg"
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
            <Store className="w-5 h-5 text-green-600" />
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
                className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              />
            </div>
            {isOwner && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Username Login Owner</label>
                  <input
                    type="text"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Sandi Baru Owner (Opsional)</label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin diubah"
                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Nama Toko (Sesuai KTP/NIB)</label>
              <input
                type="text"
                disabled={!isOwner}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Misal: KSA Mart"
                className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
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
                className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
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
                className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Tipe Usaha</label>
              <select
                disabled={!isOwner}
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as 'KOPERASI' | 'UMUM')}
                className={`w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none ${!isOwner ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
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
                className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md cursor-pointer"
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

      {/* Metode Pembayaran (Owner Only) */}
      {isOwner && (
        <div className="mt-2 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-800">Metode Pembayaran (Transfer & E-Wallet)</h2>
          </div>

          {/* Bank Transfer */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500"/>Transfer Bank</h3>
              <button
                onClick={() => setBankTransfers(prev => [...prev, { enabled: true, bankName: 'BSI (Bank Syariah Indonesia)', accountNumber: '', accountName: '' }])}
                className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
              >
                <Plus className="w-3 h-3" /> Tambah Bank
              </button>
            </div>
            <div className="p-4 space-y-3">
              {bankTransfers.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Belum ada rekening bank yang ditambahkan.</p>}
              {bankTransfers.map((b, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 relative">
                  <button onClick={() => setBankTransfers(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-6">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Bank</label>
                      <select value={b.bankName} onChange={e => setBankTransfers(prev => prev.map((x,idx) => idx===i ? {...x, bankName: e.target.value} : x))} className="w-full border border-gray-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none mt-0.5">
                        <option>BSI (Bank Syariah Indonesia)</option>
                        <option>Bank BRI</option>
                        <option>Bank BCA</option>
                        <option>Bank Mandiri</option>
                        <option>Bank BNI</option>
                        <option>Bank Muamalat</option>
                        <option>Bank MEGA Syariah</option>
                        <option>Bank Permata Syariah</option>
                        <option>Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">No. Rekening</label>
                      <input type="text" value={b.accountNumber} onChange={e => setBankTransfers(prev => prev.map((x,idx) => idx===i ? {...x, accountNumber: e.target.value} : x))} placeholder="contoh: 7182938495" className="w-full border border-gray-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none mt-0.5"/>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Pemilik Rekening</label>
                      <input type="text" value={b.accountName} onChange={e => setBankTransfers(prev => prev.map((x,idx) => idx===i ? {...x, accountName: e.target.value} : x))} placeholder="contoh: Yudi Haryono" className="w-full border border-gray-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none mt-0.5"/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* E-Wallet */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2"><Smartphone className="w-4 h-4 text-purple-500"/>E-Wallet / QRIS</h3>
              <button
                onClick={() => setEwallets(prev => [...prev, { enabled: true, provider: 'GoPay', number: '', accountName: '' }])}
                className="flex items-center gap-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-lg border border-purple-200 transition-colors"
              >
                <Plus className="w-3 h-3" /> Tambah E-Wallet
              </button>
            </div>
            <div className="p-4 space-y-3">
              {ewallets.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Belum ada e-wallet yang ditambahkan.</p>}
              {ewallets.map((w, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 relative">
                  <button onClick={() => setEwallets(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-6">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Provider</label>
                      <select value={w.provider} onChange={e => setEwallets(prev => prev.map((x,idx) => idx===i ? {...x, provider: e.target.value} : x))} className="w-full border border-gray-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none mt-0.5">
                        <option>GoPay</option>
                        <option>OVO</option>
                        <option>DANA</option>
                        <option>ShopeePay</option>
                        <option>LinkAja</option>
                        <option>QRIS (Semua)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">No. / ID E-Wallet</label>
                      <input type="text" value={w.number} onChange={e => setEwallets(prev => prev.map((x,idx) => idx===i ? {...x, number: e.target.value} : x))} placeholder="contoh: 08123456789" className="w-full border border-gray-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none mt-0.5"/>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Akun</label>
                      <input type="text" value={w.accountName} onChange={e => setEwallets(prev => prev.map((x,idx) => idx===i ? {...x, accountName: e.target.value} : x))} placeholder="contoh: Yudi Haryono" className="w-full border border-gray-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none mt-0.5"/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md">
            <Save className="w-4 h-4" /> Simpan Metode Pembayaran
          </button>
        </div>
      )}

      {/* Zona Bahaya */}
      {isOwner && (
        <div className="mt-8 bg-red-50 p-6 rounded-2xl border border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-red-900">Zona Bahaya (Danger Zone)</h2>
              <p className="text-sm text-red-700">Tindakan di bawah ini tidak dapat dibatalkan.</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-red-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <p className="font-bold text-gray-800 text-sm">Hapus Semua Data Uji Coba</p>
              <p className="text-xs text-gray-500 mt-1 max-w-lg leading-relaxed">
                Mengosongkan seluruh data transaksi, produk, jurnal, kas, absensi, dan laporan ke kondisi 0 (Nol) agar aplikasi siap digunakan untuk produksi (Live).
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA?\\n\\nTindakan ini TIDAK BISA dibatalkan dan akan mereset aplikasi menjadi kosong.')) {
                  clearAllData();
                  alert('Berhasil! Semua data uji coba telah dihapus.');
                  window.location.href = '/';
                }
              }}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-sm transition shrink-0"
            >
              Reset Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
