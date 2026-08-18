require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncExpensesToJournals() {
  console.log("Mencari data kas kecil (expenses) yang belum ada di Buku Besar...");
  
  // 1. Ambil semua expenses
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select('*')
    .eq('category', 'OPERASIONAL');
    
  if (expErr) {
    console.error("Error fetching expenses:", expErr);
    return;
  }
  
  // 2. Ambil semua journal_entries
  const { data: journals, error: jErr } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('reference_type', 'AUTO_TRANSAKSI');
    
  if (jErr) {
    console.error("Error fetching journals:", jErr);
    return;
  }
  
  let addedCount = 0;
  
  // 3. Bandingkan dan Insert yang kurang
  for (const exp of expenses) {
    const isIncome = Number(exp.amount) < 0;
    const absAmount = Math.abs(Number(exp.amount));
    
    // Cek apakah sudah ada jurnal untuk expense ini
    const existing = journals.find(j => j.reference_id === exp.id);
    if (!existing) {
      console.log(`Mensinkronisasi transaksi: ${exp.description} (Rp ${absAmount})`);
      
      const kasAccount = exp.coa_id || '1102'; // default kas kecil account
      const bebanAccount = isIncome ? '5-2020' : (exp.coa_id || '5-2020');
      
      const dateStr = exp.date || exp.created_at;
      
      const journalsToInsert = [
        {
          id: `je_${Date.now()}_exp1_${Math.random().toString(36).substring(2,8)}`,
          tenant_id: exp.tenant_id,
          date: dateStr,
          account: kasAccount,
          debit: isIncome ? absAmount : 0,
          credit: isIncome ? 0 : absAmount,
          description: exp.description,
          reference_id: exp.id,
          reference_type: 'AUTO_TRANSAKSI',
          created_by: exp.created_by,
          branch_id: exp.branch_id
        },
        {
          id: `je_${Date.now()}_exp2_${Math.random().toString(36).substring(2,8)}`,
          tenant_id: exp.tenant_id,
          date: dateStr,
          account: bebanAccount,
          debit: isIncome ? 0 : absAmount,
          credit: isIncome ? absAmount : 0,
          description: exp.description,
          reference_id: exp.id,
          reference_type: 'AUTO_TRANSAKSI',
          created_by: exp.created_by,
          branch_id: exp.branch_id
        }
      ];
      
      const { error: insertErr } = await supabase.from('journal_entries').insert(journalsToInsert);
      if (insertErr) {
        console.error("Gagal sinkronisasi:", exp.description, insertErr);
      } else {
        addedCount++;
      }
    }
  }
  
  console.log(`\nSelesai! Berhasil mensinkronkan ${addedCount} transaksi pengeluaran lama ke Buku Besar.`);
}

syncExpensesToJournals();
