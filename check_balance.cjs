require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkBalance() {
  const { data, error } = await supabase.from('journal_entries').select('*');
  if (error) return console.error(error);
  
  let total = 0;
  for (const j of data) {
    if (!j.account) continue;
    const act = j.account.includes('-') ? j.account.split(' - ')[0].trim() : j.account.trim();
    if (act === '1102' || act === '1-1000') {
      total += (Number(j.debit) || 0) - (Number(j.credit) || 0);
    }
  }
  console.log("Total Kasir / Kas Tunai dari semua journal_entries:", total);
}

checkBalance();
