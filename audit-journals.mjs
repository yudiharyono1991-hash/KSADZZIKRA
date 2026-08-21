import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fetchAll(table, dateColumn, startDate, endDate) {
  const allData = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select('*')
      .gte(dateColumn, startDate)
      .lte(dateColumn, endDate)
      .range(offset, offset + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return allData;
}

async function runAudit() {
  const startDate = '2026-08-01T00:00:00Z';
  const endDate = '2026-08-21T23:59:59Z';
  
  console.log(`Auditing from ${startDate} to ${endDate}...`);

  const txs = await fetchAll('transactions', 'timestamp', startDate, endDate);
  const exps = await fetchAll('expenses', 'date', startDate, endDate);
  const journals = await fetchAll('journal_entries', 'date', startDate, endDate);

  console.log(`Found ${txs.length} transactions, ${exps.length} expenses, and ${journals.length} journal entries.`);

  // Group journals by reference_id
  const journalsByRef = {};
  journals.forEach(j => {
    if (!journalsByRef[j.reference_id]) journalsByRef[j.reference_id] = [];
    journalsByRef[j.reference_id].push(j);
  });

  let missingTxJournals = [];
  let imbalancedTxJournals = [];

  txs.forEach(tx => {
    const jrs = journalsByRef[tx.id];
    if (!jrs || jrs.length === 0) {
      missingTxJournals.push(tx.id);
    } else {
      let d = 0, c = 0;
      jrs.forEach(j => {
        d += Number(j.debit || 0);
        c += Number(j.credit || 0);
      });
      if (Math.abs(d - c) > 0.1) {
        imbalancedTxJournals.push({ id: tx.id, debit: d, credit: c });
      }
    }
  });

  let missingExpJournals = [];
  let imbalancedExpJournals = [];

  exps.forEach(exp => {
    // skip buggy ones that were purged
    if ((exp.description || '').toLowerCase().includes('[auto]')) return;

    const jrs = journalsByRef[exp.id];
    if (!jrs || jrs.length === 0) {
      missingExpJournals.push(exp.id);
    } else {
      let d = 0, c = 0;
      jrs.forEach(j => {
        d += Number(j.debit || 0);
        c += Number(j.credit || 0);
      });
      if (Math.abs(d - c) > 0.1) {
        imbalancedExpJournals.push({ id: exp.id, debit: d, credit: c });
      }
    }
  });

  console.log('--- AUDIT RESULTS ---');
  console.log(`Transactions missing journals: ${missingTxJournals.length}`);
  if (missingTxJournals.length > 0) console.log(missingTxJournals.slice(0, 5), '...');
  
  console.log(`Transactions with IMBA journals: ${imbalancedTxJournals.length}`);
  if (imbalancedTxJournals.length > 0) console.log(imbalancedTxJournals.slice(0, 5), '...');

  console.log(`Expenses missing journals: ${missingExpJournals.length}`);
  if (missingExpJournals.length > 0) console.log(missingExpJournals.slice(0, 5), '...');

  console.log(`Expenses with IMBA journals: ${imbalancedExpJournals.length}`);
  if (imbalancedExpJournals.length > 0) console.log(imbalancedExpJournals.slice(0, 5), '...');

}

runAudit().catch(console.error);
