import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Store, Plus, Search, Edit2, Trash2, QrCode, CheckCircle, Info, Upload, Loader } from 'lucide-react';
import { uploadImageToStorage } from '../lib/supabase';

export default function BranchManagementPage() {
  const { branches, addBranch, updateBranch, deleteBranch, currentUser, settings } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'info' | 'qris' | 'payment'>('info');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    whatsapp: '',
    isActive: true,
    qrisImageUrl: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const qrisFileRef = useRef<HTMLInputElement>(null);

  const isGlobalAdmin = ['OWNER', 'SUPERADMIN', 'PENGURUS'].includes(currentUser?.role || '');

  const filteredBranches = branches.filter(b => {
    if (!isGlobalAdmin && currentUser?.branchId && b.id !== currentUser.branchId) return false;
    return b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           b.address.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleOpenModal = (branch: any = null) => {
    setActiveSection('info');
    setUploadError(null);
    if (branch) {
      setEditingId(branch.id);
      setFormData({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        whatsapp: branch.whatsapp || '',
        isActive: branch.isActive,
        qrisImageUrl: branch.qrisImageUrl || '',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', address: '', phone: '', whatsapp: '', isActive: true, qrisImageUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, dll).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 2MB.');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const branchSlug = (formData.name || 'cabang').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `qris/qris_${branchSlug}_${Date.now()}.${ext}`;
      const url = await uploadImageToStorage(file, 'store-assets', path);
      if (url) {
        setFormData(prev => ({ ...prev, qrisImageUrl: url }));
      } else {
        setUploadError('Upload gagal. Pastikan Supabase Storage sudah dikonfigurasi dan bucket "store-assets" sudah ada.');
      }
    } catch (err: any) {
      setUploadError('Upload gagal: ' + (err?.message || 'Coba lagi.'));
    } finally {
      setIsUploading(false);
      if (qrisFileRef.current) qrisFileRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateBranch(editingId, formData);
    } else {
      addBranch(formData);
    }
    setIsModalOpen(false);
  };

  const sectionTabs = [
    { id: 'info', label: 'Info Cabang', icon: Store },
    { id: 'qris', label: 'QRIS Cabang', icon: QrCode },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
            <Store className="w-6 h-6 text-green-600" />
            Manajemen Cabang Toko
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Kelola data cabang KSA Mart, QRIS per-cabang, dan metode pembayaran</p>
        </div>
        {isGlobalAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Cabang
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-bold mb-1">Tata Kelola QRIS Multi-Cabang</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-700">
            <li>Setiap cabang memiliki <strong>QRIS sendiri</strong>. Ketika pelanggan memilih cabang saat checkout, QRIS cabang yang bersangkutan otomatis tampil.</li>
            <li>Jika QRIS cabang belum diisi, sistem akan menampilkan <strong>QRIS Toko Pusat</strong> sebagai cadangan.</li>
            <li>Hanya <strong>Ketua/Owner/Pengurus</strong> yang dapat menambah, mengubah, dan menghapus cabang beserta QRIS-nya.</li>
          </ul>
        </div>
      </div>

      {/* Branch Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau alamat cabang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-4">Nama Cabang</th>
                <th className="px-4 py-4">Alamat</th>
                <th className="px-4 py-4">No. Telepon</th>
                <th className="px-4 py-4 text-center">QRIS</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBranches.map(branch => (
                <tr key={branch.id} className="hover:bg-gray-50 dark:bg-slate-800/50">
                  <td className="px-4 py-4 font-semibold text-gray-800 dark:text-slate-200">{branch.name}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-slate-400 text-xs max-w-[200px] truncate">{branch.address}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-slate-400 text-xs">
                    {branch.phone}
                    {branch.whatsapp && <><br/><span className="text-slate-400">WA: {branch.whatsapp}</span></>}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {branch.qrisImageUrl ? (
                      <div className="flex flex-col items-center gap-1">
                        <img src={branch.qrisImageUrl} alt="QRIS" className="w-10 h-10 object-contain border rounded" />
                        <span className="text-[10px] text-green-600 font-bold">✓ Ada</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <QrCode className="w-5 h-5 text-slate-300 mx-auto" />
                        <span className="text-[10px] text-slate-400">Pakai Global</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      branch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {branch.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(branch)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Cabang"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isGlobalAdmin && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Yakin ingin menghapus cabang "${branch.name}"?`)) {
                            deleteBranch(branch.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Cabang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredBranches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    <Store className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Tidak ada data cabang.</p>
                    {isGlobalAdmin && <p className="text-xs mt-1">Klik "Tambah Cabang" untuk mendaftarkan cabang pertama.</p>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Store className="w-5 h-5" />
                {editingId ? 'Edit Data Cabang' : 'Tambah Cabang Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white text-xl font-bold">×</button>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b border-gray-100 dark:border-slate-800">
              {sectionTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                      activeSection === tab.id
                        ? 'border-b-2 border-green-600 text-green-700 bg-green-50/50'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Section: Info Cabang */}
                {activeSection === 'info' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Nama Cabang <span className="text-red-700">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="Mis. KSA Mart Cabang Bogor"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Alamat Lengkap <span className="text-red-700">*</span></label>
                      <textarea
                        required
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="Jl. Raya Bogor No. 123, Kel. ..., Kec. ..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Nomor Telepon <span className="text-red-700">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="0812345678"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">No. WhatsApp</label>
                        <input
                          type="text"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="628123456789"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <input
                        type="checkbox"
                        id="isActiveCbx"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded border-gray-300 dark:border-slate-600 focus:ring-green-500"
                      />
                      <label htmlFor="isActiveCbx" className="text-sm text-gray-700 dark:text-slate-300 font-medium">Cabang ini sedang <strong>Aktif</strong> beroperasi</label>
                    </div>
                  </>
                )}

                {/* Section: QRIS Cabang */}
                {activeSection === 'qris' && (
                      <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                      <p className="font-bold mb-1">ℹ️ Cara Kerja QRIS Per-Cabang</p>
                      <p>Upload atau isi URL gambar QRIS khusus untuk cabang ini. Saat pelanggan memilih cabang ini saat checkout, QRIS ini yang tampil otomatis. Jika dikosongkan, QRIS Toko Pusat digunakan sebagai cadangan.</p>
                    </div>

                    {/* Upload Button */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Upload Gambar QRIS Langsung</label>
                      <input
                        ref={qrisFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleQrisUpload}
                        className="hidden"
                        id="qris-upload-input"
                      />
                      <label
                        htmlFor="qris-upload-input"
                        className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors font-semibold text-sm ${
                          isUploading
                            ? 'border-blue-300 bg-blue-50 text-blue-500 cursor-not-allowed'
                            : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-500'
                        }`}
                      >
                        {isUploading ? (
                          <><Loader className="w-4 h-4 animate-spin" /> Mengupload...</>
                        ) : (
                          <><Upload className="w-4 h-4" /> Pilih & Upload Gambar QRIS</>  
                        )}
                      </label>
                      <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG. Maks. 2MB. Otomatis tersimpan ke Supabase Storage.</p>
                      {uploadError && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2 font-medium">{uploadError}</p>
                      )}
                    </div>

                    {/* OR divider */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-400 font-medium">atau isi URL manual</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">URL Gambar QRIS Cabang</label>
                      <input
                        type="url"
                        value={formData.qrisImageUrl}
                        onChange={(e) => setFormData({ ...formData, qrisImageUrl: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="https://... (URL gambar QRIS dari Supabase Storage)"
                      />
                    </div>

                    {/* Preview QRIS */}
                    <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center">
                      {formData.qrisImageUrl ? (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-green-700">✓ Preview QRIS Cabang {formData.name || 'Ini'}</p>
                          <img src={formData.qrisImageUrl} alt="Preview QRIS" className="w-40 h-40 object-contain mx-auto rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, qrisImageUrl: '' }))}
                            className="text-xs text-red-700 hover:text-red-700 font-medium"
                          >
                            Hapus QRIS ini
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <QrCode className="w-12 h-12 text-gray-300 mx-auto" />
                          <p className="text-xs text-gray-400">Belum ada QRIS khusus. Akan menggunakan QRIS Toko Pusat.</p>
                          {settings.qrisImageUrl && (
                            <div>
                              <p className="text-[10px] text-slate-400 mb-1">Preview QRIS Toko Pusat (fallback):</p>
                              <img src={settings.qrisImageUrl} alt="QRIS Toko Pusat" className="w-24 h-24 object-contain mx-auto border rounded opacity-50" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                <div className="flex gap-2 text-xs text-gray-400">
                  {activeSection !== 'info' && (
                    <button type="button" onClick={() => setActiveSection('info')} className="text-blue-600 hover:underline font-medium">← Kembali</button>
                  )}
                  {activeSection === 'info' && (
                    <button type="button" onClick={() => setActiveSection('qris')} className="text-blue-600 hover:underline font-medium">Atur QRIS →</button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-green-600 text-white font-bold hover:bg-green-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Simpan Cabang
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
