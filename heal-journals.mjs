import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://stiatomaelzrptazayml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aWF0b21hZWx6cnB0YXpheW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NjUyMjQsImV4cCI6MjA5ODQ0MTIyNH0.9vkvEYp1BFcIdkt1YSx87K6zlVkZUrmd1xLPpHmILn0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function heal() {
  console.log('Fetching expenses...');
  const { data: expenses, error: errExp } = await supabase.from('expenses').select('*');
  if (errExp) { console.error(errExp); return; }

  console.log('Fetching journal entries...');
  const { data: journals, error: errJourn } = await supabase.from('journal_entries').select('*');
  if (errJourn) { console.error(errJourn); return; }

  const existingRefs = new Set(journals.map(j => j.reference_id));
  
  const newJournals = [];
  
  for (const exp of expenses || []) {
    // Skip buggy ones
    if ((exp.description || '').toLowerCase().includes('[auto]')) continue;
    
    if (!existingRefs.has(exp.id)) {
      console.log(`Found missing journal for expense: ${exp.description} (Rp ${exp.amount})`);
      
      const isIncome = Number(exp.amount) < 0;
      const absAmount = Math.abs(Number(exp.amount));
      
      newJournals.push({
        id: `je_exp_${exp.id}_1`,
        tenant_id: exp.tenant_id,
        date: exp.date,
        account: exp.coa_id || '5400 - Beban Operasional Lain',
        description: exp.description,
        debit: isIncome ? 0 : absAmount,
        credit: isIncome ? absAmount : 0,
        reference_id: exp.id,
        reference_type: 'AUTO_BEBAN',
        created_by: exp.created_by || 'System',
        branch_id: exp.branch_id
      });
      
      newJournals.push({
        id: `je_exp_${exp.id}_2`,
        tenant_id: exp.tenant_id,
        date: exp.date,
        account: exp.kas_account_id || '1102 - Kas Kecil',
        description: exp.description,
        debit: isIncome ? absAmount : 0,
        credit: isIncome ? 0 : absAmount,
        reference_id: exp.id,
        reference_type: 'AUTO_BEBAN',
        created_by: exp.created_by || 'System',
        branch_id: exp.branch_id
      });
    }
  }

  if (newJournals.length > 0) {
    console.log(`Inserting ${newJournals.length} missing journals...`);
    const { error: insErr } = await supabase.from('journal_entries').insert(newJournals);
    if (insErr) {
      console.error('Failed to insert missing journals', insErr);
    } else {
      console.log('Successfully healed journals!');
    }
  } else {
    console.log('No missing journals found.');
  }
}

heal();
