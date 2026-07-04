const fs = require('fs');

const path = 'src/pages/SettingsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add MapPin to imports
content = content.replace(
  /import \{ Settings, Percent, Save, CheckCircle, Lock, Building2, Wallet, Store, Copy, Database, Plus, Trash2, CreditCard, Smartphone, Download \} from 'lucide-react';/,
  `import { Settings, Percent, Save, CheckCircle, Lock, Building2, Wallet, Store, Copy, Database, Plus, Trash2, CreditCard, Smartphone, Download, MapPin } from 'lucide-react';`
);

// 2. Add state variables for Location
content = content.replace(
  /const \[storeAddress, setStoreAddress\] = useState\(settings\.storeAddress \|\| ''\);/,
  `const [storeAddress, setStoreAddress] = useState(settings.storeAddress || '');\n  const [storeLocationLat, setStoreLocationLat] = useState(settings.storeLocationLat?.toString() || '');\n  const [storeLocationLng, setStoreLocationLng] = useState(settings.storeLocationLng?.toString() || '');\n  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState(settings.maxDeliveryRadiusKm?.toString() || '5');`
);

// 3. Update handleSave payload
content = content.replace(
  /paymentMethods: \{[\s\S]*?\},/,
  `paymentMethods: {
          bankTransfer: bankTransfers,
          ewallet: ewallets,
        },
        storeLocationLat: storeLocationLat ? Number(storeLocationLat) : undefined,
        storeLocationLng: storeLocationLng ? Number(storeLocationLng) : undefined,
        maxDeliveryRadiusKm: Number(maxDeliveryRadiusKm) || 5,`
);

// 4. Add UI for Lokasi & Pengiriman
const locationUI = `
        {/* Lokasi & Pengiriman (Owner Only) */}
        {isOwner && (
          <div className="mt-2 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 mt-8">
              <MapPin className="w-5 h-5 text-rose-600" />
              <h2 className="font-bold text-gray-800">Lokasi & Jarak Pengiriman Maksimal</h2>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm mb-4">
                  Fitur ini digunakan untuk mengunci batas maksimal jarak pelanggan yang bisa melakukan pemesanan (Checkout). Sistem akan menghitung jarak otomatis menggunakan GPS.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Latitude (Garis Lintang)</label>
                    <input 
                      type="text" 
                      value={storeLocationLat}
                      onChange={(e) => setStoreLocationLat(e.target.value)}
                      placeholder="-6.200000"
                      className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Longitude (Garis Bujur)</label>
                    <input 
                      type="text" 
                      value={storeLocationLng}
                      onChange={(e) => setStoreLocationLng(e.target.value)}
                      placeholder="106.816666"
                      className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors border border-slate-300 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" /> Deteksi Lokasi Saat Ini Otomatis
                  </button>
                  
                  <div className="w-full sm:w-1/3 space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Maks Jarak (KM)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={maxDeliveryRadiusKm}
                        disabled={true}
                        className="w-full border border-gray-200 bg-gray-50 cursor-not-allowed rounded-lg py-2 px-3 pr-8 text-sm outline-none font-bold text-gray-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">KM</span>
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
`;

content = content.replace(
  /\{\/\* Metode Pembayaran \(Owner Only\) \*\/\}/,
  locationUI + '\n        {/* Metode Pembayaran (Owner Only) */}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated SettingsPage.tsx');
