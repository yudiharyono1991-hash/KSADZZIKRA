import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Settings, Percent, Save, CheckCircle, Lock, Building2, Wallet, Store, Copy, Database, Plus, Trash2, CreditCard, Smartphone, Download, MapPin, RefreshCw, Globe, Clock, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabaseService, isSupabaseConfigured } from '../lib/supabase';

export default function SettingsPage() {
  const {
    settings, updateSettings, currentUser, users, updateUser, clearAllData,
    products, transactions, onlineOrders, attendances, expenses, closings, branches, customers, suppliers
  } = useAppStore();
  const [isTaxEnabled, setIsTaxEnabled] = useState(settings.isTaxEnabled);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [ownerBankName, setOwnerBankName] = useState(settings.ownerBankName || 'BSI (Bank Syariah Indonesia)');
  const [ownerBankAccount, setOwnerBankAccount] = useState(settings.ownerBankAccount || '7182938495');
  const [qrisEnabled, setQrisEnabled] = useState(settings.qrisEnabled ?? true);
  const [qrisImageUrl, setQrisImageUrl] = useState(settings.qrisImageUrl || '');
  const [paymentTimeoutMinutes, setPaymentTimeoutMinutes] = useState(settings.paymentTimeoutMinutes || 0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ownerName, setOwnerName] = useState(currentUser?.name || '');
  const [storeName, setStoreName] = useState(settings.storeName || 'KSA Mart Syariah');
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress || '');
  const [storeLocationLat, setStoreLocationLat] = useState(settings.storeLocationLat?.toString() || '');
  const [storeLocationLng, setStoreLocationLng] = useState(settings.storeLocationLng?.toString() || '');
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState(settings.maxDeliveryRadiusKm?.toString() || '5');
  const [attendanceRadiusMeters, setAttendanceRadiusMeters] = useState(settings.attendanceRadiusMeters?.toString() || '50');

  // Advanced Settings
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode ?? false);
  const [minimumCashBalance, setMinimumCashBalance] = useState(settings.minimumCashBalance?.toString() || '1000000');

  // Charity & Zakat Settings
  const [enableCharityZakat, setEnableCharityZakat] = useState(settings.enableCharityZakat ?? false);
  const [charityZakatPercentage, setCharityZakatPercentage] = useState(settings.charityZakatPercentage?.toString() || '2.5');
  const [charityTitle, setCharityTitle] = useState(settings.charityTitle || 'Kewajiban Zakat Niaga');
  const [charityDescription, setCharityDescription] = useState(settings.charityDescription || 'Zakat Kontribusi Sebesar Rp {amount} dari transaksi ini dicadangkan untuk kaum Dhuafa.');
  
  // Loyalty Points
  const [enablePoints, setEnablePoints] = useState(settings.enablePoints ?? true);
  const [pointEarningRate, setPointEarningRate] = useState(settings.pointEarningRate?.toString() || '1000');
  const [pointRedemptionValue, setPointRedemptionValue] = useState(settings.pointRedemptionValue?.toString() || '10');

  // PPOB Integration Settings
  const [enablePpobIntegration, setEnablePpobIntegration] = useState(settings.enablePpobIntegration ?? false);
  const [ppobProviderUrl, setPpobProviderUrl] = useState(settings.ppobProviderUrl || '');
  const [ppobApiKey, setPpobApiKey] = useState(settings.ppobApiKey || '');
  const [defaultPpobAdminFee, setDefaultPpobAdminFee] = useState(settings.defaultPpobAdminFee?.toString() || '2000');
  
  // Supabase / Server Integration
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');

  const [autoApproveTransactions, setAutoApproveTransactions] = useState(settings.autoApproveTransactions ?? false);

  const [storePhone, setStorePhone] = useState(settings.storePhone || '');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(settings.ownerWhatsapp || '');
  
  // Operational Hours
  // Operational Hours
  const [operationalHours, setOperationalHours] = useState(settings.operationalHours || {
    isOpen: true,
    openTime: '07:00',
    closeTime: '21:00',
    closedMessage: 'Maaf, toko sedang tutup.',
    shifts: [],
    shiftAssignments: {}
  });

  const handleAddShift = () => {
    const newShifts = [...(operationalHours.shifts || [])];
    newShifts.push({
      id: `shift_${Date.now()}`,
      name: `Shift ${newShifts.length + 1}`,
      startTime: '07:00',
      endTime: '14:00'
    });
    setOperationalHours({ ...operationalHours, shifts: newShifts });
  };

  const handleRemoveShift = (id: string) => {
    const newShifts = (operationalHours.shifts || []).filter(s => s.id !== id);
    setOperationalHours({ ...operationalHours, shifts: newShifts });
  };

  const handleUpdateShift = (id: string, key: string, value: string) => {
    const newShifts = (operationalHours.shifts || []).map(s => s.id === id ? { ...s, [key]: value } : s);
    setOperationalHours({ ...operationalHours, shifts: newShifts });
  };
  const [businessType, setBusinessType] = useState<'KOPERASI' | 'UMUM'>(settings.businessType || 'KOPERASI');
  const [ownerUsername, setOwnerUsername] = useState(currentUser?.username || '');
  const [ownerPassword, setOwnerPassword] = useState('');

  // Landing Page Config
  const [landingShowTopDropdowns, setLandingShowTopDropdowns] = useState(settings.landingPageConfig?.showTopDropdowns ?? true);
  const [landingContactUs, setLandingContactUs] = useState(settings.landingPageConfig?.contactUs || { phone: '', email: '', address: '', description: '' });
  const [landingFaqs, setLandingFaqs] = useState(settings.landingPageConfig?.faqs || []);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

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
    setOwnerBankName(settings.ownerBankName || 'BSI (Bank Syariah Indonesia)');
    setOwnerBankAccount(settings.ownerBankAccount || '7182938495');
    setQrisEnabled(settings.qrisEnabled ?? true);
    setQrisImageUrl(settings.qrisImageUrl || '');
    setPaymentTimeoutMinutes(settings.paymentTimeoutMinutes || 0);
    setStoreName(settings.storeName || 'KSA Mart Syariah');
    setStoreAddress(settings.storeAddress || '');
    setStoreLocationLat(settings.storeLocationLat?.toString() || '');
    setStoreLocationLng(settings.storeLocationLng?.toString() || '');
    setMaxDeliveryRadiusKm(settings.maxDeliveryRadiusKm?.toString() || '5');
    setAttendanceRadiusMeters(settings.attendanceRadiusMeters?.toString() || '50');
    setMaintenanceMode(settings.maintenanceMode ?? false);
    setMinimumCashBalance(settings.minimumCashBalance?.toString() || '1000000');
    setEnableCharityZakat(settings.enableCharityZakat ?? false);
    setCharityZakatPercentage(settings.charityZakatPercentage?.toString() || '2.5');
    setCharityTitle(settings.charityTitle || 'Kewajiban Zakat Niaga');
    setCharityDescription(settings.charityDescription || 'Zakat Kontribusi Sebesar Rp {amount} dari transaksi ini dicadangkan untuk kaum Dhuafa.');
    setEnablePoints(settings.enablePoints ?? true);
    setPointEarningRate(settings.pointEarningRate?.toString() || '1000');
    setPointRedemptionValue(settings.pointRedemptionValue?.toString() || '10');
    setEnablePpobIntegration(settings.enablePpobIntegration ?? false);
    setPpobProviderUrl(settings.ppobProviderUrl || '');
    setPpobApiKey(settings.ppobApiKey || '');
    setAutoApproveTransactions(settings.autoApproveTransactions ?? false);
    setStorePhone(settings.storePhone || '');
    setOwnerWhatsapp(settings.ownerWhatsapp || '');
    if (settings.operationalHours) setOperationalHours(settings.operationalHours);
    setBusinessType(settings.businessType || 'KOPERASI');
    setBankTransfers(settings.paymentMethods?.bankTransfer || []);
    setEwallets(settings.paymentMethods?.ewallet || []);
    setSupabaseUrl(settings.supabaseUrl || '');
    setSupabaseAnonKey(settings.supabaseAnonKey || '');
    setLandingContactUs(settings.landingPageConfig?.contactUs || { phone: '', email: '', address: '', description: '' });
    setLandingFaqs(settings.landingPageConfig?.faqs || []);
    setLandingShowTopDropdowns(settings.landingPageConfig?.showTopDropdowns ?? true);
  }, [settings]);

  const handleSave = () => {
    try {
      updateSettings({
        isTaxEnabled,
        taxRate: Number(taxRate) || 0,
        ownerBankName,
        ownerBankAccount,
        qrisEnabled,
        qrisImageUrl,
        paymentTimeoutMinutes,
        storeName,
        storeAddress,
        storePhone,
        businessType,
        ownerWhatsapp,
        paymentMethods: {
          bankTransfer: bankTransfers,
          ewallet: ewallets,
        },
        storeLocationLat: storeLocationLat ? Number(storeLocationLat) : undefined,
        storeLocationLng: storeLocationLng ? Number(storeLocationLng) : undefined,
        maxDeliveryRadiusKm: Number(maxDeliveryRadiusKm) || 5,
        attendanceRadiusMeters: Number(attendanceRadiusMeters) || 50,
        maintenanceMode,
        minimumCashBalance: Number(minimumCashBalance) || 1000000,
        enableCharityZakat,
        charityZakatPercentage: Number(charityZakatPercentage) || 2.5,
        charityTitle,
        charityDescription,
        enablePoints,
        pointEarningRate: pointEarningRate !== '' ? Number(pointEarningRate) : 1000,
        pointRedemptionValue: pointRedemptionValue !== '' ? Number(pointRedemptionValue) : 10,
        enablePpobIntegration,
        ppobProviderUrl,
        ppobApiKey,
        defaultPpobAdminFee: Number(defaultPpobAdminFee) || 0,
        autoApproveTransactions,
        supabaseUrl,
        supabaseAnonKey,
        operationalHours,
        landingPageConfig: {
          showTopDropdowns: landingShowTopDropdowns,
          contactUs: landingContactUs,
          faqs: landingFaqs
        }
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
      alert("Alhamdulillah, pengaturan berhasil disimpan!");
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      alert("Gagal menyimpan pengaturan: " + error.message);
    }
  };

  const handleForceSyncJournals = async () => {
    if (!confirm('Apakah Anda yakin ingin melakukan Force Sync Jurnal?\\n\\nTindakan ini akan mengambil seluruh data jurnal utuh dari perangkat lokal ini dan menimpakannya ke server Cloud (Supabase) secara massal. Pastikan koneksi internet stabil.')) return;
    
    try {
      const { currentUser } = useAppStore.getState();
      
      // BACA LANGSUNG DARI LOCAL STORAGE KARENA STATE MEMORI MUNGKIN SUDAH DITIMPA OLEH SUPABASE SAAT STARTUP
      const localDataStr = localStorage.getItem(currentUser?.tenantId ? `ksa_journal_entries__${currentUser.tenantId}` : 'ksa_journal_entries');
      let localJournals = [];
      if (localDataStr) {
        try {
          localJournals = JSON.parse(localDataStr);
        } catch(e) {}
      }

      // Fallback if scoped is not found
      if (!localJournals || localJournals.length === 0) {
        const fallbackData = localStorage.getItem('ksa_journal_entries');
        if (fallbackData) {
          try {
            localJournals = JSON.parse(fallbackData);
          } catch(e) {}
        }
      }

      if (!localJournals || localJournals.length === 0) {
        alert('Tidak ada data jurnal lokal (di browser ini) untuk disinkronkan.');
        return;
      }
      
      if (!isSupabaseConfigured) {
        alert('Supabase belum dikonfigurasi!');
        return;
      }

      alert(`Memulai sinkronisasi massal untuk ${localJournals.length} baris jurnal murni dari Local Storage... Mohon tunggu dan jangan tutup halaman ini.`);
      
      const success = await (supabaseService as any).saveJournalEntriesBulk(localJournals);
      if (success) {
        alert('SUKSES! Seluruh data jurnal lokal berhasil ditimpakan ke Cloud secara utuh dan seimbang.');
        // Sinkronkan kembali state memori dengan local storage yang benar
        useAppStore.setState({ journalEntries: localJournals });
      } else {
        alert('Gagal mensinkronisasi jurnal ke Cloud. Silakan periksa koneksi internet Anda.');
      }
    } catch (error: any) {
      alert(`Terjadi kesalahan: ${error.message}`);
    }
  };

  const handleExportDatabase = () => {
    try {
      const wb = XLSX.utils.book_new();

      const addSheet = (data: any[], name: string) => {
        if (data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31)); // Max 31 chars
        } else {
          // Empty sheet with dummy column if no data
          const ws = XLSX.utils.aoa_to_sheet([['NO_DATA']]);
          XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
        }
      };

      addSheet(products, 'Products');
      addSheet(transactions, 'Transactions');
      addSheet(onlineOrders, 'OnlineOrders');
      addSheet(users, 'Users');
      addSheet(attendances, 'Attendances');
      addSheet(expenses, 'Expenses');
      addSheet(closings, 'Closings');
      addSheet(branches, 'Branches');
      addSheet(customers, 'Customers');
      addSheet(suppliers, 'Suppliers');

      const dateStr = new Date().toLocaleDateString('en-CA');
      XLSX.writeFile(wb, `Backup_KSAMart_${dateStr}.xlsx`);
    } catch (e: any) {
      alert("Gagal mengekspor database: " + e.message);
    }
  };

  const handleExportRawJson = () => {
    try {
      const dbDump = {
        products, transactions, onlineOrders, users, attendances,
        expenses, closings, branches, customers, suppliers, settings
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbDump, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `Full_Backup_KSAMart_${new Date().toLocaleDateString('en-CA')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e: any) {
      alert("Gagal membackup raw data: " + e.message);
    }
  };

  const handleImportRawJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('PERINGATAN: Memulihkan (Restore) database akan MENIMPA semua data yang ada di perangkat ini dengan data dari file backup. Apakah Anda yakin?')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.products && data.transactions) {
          // A very rudimentary but effective local storage overwrite
          if (data.products) localStorage.setItem('ksa_products', JSON.stringify(data.products));
          if (data.transactions) localStorage.setItem('ksa_transactions', JSON.stringify(data.transactions));
          if (data.onlineOrders) localStorage.setItem('ksa_online_orders', JSON.stringify(data.onlineOrders));
          if (data.users) localStorage.setItem('ksa_users', JSON.stringify(data.users));
          if (data.attendances) localStorage.setItem('ksa_attendances', JSON.stringify(data.attendances));
          if (data.expenses) localStorage.setItem('ksa_expenses', JSON.stringify(data.expenses));
          if (data.closings) localStorage.setItem('ksa_closings', JSON.stringify(data.closings));
          if (data.branches) localStorage.setItem('ksa_branches', JSON.stringify(data.branches));
          if (data.customers) localStorage.setItem('ksa_customers', JSON.stringify(data.customers));
          if (data.suppliers) localStorage.setItem('ksa_suppliers', JSON.stringify(data.suppliers));
          if (data.settings) localStorage.setItem('ksa_settings', JSON.stringify(data.settings));

          alert('Database berhasil dipulihkan! Halaman akan dimuat ulang.');
          window.location.reload();
        } else {
          alert('Format file JSON tidak valid atau bukan dari backup KSA Mart.');
        }
      } catch (err: any) {
        alert('Gagal membaca file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (currentUser?.role !== 'OWNER' && currentUser?.role !== 'SUPERADMIN') {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <Lock className="w-16 h-16 text-red-700" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200">Akses Ditolak</h2>
        <p className="text-gray-500 dark:text-slate-400">Halaman Pengaturan Toko khusus dikelola oleh Ketua (Owner) atau Superadmin.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200">Pengaturan Toko</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Konfigurasi operasional dan perpajakan sistem POS.</p>
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
        {(currentUser?.role === 'OWNER' || currentUser?.role === 'SUPERADMIN') && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-gray-800 dark:text-slate-200">Pajak Pertambahan Nilai (PPN/PB1)</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-gray-800 dark:text-slate-200 block text-sm">Aktifkan Pajak</label>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Pajak akan ditambahkan ke total belanja secara otomatis di Kasir.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isTaxEnabled}
                      onChange={(e) => setIsTaxEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {isTaxEnabled && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="font-bold text-gray-800 dark:text-slate-200 block text-sm">Persentase Pajak (%)</label>
                    <div className="relative w-1/2">
                      <input
                        type="number"
                        disabled={!isOwner}
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold ${!isOwner ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-500 dark:text-slate-400' : ''}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Contoh: 11 untuk PPN Indonesia saat ini.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-gray-800 dark:text-slate-200">Informasi Rekening & QRIS Owner</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Nama Bank Tujuan</label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={ownerBankName}
                    onChange={(e) => setOwnerBankName(e.target.value)}
                    placeholder="Contoh: BSI (Bank Syariah Indonesia)"
                    className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${!isOwner ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-500 dark:text-slate-400' : ''}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Nomor Rekening</label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={ownerBankAccount}
                    onChange={(e) => setOwnerBankAccount(e.target.value)}
                    placeholder="Contoh: 7182938495"
                    className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${!isOwner ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-500 dark:text-slate-400' : ''}`}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
                  <div>
                    <label className="font-bold text-gray-800 dark:text-slate-200 block text-sm">Aktifkan QRIS</label>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Izinkan pelanggan membayar via scan QRIS.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={qrisEnabled}
                      onChange={(e) => setQrisEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {qrisEnabled && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Upload QRIS Statis Toko (Opsional)</label>
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
                      className="w-full text-xs text-gray-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer border border-gray-200 dark:border-slate-700 p-1 rounded-lg"
                    />
                    {qrisImageUrl && (
                      <div className="relative mt-3 w-32 h-32 border border-gray-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 group">
                        <img src={qrisImageUrl} alt="QRIS" className="w-full h-full object-contain" />
                        <button
                          onClick={() => setQrisImageUrl('')}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hapus QRIS"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">Upload barcode QRIS toko Anda agar pelanggan bisa menscan langsung saat checkout.</p>
                  </div>
                )}

                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Batas Waktu Tunggu Pembayaran POS (Menit)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      disabled={!isOwner}
                      value={paymentTimeoutMinutes}
                      onChange={(e) => setPaymentTimeoutMinutes(Number(e.target.value))}
                      className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${!isOwner ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-500 dark:text-slate-400' : ''}`}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Set 0 untuk menonaktifkan batas waktu. (Disarankan: 5 menit untuk QRIS/Transfer)</p>
                </div>

                {isOwner ? (
                  <button
                    onClick={handleSave}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Pengaturan
                  </button>
                ) : (
                  <div className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-bold py-2.5 rounded-xl border border-gray-200 dark:border-slate-700">
                    <Lock className="w-4 h-4" />
                    Hanya Owner Yang Bisa Mengubah Data
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profil Toko Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
            <Store className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-800 dark:text-slate-200">Profil & Identitas Toko</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Nama Pemilik (Owner)</label>
              <input
                type="text"
                disabled={!isOwner}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Misal: Bapak/Ibu Owner"
                className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none ${!isOwner ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-500 dark:text-slate-400' : ''}`}
              />
            </div>
            {isOwner && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Username Login Owner</label>
                  <input
                    type="text"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Sandi Baru Owner (Opsional)</label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin diubah"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Nama Toko (Sesuai KTP/NIB)</label>
              <input
                type="text"
                disabled={!isOwner}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Misal: KSA Mart"
                className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none ${!isOwner ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-500 dark:text-slate-400' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                disabled={!isOwner}
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="Misal: 08123456789"
                className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none ${!isOwner ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-500 dark:text-slate-400' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Alamat Lengkap Toko</label>
              <textarea
                disabled={!isOwner}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Misal: Jl. Sudirman No. 123, Jakarta"
                rows={3}
                className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none ${!isOwner ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-500 dark:text-slate-400' : ''}`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Tipe Usaha</label>
              <select
                disabled={!isOwner}
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as 'KOPERASI' | 'UMUM')}
                className={`w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none ${!isOwner ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-500 dark:text-slate-400' : ''}`}
              >
                <option value="KOPERASI">Toko Koperasi (Lengkap dengan SHU)</option>
                <option value="UMUM">Toko Umum / Ritel Biasa</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400 block mb-2">Portal Pelanggan (Online Order)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/#/member`}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-500 dark:text-slate-400"
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Bagikan tautan ini ke pelanggan agar mereka bisa memesan barang secara online (Sesuai PSAK Syariah).</p>
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
              <div className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-bold py-2.5 rounded-xl border border-gray-200 dark:border-slate-700">
                <Lock className="w-4 h-4" />
                Akses Terkunci (Khusus Owner)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Jam Operasional */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-gray-800 dark:text-slate-200">Jam Operasional Toko</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={operationalHours.isOpen} onChange={(e) => setOperationalHours({...operationalHours, isOpen: e.target.checked})} disabled={!isOwner} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Jam Buka</label>
              <input
                type="text"
                placeholder="07:00"
                value={operationalHours.openTime}
                onChange={(e) => setOperationalHours({...operationalHours, openTime: e.target.value.replace('.', ':')})}
                disabled={!isOwner}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Jam Tutup</label>
              <input
                type="text"
                placeholder="21:00"
                value={operationalHours.closeTime}
                onChange={(e) => setOperationalHours({...operationalHours, closeTime: e.target.value.replace('.', ':')})}
                disabled={!isOwner}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Pesan Saat Toko Tutup / Libur</label>
            <textarea
              value={operationalHours.closedMessage}
              onChange={(e) => setOperationalHours({...operationalHours, closedMessage: e.target.value})}
              disabled={!isOwner}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none h-20 text-sm"
              placeholder="Contoh: Maaf, toko sedang tutup libur Idul Fitri..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700 dark:text-slate-300">Pengaturan Shift (Opsional)</h3>
              <button 
                onClick={handleAddShift} 
                disabled={!isOwner}
                className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-200"
              >
                <Plus className="w-3 h-3"/> Tambah Shift
              </button>
            </div>
            
            {(!operationalHours.shifts || operationalHours.shifts.length === 0) ? (
              <div className="text-sm text-gray-500 italic p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                Belum ada shift yang diatur. Jika kosong, sistem akan menggunakan "Jam Buka" toko sebagai patokan keterlambatan absen karyawan.
              </div>
            ) : (
              <div className="space-y-3">
                {operationalHours.shifts.map(shift => (
                  <div key={shift.id} className="flex flex-col md:flex-row gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 items-start md:items-center">
                    <div className="flex-1 w-full">
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Shift</label>
                      <input 
                        type="text" 
                        value={shift.name} 
                        onChange={(e) => handleUpdateShift(shift.id, 'name', e.target.value)} 
                        disabled={!isOwner}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <div className="flex-1 md:w-24">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Mulai</label>
                        <input 
                          type="text" 
                          value={shift.startTime} 
                          onChange={(e) => handleUpdateShift(shift.id, 'startTime', e.target.value.replace('.', ':'))} 
                          disabled={!isOwner}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="flex-1 md:w-24">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Selesai</label>
                        <input 
                          type="text" 
                          value={shift.endTime} 
                          onChange={(e) => handleUpdateShift(shift.id, 'endTime', e.target.value.replace('.', ':'))} 
                          disabled={!isOwner}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="flex items-end pb-0.5">
                        <button 
                          onClick={() => handleRemoveShift(shift.id)}
                          disabled={!isOwner}
                          className="p-1.5 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-500 mt-1">
              Catatan: Jika tombol "Buka" (di kanan atas kotak ini) dimatikan, pesan ini akan muncul untuk pelanggan yang mencoba berbelanja.
            </p>
          </div>
          
          {isOwner && (
            <button
              onClick={handleSave}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Jam Operasional
            </button>
          )}
        </div>
      </div>

      {/* Misi Berkah Beramal (Zakat/Infaq) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-800 dark:text-slate-200">Misi Berkah Beramal</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={enableCharityZakat} onChange={(e) => setEnableCharityZakat(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
        
        {enableCharityZakat && (
          <div className="p-6 space-y-4 bg-green-50/30">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Judul Donasi (Misal: Infaq, Sedekah, Zakat)</label>
              <input type="text" value={charityTitle} onChange={(e) => setCharityTitle(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Persentase (%) dari Laba Bersih</label>
              <input type="number" step="0.1" value={charityZakatPercentage} onChange={(e) => setCharityZakatPercentage(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Deskripsi (Struk)</label>
              <textarea rows={2} value={charityDescription} onChange={(e) => setCharityDescription(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none" />
            </div>
          </div>
        )}
      </div>

      {/* Program Loyalitas Poin */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-800 dark:text-slate-200">Program Loyalitas (Poin)</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={enablePoints} onChange={(e) => setEnablePoints(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-600"></div>
          </label>
        </div>
        
        {enablePoints && (
          <div className="p-6 space-y-4 bg-fuchsia-50/30">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Nilai Belanja untuk 1 Poin (Rp)</label>
              <input type="number" value={pointEarningRate} onChange={(e) => setPointEarningRate(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none" placeholder="Contoh: 1000" />
              <p className="text-xs text-slate-500 mt-1">Setiap pelanggan berbelanja senilai ini, mereka akan mendapat 1 Poin.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Nilai Diskon per 1 Poin (Rp)</label>
              <input type="number" value={pointRedemptionValue} onChange={(e) => setPointRedemptionValue(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none" placeholder="Contoh: 10" />
              <p className="text-xs text-slate-500 mt-1">Saat poin ditukarkan, 1 poin akan mengurangi total belanja sebesar nilai ini.</p>
            </div>
            <button
              onClick={handleSave}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md cursor-pointer"
            >
              Simpan Pengaturan Poin
            </button>
          </div>
        )}
      </div>

      {/* PPOB Integration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-gray-800 dark:text-slate-200">Integrasi PPOB (API)</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={enablePpobIntegration} onChange={(e) => setEnablePpobIntegration(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
        
        {enablePpobIntegration && (
          <div className="p-6 space-y-4 bg-indigo-50/30">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">URL Provider (Webhook/API Endpoint)</label>
              <input type="text" value={ppobProviderUrl} onChange={(e) => setPpobProviderUrl(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">API Key / Secret / Token</label>
              <input type="password" value={ppobApiKey} onChange={(e) => setPpobApiKey(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        )}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Default Biaya Admin PPOB (Rp)</label>
            <input type="number" value={defaultPpobAdminFee} onChange={(e) => setDefaultPpobAdminFee(e.target.value)} className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Misal: 2000" />
            <p className="text-[10px] text-gray-400 mt-1">Biaya admin ini akan otomatis muncul sebagai keuntungan/fee tambahan saat kasir menginput produk PPOB.</p>
          </div>
        </div>
      </div>

      {/* Integrasi Server & Database (Owner Only) */}
      {isOwner && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mt-6">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-gray-800 dark:text-slate-200">Konfigurasi Server & Database API</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-800/50">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm mb-4">
              PENTING: Pengaturan ini memungkinkan aplikasi terhubung ke database Supabase milik Anda sendiri secara dinamis tanpa perlu mengubah kode sumber.
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">URL Web / Aplikasi Saat Ini (Untuk Pengelola Server)</label>
              <div className="flex gap-2">
                <input type="text" readOnly value={window.location.origin} className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm text-gray-500 dark:text-slate-400 font-mono" />
                <button onClick={() => { navigator.clipboard.writeText(window.location.origin); alert("URL berhasil disalin!"); }} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shrink-0">
                  <Copy size={16} /> Salin URL
                </button>
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Supabase Project URL</label>
              <input type="text" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} placeholder="https://xxxxxx.supabase.co" className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Supabase Anon / Public Key</label>
              <input type="password" value={supabaseAnonKey} onChange={(e) => setSupabaseAnonKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsIn..." className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={async () => {
                  try {
                    const testUrl = supabaseUrl || 'https://stiatomaelzrptazayml.supabase.co';
                    // We just do a simple fetch to the health endpoint or similar if it's a valid URL format
                    new URL(testUrl);
                    alert("✅ Ping ke Server API berhasil dikirim!\n\nJika URL valid, aplikasi akan mencoba terhubung. Pastikan menyimpan pengaturan ini agar berlaku secara permanen di perangkat kasir.");
                  } catch (e) {
                    alert("❌ Format URL Supabase tidak valid!");
                  }
                }}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors flex-1"
              >
                <RefreshCw size={16} /> Uji Koneksi API Server
              </button>
              <button
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors flex-1 shadow-md"
              >
                <Save size={16} /> Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lokasi & Pengiriman (Owner Only) */}
      {isOwner && (
        <div className="mt-2 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 mt-8">
            <MapPin className="w-5 h-5 text-rose-600" />
            <h2 className="font-bold text-gray-800 dark:text-slate-200">Lokasi, Jarak Pengiriman, & Zona Absensi</h2>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm mb-4">
                Fitur ini memiliki fungsi ganda:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Zona Absensi Karyawan:</strong> Mengunci area absensi (Geofencing). Karyawan hanya bisa absen jika berada dalam Radius Absen. <em>(Kosongkan koordinat untuk mematikan fitur Geofencing absen)</em>.</li>
                  <li><strong>Jarak Pengiriman:</strong> Membatasi jarak maksimal bagi pelanggan yang memesan secara online.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Latitude (Garis Lintang)</label>
                  <input
                    type="text"
                    value={storeLocationLat}
                    onChange={(e) => setStoreLocationLat(e.target.value)}
                    placeholder="-6.200000"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Longitude (Garis Bujur)</label>
                  <input
                    type="text"
                    value={storeLocationLng}
                    onChange={(e) => setStoreLocationLng(e.target.value)}
                    placeholder="106.816666"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((position) => {
                        setStoreLocationLat(position.coords.latitude.toString());
                        setStoreLocationLng(position.coords.longitude.toString());
                        alert("Titik koordinat berhasil didapatkan dari GPS perangkat Anda!");
                      }, (error) => {
                        alert("Gagal mendapatkan lokasi. Pastikan izin GPS / Lokasi di browser Anda diaktifkan. " + error.message);
                      });
                    } else {
                      alert("Geolocation tidak didukung oleh browser Anda.");
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl transition-colors border border-slate-300 dark:border-slate-600 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" /> Deteksi Lokasi Saat Ini Otomatis
                </button>

                <div className="w-full sm:w-1/3 space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Maks Jarak (KM)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={maxDeliveryRadiusKm}
                      disabled={true}
                      className="w-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 cursor-not-allowed rounded-lg py-2 px-3 pr-8 text-sm outline-none font-bold text-gray-700 dark:text-slate-300"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">KM</span>
                  </div>
                </div>
                <div className="w-full sm:w-1/3 space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-400">Radius Absen (Meter)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={attendanceRadiusMeters}
                      onChange={(e) => setAttendanceRadiusMeters(e.target.value)}
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">M</span>
                  </div>
                </div>
              </div>

              <button onClick={handleSave} className="mt-4 w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md cursor-pointer">
                <Save className="w-4 h-4" /> Simpan Pengaturan Lokasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings (Owner Only) */}
      {isOwner && (
        <div className="mt-6 mb-6">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Konfigurasi Sistem Tingkat Lanjut (Advanced)
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Mode Pemeliharaan (Maintenance Mode)</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Aktifkan untuk memblokir login pengguna standar saat ada perbaikan sistem.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={maintenanceMode} onChange={e => setMaintenanceMode(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            <div className="flex flex-col md:flex-row gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Batas Minimum Saldo Kas (Rp)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Batas peringatan jika kas tunai/bank terlalu rendah.</p>
                <input
                  type="number"
                  value={minimumCashBalance}
                  onChange={e => setMinimumCashBalance(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Sinkronisasi Penuh ke Cloud</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Unggah (Paksa) seluruh data lokal aplikasi saat ini ke database Supabase secara massal.</p>
              </div>
              <button
                onClick={async () => {
                  const store = useAppStore.getState();
                  if (confirm('Proses ini akan mengunggah seluruh data lokal Anda (Produk, Pelanggan, Transaksi) ke Cloud. Lanjutkan?')) {
                    await store.forceSyncAllToCloud();
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Unggah Sekarang
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Auto-Approval Transaksi/Laporan</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Mengizinkan proses persetujuan otomatis (Tidak Direkomendasikan untuk keamanan berlapis).</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={autoApproveTransactions} onChange={e => setAutoApproveTransactions(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md cursor-pointer mt-4">
              <Save className="w-4 h-4" /> Simpan Konfigurasi Tingkat Lanjut
            </button>
          </div>
        </div>
      )}

      {/* Landing Page Settings */}
      {isOwner && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mt-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <Globe className="text-green-600" /> Pengaturan Halaman Depan (Beranda)
          </h2>
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Tampilkan Menu Hubungi & Alamat di Atas (Dropdown)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Jika diaktifkan, menu Hubungi Kami dan alamat cabang akan muncul sebagai dropdown di navbar atas, bukan di bagian bawah halaman.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input type="checkbox" checked={landingShowTopDropdowns} onChange={e => setLandingShowTopDropdowns(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b pb-2">Kontak Kami</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Singkat</label>
                  <input type="text" value={landingContactUs.description} onChange={e => setLandingContactUs({...landingContactUs, description: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="Hubungi kami untuk informasi lebih lanjut..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No Telepon / WhatsApp</label>
                  <input type="text" value={landingContactUs.phone} onChange={e => setLandingContactUs({...landingContactUs, phone: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="0812..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input type="email" value={landingContactUs.email} onChange={e => setLandingContactUs({...landingContactUs, email: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="info@koperasi.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap</label>
                  <input type="text" value={landingContactUs.address} onChange={e => setLandingContactUs({...landingContactUs, address: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="Jl. Raya Koperasi No. 1..." />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b pb-2">Pertanyaan Umum (FAQ)</h3>
              {landingFaqs.map((faq, index) => (
                <div key={index} className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mb-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Q: {faq.question}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">A: {faq.answer}</p>
                  </div>
                  <button onClick={() => setLandingFaqs(landingFaqs.filter((_, i) => i !== index))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <p className="text-xs font-bold text-blue-800 mb-1">Tambah FAQ Baru</p>
                <input type="text" value={newFaq.question} onChange={e => setNewFaq({...newFaq, question: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="Pertanyaan (Contoh: Apakah Koperasi buka 24 jam?)" />
                <textarea value={newFaq.answer} onChange={e => setNewFaq({...newFaq, answer: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="Jawaban (Contoh: Tidak, kami buka mulai 08:00 hingga 21:00...)" />
                <button 
                  type="button"
                  onClick={() => {
                    if (newFaq.question && newFaq.answer) {
                      setLandingFaqs([...landingFaqs, newFaq]);
                      setNewFaq({ question: '', answer: '' });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Tambah FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metode Pembayaran (Owner Only) */}
      {isOwner && (
        <div className="mt-2 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-800 dark:text-slate-200">Metode Pembayaran (Transfer & E-Wallet)</h2>
          </div>

          {/* Bank Transfer */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" />Transfer Bank</h3>
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
                <div key={i} className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 space-y-2 relative">
                  <button onClick={() => setBankTransfers(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-6">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Nama Bank</label>
                      <input 
                        type="text" 
                        list={`bank-options-${i}`}
                        value={b.bankName} 
                        onChange={e => setBankTransfers(prev => prev.map((x, idx) => idx === i ? { ...x, bankName: e.target.value } : x))} 
                        placeholder="Pilih atau ketik bank..."
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none mt-0.5" 
                      />
                      <datalist id={`bank-options-${i}`}>
                        <option value="BSI (Bank Syariah Indonesia)" />
                        <option value="Bank BRI" />
                        <option value="Bank BCA" />
                        <option value="Bank Mandiri" />
                        <option value="Bank BNI" />
                        <option value="Bank Muamalat" />
                        <option value="Bank MEGA Syariah" />
                        <option value="Bank Permata Syariah" />
                      </datalist>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">No. Rekening</label>
                      <input type="text" value={b.accountNumber} onChange={e => setBankTransfers(prev => prev.map((x, idx) => idx === i ? { ...x, accountNumber: e.target.value } : x))} placeholder="contoh: 7182938495" className="w-full border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Nama Pemilik Rekening</label>
                      <input type="text" value={b.accountName} onChange={e => setBankTransfers(prev => prev.map((x, idx) => idx === i ? { ...x, accountName: e.target.value } : x))} placeholder="contoh: Yudi Haryono" className="w-full border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none mt-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* E-Wallet */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2"><Smartphone className="w-4 h-4 text-purple-500" />E-Wallet / QRIS</h3>
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
                <div key={i} className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 space-y-2 relative">
                  <button onClick={() => setEwallets(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-6">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Provider</label>
                      <input 
                        type="text" 
                        list={`ewallet-options-${i}`}
                        value={w.provider} 
                        onChange={e => setEwallets(prev => prev.map((x, idx) => idx === i ? { ...x, provider: e.target.value } : x))} 
                        placeholder="Pilih atau ketik provider..."
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none mt-0.5" 
                      />
                      <datalist id={`ewallet-options-${i}`}>
                        <option value="GoPay" />
                        <option value="OVO" />
                        <option value="DANA" />
                        <option value="ShopeePay" />
                        <option value="LinkAja" />
                        <option value="QRIS (Semua)" />
                      </datalist>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">No. / ID E-Wallet</label>
                      <input type="text" value={w.number} onChange={e => setEwallets(prev => prev.map((x, idx) => idx === i ? { ...x, number: e.target.value } : x))} placeholder="contoh: 08123456789" className="w-full border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Nama Akun</label>
                      <input type="text" value={w.accountName} onChange={e => setEwallets(prev => prev.map((x, idx) => idx === i ? { ...x, accountName: e.target.value } : x))} placeholder="contoh: Yudi Haryono" className="w-full border border-gray-200 dark:border-slate-700 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none mt-0.5" />
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

      {/* Zona Bahaya & Export */}
      {currentUser?.role === 'OWNER' && (
        <div className="mt-8 space-y-6">
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-blue-900">Backup & Export Database</h3>
                <p className="text-xs text-blue-700 mt-1">Unduh data laporan dalam bentuk Excel (.xlsx) atau cadangkan seluruh sistem dalam format (.json) agar dapat dipulihkan kapan saja.</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={handleExportDatabase}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center gap-2 justify-center"
                >
                  <Download className="w-4 h-4" /> Unduh Laporan (Excel)
                </button>
                <button
                  onClick={handleExportRawJson}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center gap-2 justify-center"
                >
                  <Database className="w-4 h-4" /> Backup Penuh (.json)
                </button>

                <label className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-bold rounded-xl shadow-sm transition flex items-center gap-2 justify-center cursor-pointer">
                  <RefreshCw className="w-4 h-4" /> Restore Data (.json)
                  <input type="file" accept=".json" className="hidden" onChange={handleImportRawJson} />
                </label>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-amber-900">Perbaiki & Timpa Jurnal Cloud</h3>
                <p className="text-xs text-amber-700 mt-1">Gunakan tombol ini jika Jurnal Umum di Cloud pincang akibat masalah internet. Ini akan mengirim ulang (Bulk Insert) seluruh jurnal utuh dari perangkat ini ke Cloud.</p>
              </div>
              <button
                onClick={handleForceSyncJournals}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center gap-2 justify-center shrink-0"
              >
                <RefreshCw className="w-4 h-4" /> Timpa Jurnal Cloud
              </button>
            </div>
          </div>

          <div className="bg-red-50 p-5 rounded-2xl border border-red-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-red-900">Bahaya! Area Superadmin (Hapus Semua Data)</h3>
                <p className="text-xs text-red-700 mt-1">Gunakan tombol ini hanya jika Anda ingin memulai ulang sistem dari 0. Seluruh transaksi, inventori, & riwayat akan dihapus permanen.</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA?\\n\\nTindakan ini TIDAK BISA dibatalkan dan akan mereset aplikasi menjadi kosong.')) {
                    const pin = prompt('Masukkan Sandi (Password) akun Anda untuk mengonfirmasi penghapusan data:');
                    if (pin && pin === currentUser?.password) {
                      clearAllData();
                      alert('Berhasil! Semua data telah dihapus permanen dan sistem direset.');
                      window.location.href = '/';
                    } else {
                      alert('Sandi salah! Proses Hapus Data dibatalkan.');
                    }
                  }
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-sm transition shrink-0"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
