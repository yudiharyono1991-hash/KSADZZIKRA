import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase environment variables or use hardcoded fallbacks
let SUPABASE_URL = 'https://stiatomaelzrptazayml.supabase.co';
let SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aWF0b21hZWx6cnB0YXpheW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NjUyMjQsImV4cCI6MjA5ODQ0MTIyNH0.9vkvEYp1BFcIdkt1YSx87K6zlVkZUrmd1xLPpHmILn0';

// Try to override with User Settings if available
try {
  const savedSettings = localStorage.getItem('ksa_settings');
  if (savedSettings) {
    const parsed = JSON.parse(savedSettings);
    if (parsed.supabaseUrl) SUPABASE_URL = parsed.supabaseUrl;
    if (parsed.supabaseAnonKey) SUPABASE_ANON_KEY = parsed.supabaseAnonKey;
  }
} catch (e) { }

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'https://your-project.supabase.co');

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Clean logging helper
const logSync = (message: string, isError = false) => {
  if (isError) {
    console.warn(`[Supabase Info]: ${message} (Aplikasi akan otomatis mengaktifkan mode offline lokal sementara. Untuk mengaktifkan sinkronisasi cloud, harap impor skrip "supabase_schema.sql" di dashboard Supabase Anda)`);
  } else {
    console.log(`[Supabase Sync]: ${message}`);
  }
};

export function subscribeToTable(table: string, onEvent: (payload: any) => void) {
  if (!supabase) return () => { };

  try {
    const channel = supabase.channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload: any) => {
          try { onEvent(payload); } catch (err) { }
        }
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch (err) { }
    };
  } catch (err) {
    return () => { };
  }
}

/**
 * Upload gambar ke Supabase Storage.
 * Mengembalikan public URL jika berhasil, atau base64 string sebagai fallback.
 * 
 * @param file - File gambar yang akan diupload
 * @param bucket - Nama bucket ('product-images' atau 'store-assets')
 * @param path - Path/nama file di dalam bucket (misal: 'qris/qris_toko.jpg')
 * @param fallbackBase64 - Base64 string fallback jika upload gagal
 */
export async function uploadImageToStorage(
  file: File,
  bucket: 'product-images' | 'store-assets',
  path: string,
  fallbackBase64?: string
): Promise<string> {
  if (!supabase) {
    // Tidak ada koneksi Supabase, gunakan base64 lokal
    return fallbackBase64 || '';
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite jika sudah ada
        contentType: file.type,
      });

    if (error) {
      logSync(`Storage upload gagal (${bucket}/${path}): ${error.message}`, true);
      return fallbackBase64 || '';
    }

    // Ambil public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    logSync(`Gambar berhasil diupload: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (err: any) {
    logSync(`Upload error: ${err.message}`, true);
    return fallbackBase64 || '';
  }
}

/**
 * Kompres gambar menggunakan Canvas sebelum upload.
 * Mengembalikan File yang sudah dikompres.
 */
export function compressImage(file: File, maxWidth = 800, quality = 0.75): Promise<{ file: File; base64: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', quality);

        // Convert base64 to File
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
              });
              resolve({ file: compressedFile, base64 });
            } else {
              resolve({ file, base64 });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Robust DB helpers with automatic local fallback when offline/unconfigured.
 */
export const supabaseService = {
  // Helper untuk mendapatkan tenant ID dari localStorage
  getTenantId(): string {
    try {
      const userStr = localStorage.getItem('ksa_current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.tenantId || 'tenant_default';
      }
    } catch (e) { }
    return 'tenant_default';
  },

  // Products API
  async getProducts(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const tenantId = this.getTenantId();
      const pageSize = 1000;
      let offset = 0;
      const fetched: any[] = [];

      while (true) {
        let query = supabase
          .from('products')
          .select('*')
          .order('sku', { ascending: true });

        query = tenantId === 'tenant_default'
          ? query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
          : query.eq('tenant_id', tenantId);

        const { data, error } = await query.range(offset, offset + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;

        fetched.push(...data);
        if (data.length < pageSize) break;

        offset += pageSize;
      }

      try { console.log(`[Supabase] getProducts() tenantId=${tenantId} returned ${fetched.length} rows after pagination`); } catch (e) { }
      return fetched;
    } catch (err: any) {
      logSync(`Failed to fetch products: ${err.message}`, true);
      return null;
    }
  },

  async saveProduct(product: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const payload: any = {
        id: product.id,
        tenant_id: product.tenantId || tenantId,
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: Number(product.price),
        cost_price: Number(product.costPrice),
        stock: Number(product.stock),
        min_stock: Number(product.minStock),
        unit: product.unit,
        barcode: product.barcode || null,
        is_halal: product.isHalal,
        is_ppob: Boolean(product.isPPOB),
        image: product.image || null,
        wholesale_price: product.wholesalePrice || null,
        wholesale_min_qty: product.wholesaleMinQty || null,
        has_box_unit: product.hasBoxUnit || false,
        box_barcode: product.boxBarcode || null,
        pcs_per_box: product.pcsPerBox || null,
        box_price: product.boxPrice || null,
        box_cost_price: product.boxCostPrice || null,
        sales_coa_code: product.salesCoaCode || null,
        cogs_coa_code: product.cogsCoaCode || null
      };

      const { error } = await supabase
        .from('products')
        .upsert(payload);

      if (error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('column') || errorMessage.includes('field') || errorMessage.includes('cache')) {
          const basicPayload = {
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category,
            price: Number(product.price),
            cost_price: Number(product.costPrice),
            stock: Number(product.stock),
            min_stock: Number(product.minStock),
            unit: product.unit,
            barcode: product.barcode || null,
            is_halal: product.isHalal,
            is_ppob: Boolean(product.isPPOB),
            image: product.image || null
          };
          const { error: retryError } = await supabase
            .from('products')
            .upsert(basicPayload);
          if (retryError) throw retryError;
          logSync(`Saved product ${product.sku} successfully (using basic fallback).`);
          return true;
        }
        throw error;
      }
      logSync(`Saved product ${product.sku} successfully.`);
      return true;
    } catch (err: any) {
      logSync(`Failed to save product ${product.sku}: ${err.message}`, true);
      return false;
    }
  },

  async saveProductsBulk(products: any[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const payloads = products.map(p => ({
        id: p.id,
        tenant_id: p.tenantId || tenantId,
        sku: p.sku,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        cost_price: Number(p.costPrice),
        stock: Number(p.stock),
        min_stock: Number(p.minStock),
        unit: p.unit,
        barcode: p.barcode || null,
        is_halal: p.isHalal ?? true,
        is_ppob: Boolean(p.isPPOB),
        image: p.image || null,
        wholesale_price: p.wholesalePrice || null,
        wholesale_min_qty: p.wholesaleMinQty || null,
        has_box_unit: p.hasBoxUnit || false,
        box_barcode: p.boxBarcode || null,
        pcs_per_box: p.pcsPerBox || null,
        box_price: p.boxPrice || null,
        box_cost_price: p.boxCostPrice || null,
        sales_coa_code: p.salesCoaCode || null,
        cogs_coa_code: p.cogsCoaCode || null
      }));

      const { error } = await supabase
        .from('products')
        .upsert(payloads);

      if (error) {
        console.error('Supabase bulk save error payloads:', payloads.slice(0, 5));
        throw error;
      }
      logSync(`Bulk saved ${products.length} products successfully.`);
      return true;
    } catch (err: any) {
      console.error('Failed to bulk save products:', err);
      logSync(`Failed to bulk save products: ${err.message}`, true);
      return false;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      logSync(`Deleted product with ID ${id}.`);
      return true;
    } catch (err: any) {
      logSync(`Failed to delete product ${id}: ${err.message}`, true);
      return false;
    }
  },

  async deleteProductsByTenant(tenantId: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const query = tenantId === 'tenant_default'
        ? supabase.from('products').delete().or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
        : supabase.from('products').delete().eq('tenant_id', tenantId);
      const { error } = await query;
      if (error) throw error;
      logSync(`Deleted all products for tenant ${tenantId}.`);
      return true;
    } catch (err: any) {
      logSync(`Failed to delete products for tenant ${tenantId}: ${err.message}`, true);
      return false;
    }
  },

  // Transactions API
  async getTransactions(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const tenantId = this.getTenantId();
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('timestamp', { ascending: false });
      if (error) {
        // Fallback: If 'timestamp' column is missing or query fails, try ordering by id or created_at
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('transactions')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('id', { ascending: false });
        if (fallbackError) throw error; // If fallback also fails, throw original
        return fallbackData;
      }
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch transactions: ${err.message}`, true);
      return null;
    }
  },

  async saveTransaction(tx: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const payload: any = {
        id: tx.id,
        tenant_id: tenantId,
        invoice_no: tx.invoiceNo,
        timestamp: tx.timestamp,
        cashier_name: tx.cashierName,
        items: tx.items, // JSONB structure
        total_amount: Number(tx.totalAmount),
        payment_method: tx.paymentMethod,
        amount_paid: Number(tx.amountPaid),
        change_amount: Number(tx.changeAmount),
        zakat_contribution: Number(tx.zakatContribution),
        margin_contribution: Number(tx.marginContribution),
        infaq_contribution: Number(tx.infaqContribution || 0),
        customer_id: tx.customerId || null,
        branch_id: tx.branchId || null,
        points_earned: Number(tx.pointsEarned || 0),
        points_redeemed: Number(tx.pointsRedeemed || 0),
        points_discount: Number(tx.pointsDiscount || 0)
      };

      const { error } = await supabase
        .from('transactions')
        .insert(payload);

      if (error) {
        if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate')) {
          return true;
        }
        throw error;
      }
      logSync(`Inserted transaction ${tx.invoiceNo} successfully.`);
      return true;
    } catch (err: any) {
      logSync(`Failed to save transaction ${tx.invoiceNo}: ${err.message}`, true);
      return false;
    }
  },

  // Audit Logs API
  async getAuditLogs(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('id', { ascending: false });
        if (fallbackError) throw error;
        return fallbackData;
      }
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch audit logs: ${err.message}`, true);
      return null;
    }
  },

  async saveAuditLog(log: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const payload: any = {
        id: log.id,
        tenant_id: tenantId,
        timestamp: log.timestamp,
        username: log.user,
        action: log.action,
        category: log.category,
        details: log.details,
        ip_address: log.ipAddress
      };

      // Use upsert (INSERT ... ON CONFLICT DO UPDATE) to avoid 409 Conflict spam
      // This completely eliminates the duplicate key error when the same log is resent
      const { error } = await supabase
        .from('audit_logs')
        .upsert(payload, { onConflict: 'id', ignoreDuplicates: true });

      if (error) {
        // Silent fail for audit logs — they should never crash the UI
        logSync(`Failed to save audit log (non-critical): ${error.message}`, true);
        return false;
      }
      return true;
    } catch (err: any) {
      logSync(`Failed to save audit log: ${err.message}`, true);
      return false;
    }
  },

  // Zakat Calculations API
  async getZakatRecords(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('zakat_records')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('zakat_records')
          .select('*')
          .order('id', { ascending: false });
        if (fallbackError) throw error;
        return fallbackData;
      }
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch zakat records: ${err.message}`, true);
      return null;
    }
  },

  async saveZakatRecord(record: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload: any = {
        id: record.id,
        timestamp: record.timestamp,
        gold_price: Number(record.goldPricePerGram),
        nisab_value: Number(record.nisabValue),
        liquid_assets: Number(record.liquidAssets),
        inventory_value: Number(record.inventoryValue),
        receivables: Number(record.receivables),
        liabilities: Number(record.liabilities),
        net_wealth: Number(record.netWealth),
        is_eligible: record.isZakatRequired,
        zakat_due: Number(record.zakatDue),
        notes: record.notes || ''
      };

      const { error } = await supabase
        .from('zakat_records')
        .insert(payload);

      if (error) {
        if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate')) {
          return true;
        }
        if (error.message.includes('column') && error.message.includes('timestamp')) {
          const saferPayload = { ...payload };
          delete saferPayload.timestamp;
          const { error: retryError } = await supabase
            .from('zakat_records')
            .insert(saferPayload);
          if (retryError) {
            if (retryError.code === '23505' || retryError.message?.toLowerCase().includes('duplicate')) {
              return true;
            }
            throw retryError;
          }
          return true;
        }
        throw error;
      }
      return true;
    } catch (err: any) {
      logSync(`Failed to save zakat record: ${err.message}`, true);
      return false;
    }
  },

  // Zakat Distributions API
  async getZakatDistributions(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('zakat_distributions')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('zakat_distributions')
          .select('*')
          .order('id', { ascending: false });
        if (fallbackError) throw error;
        return fallbackData;
      }
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch zakat distributions: ${err.message}`, true);
      return null;
    }
  },

  async saveZakatDistribution(dist: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload: any = {
        id: dist.id,
        timestamp: dist.timestamp,
        amount: Number(dist.amount),
        recipient: dist.recipient,
        esg_category: dist.esgCategory,
        description: dist.description
      };

      const { error } = await supabase
        .from('zakat_distributions')
        .insert(payload);

      if (error) {
        if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate')) {
          return true;
        }
        if (error.message.includes('column') && error.message.includes('timestamp')) {
          const saferPayload = { ...payload };
          delete saferPayload.timestamp;
          const { error: retryError } = await supabase
            .from('zakat_distributions')
            .insert(saferPayload);
          if (retryError) {
            if (retryError.code === '23505' || retryError.message?.toLowerCase().includes('duplicate')) {
              return true;
            }
            throw retryError;
          }
          return true;
        }
        throw error;
      }
      return true;
    } catch (err: any) {
      logSync(`Failed to save zakat distribution: ${err.message}`, true);
      return false;
    }
  },

  // Expenses API
  async getExpenses(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((e: any) => ({
        id: e.id,
        tenantId: e.tenant_id,
        date: e.date,
        category: e.category,
        amount: Number(e.amount),
        description: e.description,
        createdBy: e.created_by,
        branchId: e.branch_id,
        coaId: e.coa_id
      }));
    } catch (err: any) {
      logSync(`Failed to fetch expenses: ${err.message}`, true);
      return null;
    }
  },

  async saveExpense(expense: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload = {
        id: expense.id,
        tenant_id: expense.tenantId || this.getTenantId(),
        date: expense.date,
        category: expense.category,
        amount: Number(expense.amount),
        description: expense.description,
        created_by: expense.createdBy,
        branch_id: expense.branchId || null,
        coa_id: expense.coaId || null
      };
      const { error } = await supabase.from('expenses').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save expense: ${err.message}`, true);
      return false;
    }
  },

  async deleteExpense(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to delete expense: ${err.message}`, true);
      return false;
    }
  },

  // Promos API
  async getPromos(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('promos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((p: any) => ({
        id: p.id,
        tenantId: p.tenant_id,
        code: p.code,
        description: p.description,
        discountType: p.discount_type,
        discountValue: Number(p.discount_value),
        minPurchase: Number(p.min_purchase),
        validFrom: p.valid_from,
        validUntil: p.valid_until,
        isActive: p.is_active,
        branchId: p.branch_id
      }));
    } catch (err: any) {
      logSync(`Failed to fetch promos: ${err.message}`, true);
      return null;
    }
  },

  async savePromo(promo: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload = {
        id: promo.id,
        tenant_id: promo.tenantId || this.getTenantId(),
        code: promo.code,
        description: promo.description,
        discount_type: promo.discountType,
        discount_value: Number(promo.discountValue),
        min_purchase: Number(promo.minPurchase),
        valid_from: promo.validFrom,
        valid_until: promo.validUntil,
        is_active: promo.isActive,
        branch_id: promo.branchId || null
      };
      const { error } = await supabase.from('promos').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save promo: ${err.message}`, true);
      return false;
    }
  },

  async deletePromo(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('promos').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to delete promo: ${err.message}`, true);
      return false;
    }
  },

  // Closings API
  async getClosings(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('closings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((c: any) => ({
        id: c.id,
        tenantId: c.tenant_id,
        date: c.date,
        shiftName: c.shift_name,
        cashierName: c.cashier_name,
        totalExpected: Number(c.total_expected),
        totalActual: Number(c.total_actual),
        difference: Number(c.difference),
        transactionsCount: Number(c.transactions_count),
        expensesTotal: Number(c.expenses_total),
        notes: c.notes,
        branchId: c.branch_id
      }));
    } catch (err: any) {
      logSync(`Failed to fetch closings: ${err.message}`, true);
      return null;
    }
  },

  async saveClosing(closing: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload = {
        id: closing.id,
        tenant_id: closing.tenantId || this.getTenantId(),
        date: closing.date,
        shift_name: closing.shiftName,
        cashier_name: closing.cashierName,
        total_expected: Number(closing.totalExpected),
        total_actual: Number(closing.totalActual),
        difference: Number(closing.difference),
        transactions_count: Number(closing.transactionsCount),
        expenses_total: Number(closing.expensesTotal),
        notes: closing.notes,
        branch_id: closing.branchId || null
      };
      const { error } = await supabase.from('closings').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save closing: ${err.message}`, true);
      return false;
    }
  },

  // Stock Movements API
  async getStockMovements(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((s: any) => ({
        id: s.id,
        tenantId: s.tenant_id,
        productId: s.product_id,
        productName: s.product_name,
        type: s.type,
        quantity: Number(s.quantity),
        previousStock: Number(s.previous_stock),
        newStock: Number(s.new_stock),
        date: s.date,
        referenceId: s.reference_id,
        notes: s.notes,
        createdBy: s.created_by,
        branchId: s.branch_id
      }));
    } catch (err: any) {
      logSync(`Failed to fetch stock movements: ${err.message}`, true);
      return null;
    }
  },

  async saveStockMovement(movement: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload = {
        id: movement.id,
        tenant_id: movement.tenantId || this.getTenantId(),
        product_id: movement.productId,
        product_name: movement.productName,
        type: movement.type,
        quantity: Number(movement.quantity),
        previous_stock: Number(movement.previousStock),
        new_stock: Number(movement.newStock),
        date: movement.date,
        reference_id: movement.referenceId,
        notes: movement.notes,
        created_by: movement.createdBy,
        branch_id: movement.branchId || null
      };
      const { error } = await supabase.from('stock_movements').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save stock movement: ${err.message}`, true);
      return false;
    }
  },

  // Users API
  async getUsers(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('ksa_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Map DB snake_case to app camelCase
      return data.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        password: u.password,
        role: u.role,
        createdAt: u.created_at,
        isActive: u.is_active,
        isApproved: u.is_approved,
        approvedBy: u.approved_by,
        approvedAt: u.approved_at,
        phone: u.phone,
        branchId: u.branch_id,
        debtAmount: Number(u.debt_amount || 0),
        employeeId: u.employee_id || null
      }));
    } catch (err: any) {
      logSync(`Failed to fetch users: ${err.message}`, true);
      return null;
    }
  },

  async saveUser(user: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const payload: any = {
        id: user.id,
        tenant_id: user.tenantId || tenantId,
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        created_at: user.createdAt,
        is_active: user.isActive,
        is_approved: user.isApproved,
        approved_by: user.approvedBy,
        approved_at: user.approvedAt,
        phone: user.phone,
        branch_id: user.branchId,
        debt_amount: Number(user.debtAmount || 0),
        employee_id: user.employeeId || null
      };

      const { error } = await supabase
        .from('ksa_users')
        .upsert(payload);

      if (error) throw error;
      logSync(`Saved user ${user.username} successfully.`);
      return true;
    } catch (err: any) {
      logSync(`Failed to save user ${user.username}: ${err.message}`, true);
      return false;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('ksa_users')
        .delete()
        .eq('id', id);
      if (error) throw error;
      logSync(`Deleted user with ID ${id}.`);
      return true;
    } catch (err: any) {
      logSync(`Failed to delete user ${id}: ${err.message}`, true);
      return false;
    }
  },

  async saveCustomer(customer: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload: any = {
        id: customer.id,
        tenant_id: customer.tenantId || 'tenant_default',
        name: customer.name,
        phone: customer.phone || '',
        points: Number(customer.points || 0),
        debt_amount: Number(customer.debtAmount || 0),
        branch_id: customer.branchId || null,
        is_koperasi_member: Boolean(customer.isKoperasiMember)
      };

      const { error } = await supabase
        .from('customers')
        .upsert(payload);

      if (error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('column') || errorMessage.includes('field') || errorMessage.includes('cache')) {
          const basicPayload = {
            id: customer.id,
            name: customer.name,
            phone: customer.phone || '',
            points: Number(customer.points || 0),
            debt_amount: Number(customer.debtAmount || 0)
          };
          const { error: retryError } = await supabase
            .from('customers')
            .upsert(basicPayload);
          if (retryError) throw retryError;
          logSync(`Saved customer ${customer.name} successfully (using basic fallback).`);
          return true;
        }
        throw error;
      }
      logSync(`Saved customer ${customer.name} successfully.`);
      return true;
    } catch (err: any) {
      logSync(`Failed to save customer ${customer.name}: ${err.message}`, true);
      return false;
    }
  },

  async deleteCustomer(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      logSync(`Deleted customer with ID ${id}.`);
      return true;
    } catch (err: any) {
      logSync(`Failed to delete customer ${id}: ${err.message}`, true);
      return false;
    }
  },

  // NEW APIS
  async getCustomers(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch customers: ${err.message}`, true);
      return null;
    }
  },
  async getCoaAccounts(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const tenantId = this.getTenantId();
      const query = supabase.from('coa_accounts').select('*');
      const accountQuery = tenantId === 'tenant_default'
        ? query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
        : query.eq('tenant_id', tenantId);
      const { data, error } = await accountQuery;
      if (error) throw error;
      try { console.log(`[Supabase] getCoaAccounts() tenantId=${tenantId} returned ${Array.isArray(data) ? data.length : 0} rows`); } catch (e) { }
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch coa_accounts: ${err.message}`, true);
      return null;
    }
  },
  async saveCoaAccount(coa: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const payload = {
        id: coa.id,
        tenant_id: coa.tenantId || tenantId,
        code: coa.code,
        name: coa.name,
        category: coa.category,
        normal_balance: coa.normalBalance || null,
        is_active: coa.isActive ?? true
      };
      const { error } = await supabase.from('coa_accounts').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save coa_account: ${err.message}`, true);
      return false;
    }
  },
  async saveCoaAccountsBulk(coas: any[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const payloads = coas.map(c => ({
        id: c.id,
        tenant_id: c.tenantId || tenantId,
        code: c.code,
        name: c.name,
        category: c.category,
        normal_balance: c.normalBalance || null,
        is_active: c.isActive ?? true
      }));
      const { error } = await supabase.from('coa_accounts').upsert(payloads);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to bulk save coa_accounts: ${err.message}`, true);
      return false;
    }
  },
  async deleteCoaAccount(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('coa_accounts').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to delete coa_account ${id}: ${err.message}`, true);
      return false;
    }
  },
  async getStoreSettings(): Promise<any | null> {
    if (!supabase) return null;
    try {
      const tenantId = this.getTenantId();
      const { data, error } = await supabase.from('store_settings').select('*').eq('tenant_id', tenantId).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error; // ignore no rows
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch store settings: ${err.message}`, true);
      return null;
    }
  },
  async saveStoreSettings(settings: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const mapped = {
        id: 'settings_1',
        tenant_id: tenantId,
        store_name: settings.storeName || '',
        store_address: settings.storeAddress || '',
        store_phone: settings.storePhone || '',
        business_type: settings.businessType || 'KOPERASI',
        owner_whatsapp: settings.ownerWhatsapp || '',
        is_tax_enabled: Boolean(settings.isTaxEnabled),
        tax_rate: Number(settings.taxRate) || 0,
        payment_timeout_minutes: Number(settings.paymentTimeoutMinutes) || 60,
        store_location_lat: settings.storeLocationLat ? Number(settings.storeLocationLat) : null,
        store_location_lng: settings.storeLocationLng ? Number(settings.storeLocationLng) : null,
        max_delivery_radius_km: Number(settings.maxDeliveryRadiusKm) || 5,
        qris_enabled: Boolean(settings.qrisEnabled),
        qris_image_url: settings.qrisImageUrl || null,
        maintenance_mode: Boolean(settings.maintenanceMode),
        minimum_cash_balance: Number(settings.minimumCashBalance) || 1000000,
        petty_cash_balance: Number(settings.pettyCashBalance) || 0,
        zakat_rate: Number(settings.zakatRate) || 2.5,
        auto_approve_transactions: Boolean(settings.autoApproveTransactions),
        owner_bank_name: settings.ownerBankName || null,
        owner_bank_account: settings.ownerBankAccount || null,
        payment_methods: settings.paymentMethods || { bankTransfer: [], ewallet: [] },
        operational_hours: settings.operationalHours || null,
        enable_charity_zakat: Boolean(settings.enableCharityZakat),
        charity_zakat_percentage: Number(settings.charityZakatPercentage) || 2.5,
        charity_title: settings.charityTitle || null,
        charity_description: settings.charityDescription || null,
        enable_points: Boolean(settings.enablePoints),
        point_earning_rate: Number(settings.pointEarningRate) || 1000,
        point_redemption_value: Number(settings.pointRedemptionValue) || 10,
        enable_ppob_integration: Boolean(settings.enablePpobIntegration),
        ppob_provider_url: settings.ppobProviderUrl || null,
        ppob_api_key: settings.ppobApiKey || null,
        default_ppob_admin_fee: Number(settings.defaultPpobAdminFee) || 0,
        landing_page_config: settings.landingPageConfig || null,
        upload_password: settings.uploadPassword || null,
        upload_password_roles: settings.uploadPasswordRoles || null
      };
      const { error } = await supabase.from('store_settings').upsert(mapped);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save store settings: ${err.message}`, true);
      return false;
    }
  },
  async getOnlineOrders(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('online_orders').select('*');
      if (error) throw error;
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch online_orders: ${err.message}`, true);
      return null;
    }
  },
  async saveOnlineOrder(order: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const { error } = await supabase.from('online_orders').upsert({
        id: order.id,
        tenant_id: tenantId,
        order_no: order.orderNo,
        customer_id: order.customerId,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_address: order.customerAddress,
        distance_km: order.distanceKm,
        total_amount: order.totalAmount,
        status: order.status,
        payment_code: order.paymentCode,
        notes: order.notes,
        items: order.items,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      });
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save online order: ${err.message}`, true);
      return false;
    }
  },
  async getJournalEntries(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const pageSize = 1000;
      let offset = 0;
      const fetched: any[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .range(offset, offset + pageSize - 1);
          
        if (error) throw error;
        if (!data || data.length === 0) break;

        fetched.push(...data);
        if (data.length < pageSize) break;

        offset += pageSize;
      }

      return fetched;
    } catch (err: any) {
      logSync(`Failed to fetch journal_entries: ${err.message}`, true);
      return null;
    }
  },
  async saveJournalEntry(entry: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const { error } = await supabase.from('journal_entries').upsert({
        id: entry.id,
        tenant_id: tenantId,
        date: entry.date,
        description: entry.description,
        account: entry.account,
        debit: entry.debit,
        credit: entry.credit,
        reference_id: entry.referenceId,
        reference_type: entry.referenceType,
        created_by: entry.createdBy,
        branch_id: entry.branchId
      });
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save journal_entry: ${err.message}`, true);
      return false;
    }
  },
  async saveJournalEntriesBulk(entries: any[]): Promise<boolean> {
    if (!supabase || entries.length === 0) return false;
    try {
      const tenantId = this.getTenantId();
      const payload = entries.map(entry => ({
        id: entry.id,
        tenant_id: tenantId,
        date: entry.date,
        description: entry.description,
        account: entry.account,
        debit: entry.debit,
        credit: entry.credit,
        reference_id: entry.referenceId,
        reference_type: entry.referenceType,
        created_by: entry.createdBy,
        branch_id: entry.branchId
      }));
      const { error } = await supabase.from('journal_entries').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save journal_entries bulk: ${err.message}`, true);
      return false;
    }
  },
  async deleteJournalEntry(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to delete journal_entry: ${err.message}`, true);
      return false;
    }
  },
  async deleteJournalEntryByRef(refId: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('journal_entries').delete().eq('reference_id', refId);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to delete journal_entries by ref: ${err.message}`, true);
      return false;
    }
  },
  async clearAllDatabase(tenantId: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tables = [
        'products', 'transactions', 'online_orders', 'audit_logs', 'zakat_records',
        'zakat_distributions', 'expenses', 'closings', 'purchase_orders',
        'journal_entries', 'customers', 'suppliers', 'promos', 'attendances',
        'stock_movements'
      ];

      for (const table of tables) {
        if (tenantId === 'tenant_default' || !tenantId) {
          await supabase.from(table).delete().or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
        } else {
          await supabase.from(table).delete().eq('tenant_id', tenantId);
        }
      }
      logSync(`Semua data untuk tenant ${tenantId} telah dihapus permanen dari Supabase.`);
      return true;
    } catch (err: any) {
      logSync(`Failed to clear database for tenant ${tenantId}: ${err.message}`, true);
      return false;
    }
  },

  // Attendances API
  async getAttendances(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const tenantId = this.getTenantId();
      const query = supabase.from('attendance').select('*').order('date', { ascending: false });
      const { data, error } = tenantId === 'tenant_default'
        ? await query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
        : await query.eq('tenant_id', tenantId);
      if (error) throw error;
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch attendances: ${err.message}`, true);
      return null;
    }
  },
  async saveAttendance(attendance: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const tenantId = this.getTenantId();
      const payload: any = {
        id: attendance.id,
        tenant_id: attendance.tenantId || tenantId,
        user_id: attendance.userId,
        user_name: attendance.userName,
        date: attendance.date,
        clock_in: attendance.clockIn,
        clock_out: attendance.clockOut,
        status: attendance.status,
        branch_id: attendance.branchId,
        photo_url: attendance.photoUrl,
        clock_out_photo_url: attendance.clockOutPhotoUrl || null,
        latitude: attendance.latitude,
        longitude: attendance.longitude,
        clock_out_latitude: attendance.clockOutLatitude || null,
        clock_out_longitude: attendance.clockOutLongitude || null,
        correction_status: attendance.correctionStatus || null,
        correction_reason: attendance.correctionReason || null,
        correction_type: attendance.correctionType || null,
        requested_clock_in: attendance.requestedClockIn || null,
        requested_clock_out: attendance.requestedClockOut || null,
        leave_type: attendance.leaveType || null,
        reviewed_by: attendance.reviewedBy || null,
        reviewed_at: attendance.reviewedAt || null,
        is_revised: attendance.isRevised || false
      };
      const { error } = await supabase.from('attendance').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save attendance: ${err.message}`, true);
      return false;
    }
  },

  async getBranches(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const tenantId = this.getTenantId();
      const { data, error } = await supabase.from('ksa_branches').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch branches: ${err.message}`, true);
      return null;
    }
  },
  async saveBranch(branch: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload = {
        id: branch.id,
        tenant_id: branch.tenantId,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        whatsapp: branch.whatsapp || null,
        is_active: branch.isActive,
        qris_image_url: branch.qrisImageUrl || null
      };
      const { error } = await supabase.from('ksa_branches').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save branch: ${err.message}`, true);
      return false;
    }
  },
  async deleteBranch(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('ksa_branches').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to delete branch ${id}: ${err.message}`, true);
      return false;
    }
  },
  async getSuppliers(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const tenantId = this.getTenantId();
      const { data, error } = await supabase.from('suppliers').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch suppliers: ${err.message}`, true);
      return null;
    }
  },
  async saveSupplier(supplier: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload = {
        id: supplier.id,
        tenant_id: supplier.tenantId,
        name: supplier.name,
        contact_person: supplier.contactPerson,
        phone: supplier.phone,
        address: supplier.address,
        debt_amount: supplier.debtAmount,
        branch_id: supplier.branchId || null
      };
      const { error } = await supabase.from('suppliers').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save supplier: ${err.message}`, true);
      return false;
    }
  },
  async deleteSupplier(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to delete supplier ${id}: ${err.message}`, true);
      return false;
    }
  },
  async getPurchaseOrders(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const tenantId = this.getTenantId();
      const { data, error } = await supabase.from('purchase_orders').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch purchase orders: ${err.message}`, true);
      return null;
    }
  },
  async savePurchaseOrder(po: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload = {
        id: po.id,
        tenant_id: po.tenantId,
        po_number: po.poNumber,
        date: po.date,
        supplier: po.supplier,
        items: po.items,
        total_amount: po.totalAmount,
        status: po.status,
        created_by: po.createdBy,
        notes: po.notes || null,
        branch_id: po.branchId || null,
        invoice_supplier: po.invoiceSupplier || null
      };
      const { error } = await supabase.from('purchase_orders').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save purchase order: ${err.message}`, true);
      return false;
    }
  },
  async deletePurchaseOrder(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to delete purchase order ${id}: ${err.message}`, true);
      return false;
    }
  },
  async getProductCategories(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const tenantId = this.getTenantId();
      const { data, error } = await supabase.from('product_categories').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch product categories: ${err.message}`, true);
      return null;
    }
  },
  async saveProductCategory(category: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload = {
        id: category.id,
        tenant_id: category.tenantId,
        name: category.name
      };
      const { error } = await supabase.from('product_categories').upsert(payload);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save product category: ${err.message}`, true);
      return false;
    }
  },
  async deleteProductCategory(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('product_categories').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to delete product category ${id}: ${err.message}`, true);
      return false;
    }
  }
};
