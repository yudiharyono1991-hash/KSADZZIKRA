const fs = require('fs');

const path = 'src/pages/CustomerPortal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  /import \{ (.*?) \} from 'lucide-react';/,
  `import { $1, MapPin, AlertTriangle } from 'lucide-react';\nimport { calculateDistanceKm } from '../utils/distance';`
);

// 2. Add state for location distance
content = content.replace(
  /const \[checkoutNotes, setCheckoutNotes\] = useState\(''\);/,
  `const [checkoutNotes, setCheckoutNotes] = useState('');\n    const [customerDistanceKm, setCustomerDistanceKm] = useState<number | null>(null);\n    const [isCheckingLocation, setIsCheckingLocation] = useState(false);`
);

// 3. Add handleCheckLocation function
const locationFunc = `
    const handleCheckLocation = () => {
      if (!settings.storeLocationLat || !settings.storeLocationLng) {
        alert("Mohon maaf, lokasi toko belum diatur oleh admin. Silakan hubungi admin KSA Mart.");
        return;
      }
      
      setIsCheckingLocation(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          setIsCheckingLocation(false);
          const dist = calculateDistanceKm(
            settings.storeLocationLat!, 
            settings.storeLocationLng!, 
            position.coords.latitude, 
            position.coords.longitude
          );
          setCustomerDistanceKm(dist);
        }, (error) => {
          setIsCheckingLocation(false);
          alert("Gagal mendapatkan lokasi Anda. Pastikan izin akses lokasi/GPS diaktifkan. " + error.message);
        });
      } else {
        setIsCheckingLocation(false);
        alert("Geolocation tidak didukung oleh browser Anda.");
      }
    };
`;
content = content.replace(
  /const handleCheckout = \(\) => \{/,
  locationFunc + '\n    const handleCheckout = () => {'
);

// 4. Update checkout UI to include location check
const checkoutUI = `
                    <div className="pt-4 border-t border-slate-100 mb-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-500" /> Cek Jarak Pengiriman
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">Sesuai kebijakan KSA Mart, maksimal jarak pengiriman adalah {settings.maxDeliveryRadiusKm || 5} KM dari lokasi toko. Anda wajib mengecek lokasi sebelum checkout.</p>
                        
                        {customerDistanceKm === null ? (
                          <button 
                            onClick={handleCheckLocation}
                            disabled={isCheckingLocation}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400"
                          >
                            <MapPin className="w-4 h-4"/> {isCheckingLocation ? 'Mendeteksi...' : 'Cek Lokasi Saya Sekarang'}
                          </button>
                        ) : customerDistanceKm <= (settings.maxDeliveryRadiusKm || 5) ? (
                          <div className="bg-green-100 text-green-800 p-3 rounded-lg text-sm font-bold flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Jarak Anda: {customerDistanceKm.toFixed(2)} KM (Memenuhi Syarat)
                          </div>
                        ) : (
                          <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm font-bold flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>Jarak Anda: {customerDistanceKm.toFixed(2)} KM.<br/>Mohon maaf, lokasi Anda melebihi batas maksimal pengiriman ({settings.maxDeliveryRadiusKm || 5} KM).</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-bold text-slate-600">Total Pembayaran</span>
                        <span className="text-2xl font-black text-green-700">Rp {cartTotal.toLocaleString('id-ID')}</span>
                      </div>
                      <button 
                        onClick={handleCheckout}
                        disabled={customerDistanceKm === null || customerDistanceKm > (settings.maxDeliveryRadiusKm || 5)}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl shadow-lg shadow-green-900/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-6 h-6"/> Buat Pesanan Sekarang
                      </button>
                    </div>
`;

content = content.replace(
  /<div className="flex items-center justify-between mb-4">[\s\S]*?<CheckCircle className="w-6 h-6"\/> Buat Pesanan Sekarang\n                    <\/button>\n                  <\/div>/,
  checkoutUI + '\n                  </div>'
);

// 5. Update Info / Panduan Tab
const panduanInfo = `
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-rose-50 flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-rose-600" />
                  <div>
                    <h3 className="font-bold text-rose-900">Kebijakan Jarak Pengiriman</h3>
                    <p className="text-sm text-rose-700">Penting untuk diketahui sebelum memesan</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                    Untuk menjaga kualitas layanan dan kecepatan pengantaran, KSA Mart membatasi <strong>jarak maksimal pengiriman sejauh {settings.maxDeliveryRadiusKm || 5} KM</strong> dari lokasi toko kami.
                  </p>
                  <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
                    <li>Sistem akan mendeteksi lokasi GPS Anda secara otomatis saat Checkout.</li>
                    <li>Pastikan Anda memberikan izin akses Lokasi (Location / GPS) pada browser Anda.</li>
                    <li>Jika jarak Anda lebih dari {settings.maxDeliveryRadiusKm || 5} KM, sistem tidak akan memproses pesanan Anda.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
`;
content = content.replace(
  /<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">\s*<div className="p-4 border-b border-slate-100 bg-blue-50 flex items-center gap-3">/,
  panduanInfo + '                <div className="p-4 border-b border-slate-100 bg-blue-50 flex items-center gap-3">'
);


fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated CustomerPortal.tsx');
