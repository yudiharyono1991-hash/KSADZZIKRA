require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function undoSync() {
  console.log("Membatalkan duplikasi jurnal...");
  
  // Script was run around Date.now() ~ 172...
  // The IDs created were je_<timestamp>_exp1_...
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, description')
    .like('id', 'je_%_exp%');
    
  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  
  console.log(`Menemukan ${data.length} baris jurnal duplikat yang dibuat oleh script.`);
  
  if (data.length > 0) {
    const idsToDelete = data.map(d => d.id);
    
    // Batch delete
    const { error: delErr } = await supabase
      .from('journal_entries')
      .delete()
      .in('id', idsToDelete);
      
    if (delErr) {
      console.error("Error deleting:", delErr);
    } else {
      console.log("Berhasil menghapus duplikasi!");
    }
  }
}

undoSync();
