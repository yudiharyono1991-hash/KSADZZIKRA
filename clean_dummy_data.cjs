const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDummyData() {
  console.log("Menghapus data dummy PPOB dan SKU- otomatis...");

  // Get all products
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, sku, name');

  if (fetchError) {
    console.error("Gagal mengambil produk:", fetchError.message);
    return;
  }

  const dummyProducts = products.filter(p => {
    return p.sku && (p.sku.startsWith('PPOB-') || p.sku.startsWith('SKU-'));
  });

  console.log(`Ditemukan ${dummyProducts.length} data dummy.`);

  if (dummyProducts.length === 0) {
    console.log("Tidak ada data dummy yang perlu dihapus.");
    return;
  }

  for (const product of dummyProducts) {
    console.log(`Menghapus: ${product.sku} - ${product.name}`);
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);
    
    if (deleteError) {
      console.error(`Gagal menghapus ${product.sku}:`, deleteError.message);
    } else {
      console.log(`Berhasil menghapus ${product.sku}`);
    }
  }

  console.log("Pembersihan selesai.");
}

cleanDummyData();
