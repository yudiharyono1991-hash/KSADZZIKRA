require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDates() {
  const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
  if (error) return console.error(error);
  
  console.log("=== EXPENSES ===");
  data.forEach(d => {
    console.log(`${d.date} | ${d.description} | ${d.amount}`);
  });
}

checkDates();
