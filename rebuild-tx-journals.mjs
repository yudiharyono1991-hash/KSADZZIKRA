import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function rebuildTransactionsJournals() {
  console.log('Fetching all transactions...');
  // Fetch paginated to avoid limits!
  const transactions = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from('transactions').select('*').range(offset, offset + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    transactions.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  
  console.log('Fetching all journal entries...');
  const journals = [];
  offset = 0;
  while (true) {
    const { data, error } = await supabase.from('journal_entries').select('reference_id').range(offset, offset + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    journals.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  const existingRefIds = new Set(journals.map(j => j.reference_id));
  
  console.log('Fetching products...');
  const { data: products, error: errProds } = await supabase.from('products').select('*');
  if (errProds) throw errProds;

  const getPaymentCoa = (method) => {
    if (method === 'CASH') return '1102 - Kas Kecil';
    if (method === 'QRIS_SHARIAH' || method === 'QRIS') return '1020 - QRIS Syariah Dana';
    if (method === 'KASBON') return '1030 - Piutang Kasbon Pelanggan';
    if (method === 'EWALLET') return '1117 - Saldo Dana Dokuku';
    if (method === 'BANK_LAIN') return '1104 - Bank Syariah Dana Sosial';
    if (method === 'TRANSFER_BSI') return '1103 - Bank Syariah Indonesia 7216467242';
    return '1103 - Bank Syariah Indonesia 7216467242';
  };

  const newJournals = [];

  transactions.forEach(tx => {
    if (existingRefIds.has(tx.id)) return; // Already has journal

    const jId = `je_${tx.id}`;
    const akunKas = getPaymentCoa(tx.payment_method);

    // Debit Kas/Bank
    newJournals.push({
      id: `${jId}_1`,
      tenant_id: tx.tenant_id,
      date: tx.timestamp,
      account: akunKas,
      description: `[Auto] Penjualan ${tx.payment_method} dari ${tx.invoice_no}`,
      debit: Number(tx.total_amount),
      credit: 0,
      reference_id: tx.id,
      reference_type: 'AUTO_TRANSAKSI',
      created_by: tx.cashier_name || 'System',
      branch_id: tx.branch_id
    });

    const revenueGroups = {};
    const cogsGroups = {};

    (tx.items || []).forEach(item => {
      const prod = products.find(p => p.id === item.productId) || {};
      
      const isPPOB = prod.isPPOB || false;
      const sCoa = isPPOB ? '4105 - Pendapatan Administrasi' : '4101 - Margin Murabahah'; // Pendapatan
      const cCoa = '5001 - Harga Pokok Penjualan (HPP)'; // HPP

      const rev = Number(item.price) * Number(item.quantity);
      const cost = Number(item.costPrice || prod.costPrice || 0);
      const cogs = cost * Number(item.quantity);

      revenueGroups[sCoa] = (revenueGroups[sCoa] || 0) + rev;
      
      const invCoa = '1110 - Persediaan Unit Toko'; // Persediaan Unit Toko
      const key = `${cCoa}|${invCoa}`;
      cogsGroups[key] = (cogsGroups[key] || 0) + cogs;
    });

    let totalRevenueJournaled = 0;
    const revEntries = Object.entries(revenueGroups);
    revEntries.forEach(([coa, amount], index) => {
      let netRev = Math.round(amount);
      if (index === revEntries.length - 1) netRev = Number(tx.total_amount) - totalRevenueJournaled;
      totalRevenueJournaled += netRev;

      if (netRev > 0) {
        newJournals.push({
          id: `${jId}_rev_${index}`,
          tenant_id: tx.tenant_id,
          date: tx.timestamp,
          account: coa,
          description: `[Auto] Pendapatan penjualan ${tx.invoice_no}`,
          debit: 0,
          credit: netRev,
          reference_id: tx.id,
          reference_type: 'AUTO_TRANSAKSI',
          created_by: tx.cashier_name || 'System',
          branch_id: tx.branch_id
        });
      }
    });

    Object.entries(cogsGroups).forEach(([key, amount], index) => {
      const [cCoa, invCoa] = key.split('|');
      if (amount > 0) {
        newJournals.push({
          id: `${jId}_cogs_${index}`,
          tenant_id: tx.tenant_id,
          date: tx.timestamp,
          account: cCoa,
          description: `[Auto] HPP ${tx.invoice_no}`,
          debit: amount,
          credit: 0,
          reference_id: tx.id,
          reference_type: 'AUTO_TRANSAKSI',
          created_by: tx.cashier_name || 'System',
          branch_id: tx.branch_id
        });
        newJournals.push({
          id: `${jId}_inv_${index}`,
          tenant_id: tx.tenant_id,
          date: tx.timestamp,
          account: invCoa,
          description: `[Auto] Keluar Saldo/Persediaan ${tx.invoice_no}`,
          debit: 0,
          credit: amount,
          reference_id: tx.id,
          reference_type: 'AUTO_TRANSAKSI',
          created_by: tx.cashier_name || 'System',
          branch_id: tx.branch_id
        });
      }
    });
  });

  if (newJournals.length > 0) {
    console.log(`Found ${newJournals.length} missing transaction journals! Inserting...`);
    const batchSize = 100;
    for (let i = 0; i < newJournals.length; i += batchSize) {
      const batch = newJournals.slice(i, i + batchSize);
      const { error } = await supabase.from('journal_entries').insert(batch);
      if (error) {
        console.error('Failed to insert batch', error);
      }
    }
    console.log('Successfully inserted all missing transaction journals.');
  } else {
    console.log('No missing transaction journals found.');
  }
}

rebuildTransactionsJournals();
