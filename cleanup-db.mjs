import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://stiatomaelzrptazayml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aWF0b21hZWx6cnB0YXpheW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NjUyMjQsImV4cCI6MjA5ODQ0MTIyNH0.9vkvEYp1BFcIdkt1YSx87K6zlVkZUrmd1xLPpHmILn0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const buggyKeywords = [
  '[Auto] Penyesuaian Stock Opname',
  '[Auto] Koreksi final penyesuaian Kas Kecil',
  '[Auto] Koreksi presisi Kas Kecil',
  'Koreksi Penjualan Tunai tgl 20'
];

const isBuggy = (desc) => buggyKeywords.some(kw => (desc || '').toLowerCase().includes(kw.toLowerCase()));

async function cleanData() {
  console.log('Fetching expenses...');
  const { data: expenses, error: errExp } = await supabase.from('expenses').select('*');
  if (errExp) { console.error(errExp); return; }

  let deletedExpenses = 0;
  for (const exp of expenses || []) {
    if (isBuggy(exp.description)) {
      console.log(`Deleting buggy expense: ${exp.description} (Rp ${exp.amount})`);
      await supabase.from('expenses').delete().eq('id', exp.id);
      deletedExpenses++;
    }
  }
  console.log(`Deleted ${deletedExpenses} buggy expenses.`);

  console.log('Fetching journal entries...');
  const { data: journals, error: errJourn } = await supabase.from('journal_entries').select('*');
  if (errJourn) { console.error(errJourn); return; }

  let deletedJournals = 0;
  for (const j of journals || []) {
    if (isBuggy(j.description) || j.reference_id === 'AUTO_CORRECT' || j.reference_id === 'AUTO_CORRECT_LAWAN' || j.reference_id === 'FIXED_KAS_KOREKSI' || j.reference_id === 'FIXED_KAS_KOREKSI_LAWAN') {
      console.log(`Deleting buggy journal: ${j.description} (Ref: ${j.reference_id})`);
      await supabase.from('journal_entries').delete().eq('id', j.id);
      deletedJournals++;
    }
  }
  console.log(`Deleted ${deletedJournals} buggy journals.`);
  console.log('Cleanup complete!');
}

cleanData();
