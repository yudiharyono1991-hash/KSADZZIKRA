import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase environment variables from Vite env config.
const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || 'https://rxuwdnaycysgmofazjmz.supabase.co';
const SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4dXdkbmF5Y3lzZ21vZmF6am16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NDQzODMsImV4cCI6MjA5ODUyMDM4M30.OOmVoWbtCbpavCReyh5jVOWhTe0uhywV3NA3nXmcfXI';


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

/**
 * Robust DB helpers with automatic local fallback when offline/unconfigured.
 */
export const supabaseService = {
  // Products API
  async getProducts(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sku', { ascending: true });
      if (error) throw error;
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch products: ${err.message}`, true);
      return null;
    }
  },

  async saveProduct(product: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload: any = {
        id: product.id,
        tenant_id: product.tenantId || 'tenant_default',
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
      const payloads = products.map(p => ({
        id: p.id,
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
        image: p.image || null
      }));

      const { error } = await supabase
        .from('products')
        .upsert(payloads);

      if (error) throw error;
      logSync(`Bulk saved ${products.length} products successfully.`);
      return true;
    } catch (err: any) {
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

  // Transactions API
  async getTransactions(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) {
        // Fallback: If 'timestamp' column is missing or query fails, try ordering by id or created_at
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('transactions')
          .select('*')
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
      const payload: any = {
        id: tx.id,
        tenant_id: tx.tenantId || 'tenant_default',
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
        customer_id: tx.customerId || null,
        customer_name: tx.customerName || null,
        promo_id: tx.promoId || null,
        discount_amount: Number(tx.discountAmount || 0),
        branch_id: tx.branchId || null,
        is_voided: Boolean(tx.isVoided),
        void_reason: tx.voidReason || null,
        tax_amount: Number(tx.taxAmount || 0),
        split_payments: tx.splitPayments || [],
        points_earned: Number(tx.pointsEarned || 0),
        points_redeemed: Number(tx.pointsRedeemed || 0),
        points_discount: Number(tx.pointsDiscount || 0)
      };

      const { error } = await supabase
        .from('transactions')
        .insert(payload);

      if (error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('column') || errorMessage.includes('field') || errorMessage.includes('cache')) {
          const basicPayload = {
            id: tx.id,
            invoice_no: tx.invoiceNo,
            timestamp: tx.timestamp,
            cashier_name: tx.cashierName,
            items: tx.items,
            total_amount: Number(tx.totalAmount),
            payment_method: tx.paymentMethod,
            amount_paid: Number(tx.amountPaid),
            change_amount: Number(tx.changeAmount),
            zakat_contribution: Number(tx.zakatContribution),
            margin_contribution: Number(tx.marginContribution)
          };
          const { error: retryError } = await supabase
            .from('transactions')
            .insert(basicPayload);
          if (retryError) throw retryError;
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
      const payload: any = {
        id: log.id,
        timestamp: log.timestamp,
        username: log.user,
        action: log.action,
        category: log.category,
        details: log.details,
        ip_address: log.ipAddress
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(payload);

      if (error) {
        // Deteksi dinamis jika ada kolom yang tidak ditemukan dalam skema cache Supabase
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('column') || errorMessage.includes('field') || errorMessage.includes('cache')) {
          const saferPayload = { ...payload };
          
          // Hapus kolom bermasalah yang terdeteksi dari pesan error
          if (errorMessage.includes('details')) {
            delete saferPayload.details;
          }
          if (errorMessage.includes('category')) {
            delete saferPayload.category;
          }
          if (errorMessage.includes('timestamp')) {
            delete saferPayload.timestamp;
          }
          if (errorMessage.includes('ip_address') || errorMessage.includes('ipaddress') || errorMessage.includes('ip')) {
            delete saferPayload.ip_address;
          }
          
          const { error: retryError } = await supabase
            .from('audit_logs')
            .insert(saferPayload);

          if (retryError) {
            // Jika masih gagal, kirim payload paling minimal (id, action, username) agar tidak memicu error di UI
            const barePayload = {
              id: payload.id,
              action: payload.action,
              username: payload.username
            };
            const { error: bareError } = await supabase
              .from('audit_logs')
              .insert(barePayload);
            if (bareError) {
              logSync(`Failed dynamic audit log retry: ${bareError.message}`, true);
              return false; // Jangan lempar exception agar UI tidak crash
            }
          }
          return true;
        }
        throw error;
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
        if (error.message.includes('column') && error.message.includes('timestamp')) {
          const saferPayload = { ...payload };
          delete saferPayload.timestamp;
          const { error: retryError } = await supabase
            .from('zakat_records')
            .insert(saferPayload);
          if (retryError) throw retryError;
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
        if (error.message.includes('column') && error.message.includes('timestamp')) {
          const saferPayload = { ...payload };
          delete saferPayload.timestamp;
          const { error: retryError } = await supabase
            .from('zakat_distributions')
            .insert(saferPayload);
          if (retryError) throw retryError;
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

  // Users API
  async getUsers(): Promise<any[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('ba_users')
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
        branchId: u.branch_id
      }));
    } catch (err: any) {
      logSync(`Failed to fetch users: ${err.message}`, true);
      return null;
    }
  },

  async saveUser(user: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const payload: any = {
        id: user.id,
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
        branch_id: user.branchId
      };

      const { error } = await supabase
        .from('ba_users')
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
        .from('ba_users')
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
      const { data, error } = await supabase.from('coa_accounts').select('*');
      if (error) throw error;
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch coa_accounts: ${err.message}`, true);
      return null;
    }
  },
  async saveCoaAccount(coa: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('coa_accounts').upsert(coa);
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save coa_account: ${err.message}`, true);
      return false;
    }
  },
  async getStoreSettings(): Promise<any | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
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
      const { error } = await supabase.from('store_settings').upsert({ ...settings, id: 'settings_1' });
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
      const { error } = await supabase.from('online_orders').upsert({
        id: order.id,
        tenant_id: order.tenantId,
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
      const { data, error } = await supabase.from('journal_entries').select('*');
      if (error) throw error;
      return data;
    } catch (err: any) {
      logSync(`Failed to fetch journal_entries: ${err.message}`, true);
      return null;
    }
  },
  async saveJournalEntry(entry: any): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('journal_entries').upsert({
        id: entry.id,
        tenant_id: entry.tenantId,
        date: entry.date,
        description: entry.description,
        reference: entry.reference,
        amount: entry.amount,
        type: entry.type,
        account_id: entry.accountId,
        created_at: entry.createdAt
      });
      if (error) throw error;
      return true;
    } catch (err: any) {
      logSync(`Failed to save journal_entry: ${err.message}`, true);
      return false;
    }
  }
};
