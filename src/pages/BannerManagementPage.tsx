import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, CheckCircle, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useAppStore } from '../store';
import { Banner } from '../types';
import { uploadImageToStorage } from '../lib/supabase';

const BannerManagementPage: React.FC = () => {
  const isDarkMode = useAppStore(state => state.isDarkMode);
  const banners = useAppStore(state => state.banners);
  const addBanner = useAppStore(state => state.addBanner);
  const updateBanner = useAppStore(state => state.updateBanner);
  const deleteBanner = useAppStore(state => state.deleteBanner);
  const currentUser = useAppStore(state => state.currentUser);

  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Partial<Banner> | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Sort banners by sortOrder locally for display
  }, [banners]);

  const sortedBanners = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAddNew = () => {
    setCurrentBanner({
      title: '',
      imageUrl: '',
      isActive: true,
      sortOrder: banners.length + 1,
      tenantId: currentUser?.tenantId || 'tenant_default'
    });
    setPreviewUrl('');
    setSelectedFile(null);
    setIsEditing(true);
  };

  const handleEdit = (banner: Banner) => {
    setCurrentBanner(banner);
    setPreviewUrl(banner.imageUrl);
    setSelectedFile(null);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus banner ini?')) {
      deleteBanner(id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    if (!currentBanner?.title) {
      alert('Judul banner harus diisi!');
      return;
    }

    setIsUploading(true);
    let finalImageUrl = currentBanner.imageUrl || '';

    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;
      const path = `banners/${fileName}`;
      
      const uploadedUrl = await uploadImageToStorage(selectedFile, 'store-assets', path);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else {
        alert('Gagal mengupload gambar. Menggunakan gambar sebelumnya jika ada.');
      }
    }

    if (!finalImageUrl) {
      alert('Gambar harus dipilih!');
      setIsUploading(false);
      return;
    }

    const bannerToSave: Banner = {
      id: currentBanner.id || crypto.randomUUID(),
      title: currentBanner.title!,
      imageUrl: finalImageUrl,
      isActive: currentBanner.isActive ?? true,
      sortOrder: currentBanner.sortOrder || 0,
      targetUrl: currentBanner.targetUrl,
      tenantId: currentBanner.tenantId || currentUser?.tenantId || 'tenant_default',
      createdAt: currentBanner.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (currentBanner.id) {
      updateBanner(bannerToSave);
    } else {
      addBanner(bannerToSave);
    }

    setIsEditing(false);
    setCurrentBanner(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setIsUploading(false);
  };

  const moveUp = (banner: Banner, index: number) => {
    if (index === 0) return;
    const prevBanner = sortedBanners[index - 1];
    updateBanner({ ...banner, sortOrder: prevBanner.sortOrder });
    updateBanner({ ...prevBanner, sortOrder: banner.sortOrder });
  };

  const moveDown = (banner: Banner, index: number) => {
    if (index === sortedBanners.length - 1) return;
    const nextBanner = sortedBanners[index + 1];
    updateBanner({ ...banner, sortOrder: nextBanner.sortOrder });
    updateBanner({ ...nextBanner, sortOrder: banner.sortOrder });
  };

  return (
    <div className={`p-4 sm:p-6 min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ImageIcon className={`shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            Manajemen Banner & Promo
          </h1>
          {!isEditing && (
            <button
              onClick={handleAddNew}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Plus size={20} /> Tambah Banner
            </button>
          )}
        </div>

        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl shadow-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <h2 className="text-xl font-bold mb-4">{currentBanner?.id ? 'Edit Banner' : 'Tambah Banner Baru'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Judul Banner / Promo</label>
                  <input
                    type="text"
                    value={currentBanner?.title || ''}
                    onChange={(e) => setCurrentBanner({ ...currentBanner, title: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="Contoh: Promo Kemerdekaan RI Ke-81"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tautan Target (Opsional)</label>
                  <input
                    type="text"
                    value={currentBanner?.targetUrl || ''}
                    onChange={(e) => setCurrentBanner({ ...currentBanner, targetUrl: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="Contoh: /katalog (jika diklik)"
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentBanner?.isActive || false}
                      onChange={(e) => setCurrentBanner({ ...currentBanner, isActive: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="font-medium">Banner Aktif (Ditampilkan)</span>
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-colors ${
                      isUploading ? 'bg-gray-500 cursor-not-allowed' : (isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-600 hover:bg-green-700')
                    }`}
                  >
                    {isUploading ? (
                      <span className="animate-pulse">Mengunggah...</span>
                    ) : (
                      <>
                        <Save size={20} /> Simpan
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setSelectedFile(null); }}
                    disabled={isUploading}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-colors border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <X size={20} /> Batal
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Gambar Banner</label>
                <div className={`mt-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden ${
                  isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'
                }`}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-[300px] object-contain" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon size={48} className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className="text-sm opacity-70">Klik untuk memilih gambar</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-xs mt-2 opacity-70">Rekomendasi ukuran: 1200 x 400 piksel (Landscape) atau rasio yang proporsional.</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBanners.length > 0 ? (
              sortedBanners.map((banner, index) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-xl shadow-md overflow-hidden border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="h-48 sm:h-56 relative bg-gray-200 dark:bg-gray-800 flex items-center justify-center p-2">
                    <img 
                      src={banner.imageUrl} 
                      alt={banner.title} 
                      className="max-w-full max-h-full object-contain rounded drop-shadow-md"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Gambar+Tidak+Ditemukan' }}
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {banner.isActive ? (
                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                          <CheckCircle size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                          <XCircle size={12} /> Nonaktif
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate" title={banner.title}>{banner.title}</h3>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveUp(banner, index)}
                          disabled={index === 0}
                          className={`p-2 rounded transition-colors ${
                            index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                          title="Geser ke atas"
                        >
                          <ArrowUp size={18} />
                        </button>
                        <button
                          onClick={() => moveDown(banner, index)}
                          disabled={index === sortedBanners.length - 1}
                          className={`p-2 rounded transition-colors ${
                            index === sortedBanners.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                          title="Geser ke bawah"
                        >
                          <ArrowDown size={18} />
                        </button>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className={`p-2 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-800/50 transition-colors`}
                          title="Edit Banner"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className={`p-2 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50 transition-colors`}
                          title="Hapus Banner"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center opacity-70">
                <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">Belum ada banner promo yang ditambahkan.</p>
                <p className="text-sm mt-1">Klik "Tambah Banner" untuk mulai menambahkan.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerManagementPage;
