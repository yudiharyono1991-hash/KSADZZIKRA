import { create } from 'zustand';
import { Product, CartItem, Transaction, AuditLog, ZakatCalculation, ZakatDistribution, CurrentUser, Expense, ClosingRecord, UserRole, UserAccount, PurchaseOrder, JournalEntry, JournalSourceType, Branch, Customer, Supplier, Promo, Attendance, StoreSettings, StockMovement, OnlineOrder, ChatMessage, CoaAccount } from '../types';
import { supabaseService, isSupabaseConfigured, uploadImageToStorage } from '../lib/supabase';

// Worker flags to avoid concurrent processors across calls
let imageWorkerRunning = false;
let forceSyncRunning = false;

function dataUrlToFile(dataUrl: string, filename = 'image.jpg') {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const getStorage = (key: string, tenantId?: string) => {
  try {
    // Determine tenantId if not provided
    let tid = tenantId;
    if (!tid) {
      const userStr = localStorage.getItem('ksa_current_user');
      if (userStr) {
        try { tid = JSON.parse(userStr).tenantId || 'tenant_default'; } catch (e) { tid = 'tenant_default'; }
      }
    }

    if (!tid) {
      tid = 'tenant_default';
    }

    // Try tenant-scoped key first
    if (tid) {
      const scopedKey = `${key}__${tid}`;
      const scoped = localStorage.getItem(scopedKey);
      if (scoped) {
        try { return JSON.parse(scoped); } catch (e) {}
      }
    }

    // Fallback to global key
    const saved = localStorage.getItem(key);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
  } catch (err) {}
  return null;
};

const saveStorage = (key: string, data: any, tenantId?: string) => {
  try {
    // Determine tenantId if not provided
    let tid = tenantId;
    if (!tid) {
      const userStr = localStorage.getItem('ksa_current_user');
      if (userStr) {
        try { tid = JSON.parse(userStr).tenantId || 'tenant_default'; } catch (e) { tid = 'tenant_default'; }
      }
    }

    if (!tid) {
      tid = 'tenant_default';
    }

    if (tid) {
      const scopedKey = `${key}__${tid}`;
      localStorage.setItem(scopedKey, JSON.stringify(data));
      return;
    }

    // No tenant found: save to global key
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    console.error(`Gagal menyimpan data lokal (${key}):`, e);
    if (e.name === 'QuotaExceededError') {
      alert('Penyimpanan lokal penuh (Quota Exceeded). Silakan bersihkan riwayat atau gambar berukuran besar.');
    }
  }
};

const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

const runSupabaseTask = async <T>(label: string, task: () => Promise<T>, onSuccess: (result: T) => void, timeoutMs = 30000) => {
  try {
    const result = await new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      task()
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });

    if (result !== undefined && result !== null) {
      onSuccess(result);
    }
  } catch (err) {
    console.warn(`[Supabase] ${label} failed:`, err);
  }
};

interface AppState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  tenants: import('../types').Tenant[];
  registerTenant: (tenant: Omit<import('../types').Tenant, 'id' | 'status' | 'createdAt'>) => void;
  approveTenant: (tenantId: string) => void;
  loadTenantData: (tenantId: string) => void;

  products: Product[];
  cart: CartItem[];
  lastTransactionId: string | null;
  customerCart: CartItem[]; // Khusus portal pelanggan
  transactions: Transaction[];
  onlineOrders: OnlineOrder[];
  chatMessages: ChatMessage[];
  auditLogs: AuditLog[];
  zakatRecords: ZakatCalculation[];
  zakatDistributions: ZakatDistribution[];
  currentUser: CurrentUser | null;
  isLoading: boolean;
  
  // Custom accounting features
  expenses: Expense[];
  closings: ClosingRecord[];
  users: UserAccount[];
  purchaseOrders: PurchaseOrder[];
  journalEntries: JournalEntry[];
  branches: Branch[];
  categories: string[];
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  setCategories: (categories: string[]) => void;
  customers: Customer[];
  suppliers: Supplier[];
  promos: Promo[];
  attendances: Attendance[];
  imageQueue: string[];
  enqueueImageGeneration: (productId: string) => void;
  processImageQueue: () => Promise<void>;
  
  // Phase 2 features
  settings: StoreSettings;
  stockMovements: StockMovement[];
  activeBranchId: string;
  notifications: import('../types').AppNotification[];

  // Settings
  updateSettings: (settings: Partial<StoreSettings>) => void;
  
  // Stock Movement
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'date' | 'userId'>) => void;
  
  // Branch Filter
  setActiveBranchId: (branchId: string) => void;
  
  // Void
  requestVoidTransaction: (txId: string, reason: string) => void;
  approveVoidTransaction: (txId: string, isApproved: boolean) => void;
  
  // Notifications
  addNotification: (notif: Omit<import('../types').AppNotification, 'id' | 'createdAt' | 'isRead' | 'tenantId'>) => void;
  markNotificationAsRead: (id: string) => void;

  // Branch Actions
  addBranch: (branch: Omit<Branch, 'id' | 'createdAt'>) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;

  // CRM & Supplier
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'> & { id?: string }) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Promos
  addPromo: (promo: Omit<Promo, 'id' | 'createdAt'>) => void;
  updatePromo: (id: string, updates: Partial<Promo>) => void;
  deletePromo: (id: string) => void;

  // Attendance
  clockIn: (userId: string, userName: string, photoUrl?: string, latitude?: number, longitude?: number) => void;
  clockOut: (attendanceId: string, photoUrl?: string, latitude?: number, longitude?: number) => void;

  // Auth Actions
  login: (username: string, password: string) => Promise<'SUCCESS' | 'PENDING' | 'INVALID'>;
  logout: () => void;
  registerUser: (user: Omit<UserAccount, 'id' | 'createdAt' | 'isActive' | 'isApproved'>) => boolean;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;
  approveUser: (id: string, approverName: string) => void;
  rejectUser: (id: string) => void;

  // PO & Journal Actions
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  deleteJournalEntryByRef: (refId: string) => void;

  // Cart Actions (Admin)
  addToCart: (product: Product, isBox?: boolean, targetNumber?: string) => void;
  removeFromCart: (productId: string, isBox?: boolean) => void;
  updateCartQuantity: (productId: string, quantity: number, isBox?: boolean) => void;
  clearCart: () => void;

  // Customer Portal Actions
  addToCustomerCart: (product: Product) => void;
  removeFromCustomerCart: (productId: string) => void;
  updateCustomerCartQuantity: (productId: string, quantity: number) => void;
  clearCustomerCart: () => void;
  submitOnlineOrder: (customerId: string, customerName: string, customerPhone: string, notes: string, customerAddress?: string, paymentCode?: string, distanceKm?: number, branchId?: string) => void;
  updateOrderStatus: (orderId: string, status: OnlineOrder['status']) => void;
  sendChatMessage: (orderId: string, senderId: string, senderName: string, text: string) => void;
  processOnlineOrderPayment: (orderId: string, paymentMethod: 'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI') => void;
  
  // Transaction Actions
  checkout: (options: {
    paymentMethod: 'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI' | 'KASBON' | 'EWALLET' | 'BANK_LAIN';
    amountPaid: number;
    shippingFee?: number;
    customerId?: string;
    promoId?: string;
    pointsToRedeem?: number;
    splitPayments?: { method: 'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI' | 'EWALLET' | 'BANK_LAIN'; amount: number }[];
    infaqContribution?: number;
  }) => Transaction | null;
  
  // Product/Stock actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  addProductsBulk: (newProds: Omit<Product, 'id'>[]) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  clearProducts: () => void;
  adjustStock: (productId: string, amount: number) => void;
  
  // Zakat Actions
  addZakatRecord: (record: Omit<ZakatCalculation, 'id' | 'timestamp'>) => void;
  addZakatDistribution: (dist: Omit<ZakatDistribution, 'id' | 'timestamp'>) => void;
  
  // Expenses & Closing Actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdBy'>) => void;
  deleteExpense: (id: string) => void;
  addPettyCashDeposit: (amount: number, description: string) => void;
  addClosing: (closing: Omit<ClosingRecord, 'id' | 'timestamp' | 'createdBy'>) => void;
  clearAllData: () => void;

  // Attendance Correction Actions
  requestAttendanceCorrection: (attendanceId: string, correctionType: 'CLOCK_IN' | 'CLOCK_OUT' | 'BOTH', reason: string, requestedClockIn?: string, requestedClockOut?: string) => void;
  reviewAttendanceCorrection: (attendanceId: string, approved: boolean) => void;

  // System Log API
  addLog: (action: string, category: AuditLog['category'], details: string) => void;
  deleteAuditLogs: (startDateStr: string, endDateStr: string) => Promise<void>;
  
  // Supabase Initial Sync
  initializeStore: (options?: { showLoading?: boolean; catalogOnly?: boolean }) => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchStoreSettings: () => Promise<void>;
  fetchOnlineOrders: () => Promise<void>;
  forceSyncAllToCloud: () => Promise<void>;

  // CoA Actions
  coaList: CoaAccount[];
  addCoaAccount: (account: Omit<CoaAccount, 'id'>) => void;
  addCoaAccountsBulk: (accounts: Omit<CoaAccount, 'id'>[]) => void;
  updateCoaAccount: (account: CoaAccount) => void;
  deleteCoaAccount: (id: string) => void;
  clearCoaList: () => void;

  // Feedback Actions
  updateTransactionFeedback: (id: string, rating: 'PUAS' | 'TIDAK_PUAS', feedback?: string) => void;
}

const DEFAULT_COA: CoaAccount[] = [
  { id: 'coa_1', tenantId: 'tenant_default', code: '1-1000', name: 'Kas Tunai Toko', category: 'ASSET', isActive: true },
  { id: 'coa_2', tenantId: 'tenant_default', code: '1-1010', name: 'Bank Syariah Indonesia (BSI)', category: 'ASSET', isActive: true },
  { id: 'coa_3', tenantId: 'tenant_default', code: '1-1020', name: 'QRIS Syariah Dana', category: 'ASSET', isActive: true },
  { id: 'coa_4', tenantId: 'tenant_default', code: '1-1030', name: 'Piutang Kasbon Pelanggan', category: 'ASSET', isActive: true },
  { id: 'coa_5', tenantId: 'tenant_default', code: '1-1040', name: 'Persediaan Barang Dagang', category: 'ASSET', isActive: true },
  { id: 'coa_6', tenantId: 'tenant_default', code: '1-1050', name: 'Saldo Radar Pulsa / Digital', category: 'ASSET', isActive: true },
  { id: 'coa_6', tenantId: 'tenant_default', code: '2-1000', name: 'Utang Dagang ke Supplier', category: 'LIABILITY', isActive: true },
  { id: 'coa_7', tenantId: 'tenant_default', code: '2-1010', name: 'Utang Zakat Niaga Terhutang', category: 'LIABILITY', isActive: true },
  { id: 'coa_8', tenantId: 'tenant_default', code: '3-1000', name: 'Modal Awal KSA Mart', category: 'EQUITY', isActive: true },
  { id: 'coa_9', tenantId: 'tenant_default', code: '4-1000', name: 'Pendapatan Usaha', category: 'REVENUE', isActive: true },
  { id: 'coa_10', tenantId: 'tenant_default', code: '4-1001', name: 'Pendapatan Penjualan', category: 'REVENUE', isActive: true },
  { id: 'coa_11', tenantId: 'tenant_default', code: '4-1010', name: 'Pendapatan Layanan PPOB', category: 'REVENUE', isActive: true },
  { id: 'coa_12', tenantId: 'tenant_default', code: '5-1000', name: 'Beban Pokok Penjualan (HPP)', category: 'EXPENSE', isActive: true },
  { id: 'coa_13', tenantId: 'tenant_default', code: '5-1010', name: 'Beban Pokok Layanan PPOB', category: 'EXPENSE', isActive: true },
  { id: 'coa_14', tenantId: 'tenant_default', code: '5-2000', name: 'Beban Gaji Karyawan', category: 'EXPENSE', isActive: true },
  { id: 'coa_15', tenantId: 'tenant_default', code: '5-2010', name: 'Beban Listrik, Air & Internet', category: 'EXPENSE', isActive: true },
  { id: 'coa_16', tenantId: 'tenant_default', code: '5-2020', name: 'Beban Operasional Lainnya', category: 'EXPENSE', isActive: true }
];

const getSavedCoaList = (): CoaAccount[] => {
  const saved = getStorage('ksa_coa_list');
  if (saved) { 
    try { 
      let parsed = saved as CoaAccount[];
      // Migrate missing PPOB COAs for existing users
      const requiredCodes = ['1-1050', '4-1010', '5-1010'];
      const missing = requiredCodes.filter(code => !parsed.some(c => c.code === code));
      if (missing.length > 0) {
        const toAdd = DEFAULT_COA.filter(c => missing.includes(c.code));
        parsed = [...parsed, ...toAdd];
        // Note: this will only update memory initially, but it will be saved back on next COA modification
      }
      return parsed; 
    } catch (e) {} 
  }
  return DEFAULT_COA;
};

const DEFAULT_PRODUCTS: Product[] = [];

const DEFAULT_TRANSACTIONS: Transaction[] = [];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [];

const DEFAULT_ZAKAT_RECORDS: ZakatCalculation[] = [];

const DEFAULT_ZAKAT_DISTRIBUTIONS: ZakatDistribution[] = [];

const getSavedUsers = (): UserAccount[] => {
  const saved = getStorage('ksa_users');
  if (saved) {
    try {
      const parsed = saved as any[];
      // Force update owner name and credentials for KSA Mart Owner
      const hasOwner = parsed.some((u: any) => u.username === 'owner' || u.id === 'usr_3');
      let updatedUsers = parsed.map((u: any) => {
        if (u.username === 'owner' || u.id === 'usr_3') {
          return { 
            ...u, 
            id: 'usr_3',
            name: 'Dr. Grandis Imama Hendra, S.E.I., M.Sc (Acc), SAS.',
            username: 'owner',
            password: 'owner123',
            role: 'OWNER',
            isActive: true,
            isApproved: true,
            tenantId: 'tenant_default'
          };
        }
        return u;
      });
      if (!hasOwner) {
        updatedUsers.push({
          id: 'usr_3',
          tenantId: 'tenant_default',
          name: 'Dr. Grandis Imama Hendra, S.E.I., M.Sc (Acc), SAS.',
          username: 'owner',
          password: 'owner123',
          role: 'OWNER',
          createdAt: new Date().toISOString(),
          isActive: true,
          isApproved: true
        });
      }
      return updatedUsers;
    } catch (e) {}
  }
  return [
    { id: 'usr_0', tenantId: '', name: 'Platform Admin', username: 'superadmin.platform', password: 'superadmin123!', role: 'SUPERADMIN', createdAt: new Date().toISOString(), isActive: true, isApproved: true },
    { id: 'usr_1', tenantId: 'tenant_default', name: 'Kasir KSA Mart', username: 'kasir.ksamart', password: 'kasir123!', role: 'CASHIER', createdAt: new Date().toISOString(), isActive: true, isApproved: true },
    { id: 'usr_2', tenantId: 'tenant_default', name: 'Admin KSA Mart', username: 'admin.ksamart', password: 'admin123!', role: 'ADMIN', createdAt: new Date().toISOString(), isActive: true, isApproved: true },
    { id: 'usr_3', tenantId: 'tenant_default', name: 'Dr. Grandis Imama Hendra, S.E.I., M.Sc (Acc), SAS.', username: 'owner', password: 'owner123', role: 'OWNER', createdAt: new Date().toISOString(), isActive: true, isApproved: true },
    { id: 'usr_4', tenantId: 'tenant_default', name: 'Pelanggan Demo', username: 'pelanggan1', password: 'password123', role: 'PELANGGAN', createdAt: new Date().toISOString(), isActive: true, isApproved: true }
  ];
};

const getSavedPurchaseOrders = (): PurchaseOrder[] => {
  const saved = getStorage('ksa_purchase_orders');
  if (saved) { try { return saved as PurchaseOrder[]; } catch (e) {} }
  return [];
};

const getSavedJournalEntries = (): JournalEntry[] => {
  const saved = getStorage('ksa_journal_entries');
  if (saved) { try { return saved as JournalEntry[]; } catch (e) {} }
  return [];
};

const getSavedExpenses = (): Expense[] => {
  const saved = getStorage('ksa_expenses');
  if (saved) { try { return saved as Expense[]; } catch (e) {} }
  return [];
};

const getSavedClosings = (): ClosingRecord[] => {
  const saved = getStorage('ksa_closings');
  if (saved) { try { return saved as ClosingRecord[]; } catch (e) {} }
  return [];
};

const getSavedProducts = (): Product[] => {
  const saved = getStorage('ksa_products');
  if (saved) {
    try {
      const parsed = saved as any[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as Product[];
    } catch (e) {}
  }
  return DEFAULT_PRODUCTS;
};

const getSavedTransactions = (): Transaction[] => {
  const saved = getStorage('ksa_transactions');
  if (saved) {
    try {
      const parsed = saved as any[];
      if (Array.isArray(parsed)) return parsed as Transaction[];
    } catch (e) {}
  }
  return DEFAULT_TRANSACTIONS;
};

const getSavedAuditLogs = (): AuditLog[] => {
  const saved = getStorage('ksa_audit_logs');
  if (saved) {
    try {
      const parsed = saved as any[];
      if (Array.isArray(parsed)) return parsed as AuditLog[];
    } catch (e) {}
  }
  return DEFAULT_AUDIT_LOGS;
};

const getSavedZakatRecords = (): ZakatCalculation[] => {
  const saved = getStorage('ksa_zakat_records');
  if (saved) {
    try {
      const parsed = saved as any[];
      if (Array.isArray(parsed)) return parsed as ZakatCalculation[];
    } catch (e) {}
  }
  return DEFAULT_ZAKAT_RECORDS;
};

const getSavedZakatDistributions = (): ZakatDistribution[] => {
  const saved = getStorage('ksa_zakat_distributions');
  if (saved) {
    try {
      const parsed = saved as any[];
      if (Array.isArray(parsed)) return parsed as ZakatDistribution[];
    } catch (e) {}
  }
  return DEFAULT_ZAKAT_DISTRIBUTIONS;
};

const getSavedBranches = (): Branch[] => {
  const saved = getStorage('ksa_branches');
  if (saved) { try { const parsed = saved as any[]; if (Array.isArray(parsed)) return parsed as Branch[]; } catch (e) {} }
  return [
    { id: 'br_1', tenantId: 'tenant_default', name: 'KSA Mart Pusat', address: 'Koperasi Syariah ADZ-ZIKRA', phone: '08123456789', whatsapp: '628123456789', isActive: true, createdAt: new Date().toISOString() }
  ];
};

const getSavedCategories = (tenantId?: string): string[] => {
  const saved = getStorage('ksa_product_categories', tenantId);
  if (saved) {
    try {
      const parsed = saved as any[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const dummyList = ['Sembako', 'Fresh Food', 'Minuman', 'Kebutuhan Rumah', 'Alat Listrik', 'Perkakas', 'Bahan Bangunan', 'Alat Tulis & Kantor', 'Elektronik', 'Pakaian', 'Kesehatan', 'Mainan', 'Lainnya'];
        const filtered = parsed
          .map((item) => String(item).trim())
          .filter((item) => item.length > 0 && !dummyList.includes(item));
        return filtered;
      }
    } catch (e) {}
  }
  return [];
};

const getSavedCustomers = (): Customer[] => {
  const saved = getStorage('ksa_customers');
  if (saved) { try { return saved as Customer[]; } catch (e) {} }
  return [];
};

const getSavedSuppliers = (): Supplier[] => {
  const saved = getStorage('ksa_suppliers');
  if (saved) { try { return saved as Supplier[]; } catch (e) {} }
  return [];
};

const getSavedPromos = (): Promo[] => {
  const saved = getStorage('ksa_promos');
  if (saved) { try { return saved as Promo[]; } catch (e) {} }
  return [];
};

const getSavedAttendances = (): Attendance[] => {
  const saved = getStorage('ksa_attendances');
  if (saved) { try { return saved as Attendance[]; } catch (e) {} }
  return [];
};

const getSavedSettings = (): StoreSettings => {
  const saved = getStorage('ksa_settings');
  if (saved) { try { return saved as StoreSettings; } catch (e) {} }
  return { 
    tenantId: 'tenant_default',
    isTaxEnabled: false, 
    taxRate: 11,
    ownerBankName: 'BSI (Bank Syariah Indonesia)',
    ownerBankAccount: '7182938495',
    qrisEnabled: true,
    businessType: 'KOPERASI',
    ownerWhatsapp: '085881893650',
    maxDeliveryRadiusKm: 5
  };
};

const getSavedStockMovements = (): StockMovement[] => {
  const saved = getStorage('ksa_stock_movements');
  if (saved) { try { return saved as StockMovement[]; } catch (e) {} }
  return [];
};

const getSavedOnlineOrders = (): OnlineOrder[] => {
  const saved = getStorage('ksa_online_orders');
  if (saved) { try { return saved as OnlineOrder[]; } catch (e) {} }
  return [];
};

const getSavedChatMessages = (): ChatMessage[] => {
  const saved = getStorage('ksa_chat_messages');
  if (saved) { try { return saved as ChatMessage[]; } catch (e) {} }
  return [];
};

export const useAppStore = create<AppState>((set, get) => ({
  isDarkMode: localStorage.getItem('ksa_dark_mode') === 'true',
  toggleDarkMode: () => {
    const newVal = !get().isDarkMode;
    set({ isDarkMode: newVal });
    localStorage.setItem('ksa_dark_mode', String(newVal));
  },
  tenants: (() => {
    const saved = localStorage.getItem('ksa_tenants');
    const parsed = saved ? JSON.parse(saved) : [];
    
    // Force update owner name in default tenant for Dr. Grandis
    const withUpdatedOwner = parsed.map((t: any) => {
      if (t.id === 'tenant_default') {
        return { ...t, ownerName: 'Dr. Grandis Imama Hendra, S.E.I., M.Sc (Acc), SAS.' };
      }
      return t;
    });

    // Ensure default tenant always exists for demo data
    if (!withUpdatedOwner.find((t: any) => t.id === 'tenant_default')) {
      const defaultTenant = {
        id: 'tenant_default',
        name: 'KSA Mart Syariah',
        ownerName: 'Dr. Grandis Imama Hendra, S.E.I., M.Sc (Acc), SAS.',
        email: 'owner.23kk',
        phone: '081234567890',
        address: 'Jl. Contoh No.1, Jakarta',
        businessType: 'KOPERASI' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString()
      };
      withUpdatedOwner.unshift(defaultTenant);
      localStorage.setItem('ksa_tenants', JSON.stringify(withUpdatedOwner));
    }
    return withUpdatedOwner;
  })(),
  products: getStorage('ksa_products') || [],
  cart: getStorage('ksa_cart') || [],
  lastTransactionId: getStorage('ksa_last_transaction') || null,
  customerCart: [], 
  onlineOrders: getSavedOnlineOrders(),
  chatMessages: getSavedChatMessages(),
  auditLogs: getSavedAuditLogs(),
  zakatRecords: getSavedZakatRecords(),
  zakatDistributions: getSavedZakatDistributions(),
  currentUser: (() => {
    const saved = localStorage.getItem('ksa_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          tenantId: parsed.tenantId || 'tenant_default'
        };
      } catch(e) {}
    }
    return null;
  })(),
  isLoading: false,
  expenses: getSavedExpenses(),
  closings: getSavedClosings(),
  users: getSavedUsers(),
  purchaseOrders: getSavedPurchaseOrders(),
  journalEntries: getSavedJournalEntries(),
  branches: getSavedBranches(),
  categories: (() => {
    const savedUser = localStorage.getItem('ksa_current_user');
    let tenantId = 'tenant_default';
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        tenantId = parsed.tenantId || tenantId;
      } catch (e) {}
    }
    return getSavedCategories(tenantId);
  })(),
  addCategory: (category: string) => {
    if (!category || typeof category !== 'string') return;
    const normalized = category.trim();
    if (!normalized) return;
    const currentCategories = get().categories || [];
    const nextCategories = Array.from(new Set([...currentCategories.map((c) => c.trim()), normalized]));
    set({ categories: nextCategories });
    saveStorage('ksa_product_categories', nextCategories, get().currentUser?.tenantId);
  },
  removeCategory: (category: string) => {
    if (!category || typeof category !== 'string') return;
    const normalized = category.trim();
    const currentCategories = get().categories || [];
    const nextCategories = currentCategories.filter((c) => c !== normalized);
    set({ categories: nextCategories });
    saveStorage('ksa_product_categories', nextCategories, get().currentUser?.tenantId);
  },
  setCategories: (categories: string[]) => {
    const nextCategories = Array.from(new Set(categories.map((c) => String(c).trim()).filter((c) => c.length > 0)));
    set({ categories: nextCategories });
    saveStorage('ksa_product_categories', nextCategories, get().currentUser?.tenantId);
  },
  customers: getSavedCustomers(),
  suppliers: getSavedSuppliers(),
  promos: getSavedPromos(),
  attendances: getSavedAttendances(),
  settings: getStorage('ksa_settings', undefined) || {
    tenantId: 'tenant_default',
    isTaxEnabled: true,
    taxRate: 11,
    qrisEnabled: true,
    qrisImageUrl: '',
    storeName: 'KSA Mart Syariah',
    businessType: 'UMUM',
    maintenanceMode: false,
    minimumCashBalance: 1000000,
    zakatRate: 2.5,
    autoApproveTransactions: false,
  },
  stockMovements: getStorage('ksa_stock_movements', undefined) || [],
  activeBranchId: '', // Default to global view initially
  notifications: getStorage('ksa_notifications', undefined) || [],
  coaList: getSavedCoaList(),

  // Cross-tab sync: update in-memory state when localStorage changes in other tabs
  // This allows uploads/imports in one tab to reflect in other open tabs without full reload.
  // We attach listener once when store is created.
  // Note: guard for browser environment
  ...(typeof window !== 'undefined' ? (() => {
    try {
      window.addEventListener('storage', (e: StorageEvent) => {
        try {
          if (!e.key) return;
          const tenant = get().currentUser?.tenantId;
          const keysToSync = ['ksa_products', 'ksa_customers', 'ksa_coa_list', 'ksa_transactions', 'ksa_users', 'ksa_product_categories', 'ksa_cart', 'ksa_last_transaction', 'ksa_journal_entries', 'ksa_expenses', 'ksa_zakat_records'];
          for (const k of keysToSync) {
            if (e.key === k || (tenant && e.key === `${k}__${tenant}`)) {
              const parsed = e.newValue ? JSON.parse(e.newValue) : (k === 'ksa_last_transaction' ? null : []);
              if (k === 'ksa_products') set({ products: parsed });
              if (k === 'ksa_customers') set({ customers: parsed });
              if (k === 'ksa_coa_list') set({ coaList: parsed });
              if (k === 'ksa_transactions') set({ transactions: parsed });
              if (k === 'ksa_users') set({ users: parsed });
              if (k === 'ksa_product_categories') set({ categories: parsed });
              if (k === 'ksa_cart') set({ cart: parsed });
              if (k === 'ksa_last_transaction') set({ lastTransactionId: parsed });
              if (k === 'ksa_journal_entries') set({ journalEntries: parsed });
              if (k === 'ksa_expenses') set({ expenses: parsed });
              if (k === 'ksa_zakat_records') set({ zakatRecords: parsed });
            }
          }
        } catch (err) {}
      });
    } catch (e) {}
    return {} as any;
  })() : {}),

  // Branch implementations
  setActiveBranchId: (branchId) => set({ activeBranchId: branchId }),

  // CoA Actions
  addCoaAccount: (accountData) => {
    const { currentUser } = get();
    const newAccount: CoaAccount = {
      ...accountData,
      id: `coa_${Date.now()}`,
      tenantId: currentUser?.tenantId || 'tenant_default',
      isActive: true
    };
    const updated = [...get().coaList, newAccount];
    set({ coaList: updated });
    saveStorage('ksa_coa_list', updated);
    get().addLog('COA_ADD', 'FINANCE', `Menambah akun CoA baru: ${newAccount.code} - ${newAccount.name}`);
    
    if (isSupabaseConfigured) {
      supabaseService.saveCoaAccount(newAccount);
    }
  },

  addCoaAccountsBulk: (accounts) => {
    const { currentUser } = get();
    const startId = Date.now();
    const newAccounts = accounts.map((acc, idx) => ({
      ...acc,
      id: `coa_${startId}_${idx}`,
      tenantId: currentUser?.tenantId || 'tenant_default',
      isActive: acc.isActive ?? true
    }));
    const updated = [...get().coaList, ...newAccounts];
    set({ coaList: updated });
    saveStorage('ksa_coa_list', updated);
    get().addLog('COA_IMPORT', 'FINANCE', `Mengimpor ${newAccounts.length} akun CoA baru`);
    
    if (isSupabaseConfigured) {
      (supabaseService as any).saveCoaAccountsBulk(newAccounts);
    }
  },

  updateCoaAccount: (updatedAccount) => {
    const { currentUser } = get();
    const updated = get().coaList.map(c => c.id === updatedAccount.id ? updatedAccount : c);
    set({ coaList: updated });
    saveStorage('ksa_coa_list', updated);
    get().addLog('COA_UPDATE', 'FINANCE', `Mengubah akun CoA: ${updatedAccount.code} - ${updatedAccount.name}`);
    
    if (isSupabaseConfigured) {
      supabaseService.saveCoaAccount(updatedAccount);
    }
  },

  clearCoaList: () => {
    set({ coaList: [] });
    saveStorage('ksa_coa_list', [], get().currentUser?.tenantId);
  },

  deleteCoaAccount: (id) => {
    const account = get().coaList.find(c => c.id === id);
    if (!account) return;
    const updated = get().coaList.filter(c => c.id !== id);
    set({ coaList: updated });
    saveStorage('ksa_coa_list', updated);
    get().addLog('COA_DELETE', 'FINANCE', `Menghapus akun CoA permanen: ${account.code} - ${account.name}`);
    
    if (isSupabaseConfigured) {
      supabaseService.deleteCoaAccount(id);
    }
  },

  // Settings
  updateSettings: (updates) => {
    const updated = { ...get().settings, ...updates };
    set({ settings: updated });
    saveStorage('ksa_settings', updated, get().currentUser?.tenantId);
    get().addLog('SETTINGS_UPDATE', 'SYSTEM', 'Update pengaturan toko (Pajak)');
    
    if (isSupabaseConfigured) {
      supabaseService.saveStoreSettings(updated);
    }
  },

  // Stock Movements
  addStockMovement: (movement) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const newMovement: StockMovement = {
      ...movement,
      id: `sm_${Date.now()}`,
      date: new Date().toISOString(),
      userId: currentUser.username
    };
    const updated = [newMovement, ...get().stockMovements];
    set({ stockMovements: updated });
    saveStorage('ksa_stock_movements', updated, get().currentUser?.tenantId);
  },

  // Notifications
  addNotification: (notif) => {
    const newNotif = {
      ...notif,
      id: `notif_${Date.now()}`,
      tenantId: get().currentUser?.tenantId || 'tenant_default',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newNotif, ...get().notifications];
    set({ notifications: updated });
    saveStorage('ksa_notifications', updated, get().currentUser?.tenantId);
  },

  markNotificationAsRead: (id) => {
    const updated = get().notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    set({ notifications: updated });
    saveStorage('ksa_notifications', updated, get().currentUser?.tenantId);
  },

  // Void
  requestVoidTransaction: (txId, reason) => {
    const { transactions, currentUser } = get();
    if (!currentUser) return;
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.isVoided || tx.voidStatus === 'PENDING') return;

    const updatedTx = { ...tx, voidStatus: 'PENDING' as const, voidReason: reason, voidRequestedBy: currentUser.name };
    const updatedTransactions = transactions.map(t => t.id === txId ? updatedTx : t);
    
    set({ transactions: updatedTransactions });
    saveStorage('ksa_transactions', updatedTransactions, currentUser.tenantId);
    get().addLog('TRANSACTION_VOID_REQUEST', 'POS', `Pengajuan void transaksi ${tx.invoiceNo}: ${reason}`);

    get().addNotification({
      title: 'Pengajuan Void Transaksi',
      message: `${currentUser.name} mengajukan pembatalan untuk transaksi ${tx.invoiceNo}.`,
      type: 'APPROVAL',
      targetRole: ['MANAGER', 'OWNER', 'SUPERADMIN'],
      branchId: tx.branchId,
      link: '/kasir-riwayat'
    });
  },

  updateTransactionFeedback: (id: string, rating: 'PUAS' | 'TIDAK_PUAS', feedback?: string) => {
    const { transactions, currentUser } = get();
    const updated = transactions.map(t => 
      t.id === id ? { ...t, customerRating: rating, customerFeedback: feedback } : t
    );
    set({ transactions: updated });
    saveStorage('ksa_transactions', updated, currentUser?.tenantId);
    
    // Sync to Supabase in background
    runSupabaseTask('Update Feedback', async () => {
      const tx = updated.find(t => t.id === id);
      if (tx) {
        await (supabaseService as any).saveTransaction(tx);
      }
    }, () => {}).catch(() => {});
  },

  approveVoidTransaction: (txId, isApproved) => {
    const { transactions, currentUser, products, journalEntries } = get();
    if (!currentUser) return;
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.isVoided || tx.voidStatus !== 'PENDING') return;

    if (!isApproved) {
      const updatedTx = { ...tx, voidStatus: 'REJECTED' as const };
      const updatedTransactions = transactions.map(t => t.id === txId ? updatedTx : t);
      set({ transactions: updatedTransactions });
      saveStorage('ksa_transactions', updatedTransactions, currentUser.tenantId);
      get().addLog('TRANSACTION_VOID_REJECT', 'POS', `Penolakan void transaksi ${tx.invoiceNo} oleh ${currentUser.name}`);
      return;
    }

    // 1. Mark as voided
    const updatedTx = { ...tx, isVoided: true, voidStatus: 'APPROVED' as const };
    const updatedTransactions = transactions.map(t => t.id === txId ? updatedTx : t);

    // 2. Rollback stocks
    let updatedProducts = [...products];
    tx.items.forEach(item => {
      const prod = updatedProducts.find(p => p.id === item.productId);
      if (prod) {
        if (!prod.isPPOB) {
          prod.stock += item.quantity;
          get().addStockMovement({
            tenantId: currentUser.tenantId || 'tenant_default',
            productId: item.productId,
            type: 'IN',
            qty: item.quantity,
            reason: `VOID APPROVED: ${tx.invoiceNo}`,
            branchId: tx.branchId
          });
        }
      }
    });

    // 3. Rollback journal (Create reversing entries)
    const now = new Date().toISOString();
    const jId = `je_void_${Date.now()}`;
    const reversingJournals: import('../types').JournalEntry[] = [];
    
    // Find all journals related to this tx
    const relatedJournals = journalEntries.filter(j => j.referenceId === tx.id);
    relatedJournals.forEach((j, i) => {
      reversingJournals.push({
        id: `${jId}_${i}`,
        tenantId: currentUser.tenantId || 'tenant_default',
        date: now,
        account: j.account,
        description: `[Auto] VOID Reversal: ${j.description}`,
        debit: j.credit, // swap debit/credit
        credit: j.debit,
        referenceId: tx.id,
        referenceType: 'AUTO_TRANSAKSI',
        createdBy: currentUser.name,
        branchId: tx.branchId
      });
    });

    const updatedJournals = [...reversingJournals, ...journalEntries];

    set({
      transactions: updatedTransactions,
      products: updatedProducts,
      journalEntries: updatedJournals
    });

    saveStorage('ksa_transactions', updatedTransactions, get().currentUser?.tenantId);
    saveStorage('ksa_products', updatedProducts, get().currentUser?.tenantId);
    saveStorage('ksa_journal_entries', updatedJournals, get().currentUser?.tenantId);

    get().addLog('TRANSACTION_VOID_APPROVED', 'POS', `Void transaksi ${tx.invoiceNo} disetujui oleh ${currentUser.name}`);
  },

  addBranch: (branchData) => {
    const newBranch: Branch = {
      ...branchData,
      id: `br_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [...get().branches, newBranch];
    set({ branches: updated });
    saveStorage('ksa_branches', updated, get().currentUser?.tenantId);
    get().addLog('BRANCH_ADD', 'SYSTEM', `Menambah cabang baru: ${newBranch.name}`);
    if (isSupabaseConfigured) {
      (supabaseService as any).saveBranch(newBranch);
    }
  },

  updateBranch: (id, updates) => {
    const updated = get().branches.map(b => b.id === id ? { ...b, ...updates } : b);
    set({ branches: updated });
    saveStorage('ksa_branches', updated, get().currentUser?.tenantId);
    get().addLog('BRANCH_UPDATE', 'SYSTEM', `Update data cabang: ${updated.find(b => b.id === id)?.name}`);
    if (isSupabaseConfigured) {
      const branchToUpdate = updated.find(b => b.id === id);
      if (branchToUpdate) (supabaseService as any).saveBranch(branchToUpdate);
    }
  },

  deleteBranch: (id) => {
    const branch = get().branches.find(b => b.id === id);
    const updated = get().branches.filter(b => b.id !== id);
    set({ branches: updated });
    saveStorage('ksa_branches', updated, get().currentUser?.tenantId);
    if (branch) {
      get().addLog('BRANCH_DELETE', 'SYSTEM', `Menghapus cabang: ${branch.name}`);
    }
    if (isSupabaseConfigured) {
      (supabaseService as any).deleteBranch(id);
    }
  },

  // CRM & Supplier
  addCustomer: (customerData) => {
    const newCustomer: Customer = {
      ...customerData,
      id: customerData.id || `cust_${Date.now()}`,
      createdAt: new Date().toISOString(),
      branchId: customerData.branchId || get().currentUser?.branchId
    };
    const updated = [...get().customers, newCustomer];
    set({ customers: updated });
    saveStorage('ksa_customers', updated, get().currentUser?.tenantId);
    get().addLog('CUSTOMER_ADD', 'SYSTEM', `Menambah pelanggan: ${newCustomer.name}`);
    if (isSupabaseConfigured) supabaseService.saveCustomer(newCustomer);
  },
  updateCustomer: (id, updates) => {
    const updated = get().customers.map(c => c.id === id ? { ...c, ...updates } : c);
    set({ customers: updated });
    saveStorage('ksa_customers', updated, get().currentUser?.tenantId);
    get().addLog('CUSTOMER_UPDATE', 'SYSTEM', `Update pelanggan ID: ${id}`);
    const cust = updated.find(c => c.id === id);
    if (cust && isSupabaseConfigured) supabaseService.saveCustomer(cust);
  },
  deleteCustomer: (id) => {
    const updated = get().customers.filter(c => c.id !== id);
    set({ customers: updated });
    saveStorage('ksa_customers', updated, get().currentUser?.tenantId);
    get().addLog('CUSTOMER_DELETE', 'SYSTEM', `Menghapus pelanggan ID: ${id}`);
  },

  addSupplier: (supplierData) => {
    const newSupplier: Supplier = { ...supplierData, id: `sup_${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [...get().suppliers, newSupplier];
    set({ suppliers: updated });
    saveStorage('ksa_suppliers', updated, get().currentUser?.tenantId);
    get().addLog('SUPPLIER_ADD', 'SYSTEM', `Menambah supplier: ${newSupplier.name}`);
    
    if (isSupabaseConfigured) {
      (supabaseService as any).saveSupplier(newSupplier);
    }
  },
  updateSupplier: (id, updates) => {
    const updated = get().suppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    set({ suppliers: updated });
    saveStorage('ksa_suppliers', updated, get().currentUser?.tenantId);
    get().addLog('SUPPLIER_UPDATE', 'SYSTEM', `Update supplier ID: ${id}`);

    if (isSupabaseConfigured) {
      const updatedSupplier = updated.find(s => s.id === id);
      if (updatedSupplier) (supabaseService as any).saveSupplier(updatedSupplier);
    }
  },
  deleteSupplier: (id) => {
    const updated = get().suppliers.filter(s => s.id !== id);
    set({ suppliers: updated });
    saveStorage('ksa_suppliers', updated, get().currentUser?.tenantId);
    get().addLog('SUPPLIER_DELETE', 'SYSTEM', `Menghapus supplier ID: ${id}`);

    if (isSupabaseConfigured) {
      (supabaseService as any).deleteSupplier(id);
    }
  },

  // Promos
  addPromo: (promoData) => {
    const newPromo: Promo = { ...promoData, id: `prm_${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [...get().promos, newPromo];
    set({ promos: updated });
    saveStorage('ksa_promos', updated, get().currentUser?.tenantId);
    get().addLog('PROMO_ADD', 'SYSTEM', `Menambah promo: ${newPromo.name}`);
  },
  updatePromo: (id, updates) => {
    const updated = get().promos.map(p => p.id === id ? { ...p, ...updates } : p);
    set({ promos: updated });
    saveStorage('ksa_promos', updated, get().currentUser?.tenantId);
    get().addLog('PROMO_UPDATE', 'SYSTEM', `Update promo ID: ${id}`);
  },
  deletePromo: (id) => {
    const updated = get().promos.filter(p => p.id !== id);
    set({ promos: updated });
    saveStorage('ksa_promos', updated, get().currentUser?.tenantId);
    get().addLog('PROMO_DELETE', 'SYSTEM', `Menghapus promo ID: ${id}`);
  },

  // Attendance
  clockIn: (userId, userName, photoUrl, latitude, longitude) => {
    const newAtt: Attendance = {
      id: `att_${Date.now()}`,
      tenantId: get().currentUser?.tenantId || 'tenant_default',
      userId,
      userName,
      date: new Date().toISOString().split('T')[0],
      clockIn: new Date().toISOString(),
      status: 'PRESENT',
      photoUrl,
      latitude,
      longitude
    };
    const updated = [newAtt, ...get().attendances];
    set({ attendances: updated });
    saveStorage('ksa_attendances', updated, get().currentUser?.tenantId);
    if (isSupabaseConfigured) {
      supabaseService.saveAttendance(newAtt);
    }
    get().addLog('ATTENDANCE', 'SYSTEM', `${userName} Clock-In Shift`);
  },
  clockOut: (attendanceId, photoUrl, latitude, longitude) => {
    const updated = get().attendances.map(a => 
      a.id === attendanceId ? { ...a, clockOut: new Date().toISOString(), clockOutPhotoUrl: photoUrl, clockOutLatitude: latitude, clockOutLongitude: longitude } : a
    );
    set({ attendances: updated });
    saveStorage('ksa_attendances', updated, get().currentUser?.tenantId);
    const modifiedAtt = updated.find(a => a.id === attendanceId);
    if (isSupabaseConfigured && modifiedAtt) {
      supabaseService.saveAttendance(modifiedAtt);
    }
    get().addLog('ATTENDANCE', 'SYSTEM', `Selesai Shift (Clock-Out) ID: ${attendanceId}`);
  },

  requestAttendanceCorrection: (attendanceId, correctionType, reason, requestedClockIn, requestedClockOut) => {
    const updated = get().attendances.map(a =>
      a.id === attendanceId
        ? { ...a, correctionStatus: 'PENDING' as const, correctionReason: reason, correctionType, requestedClockIn, requestedClockOut }
        : a
    );
    set({ attendances: updated });
    saveStorage('ksa_attendances', updated, get().currentUser?.tenantId);
    const modifiedAtt = updated.find(a => a.id === attendanceId);
    if (isSupabaseConfigured && modifiedAtt) {
      supabaseService.saveAttendance(modifiedAtt);
    }
    get().addLog('ATTENDANCE', 'SYSTEM', `Permohonan koreksi absen diajukan untuk ID: ${attendanceId}`);
  },

  reviewAttendanceCorrection: (attendanceId, approved) => {
    const updated = get().attendances.map(a => {
      if (a.id !== attendanceId) return a;
      if (!approved) {
        return { ...a, correctionStatus: 'REJECTED' as const };
      }
      // Apply the requested corrections
      const patch: Partial<typeof a> = { correctionStatus: 'APPROVED' as const, isRevised: true };
      if (a.correctionType === 'CLOCK_IN' || a.correctionType === 'BOTH') {
        if (a.requestedClockIn) patch.clockIn = a.requestedClockIn;
      }
      if (a.correctionType === 'CLOCK_OUT' || a.correctionType === 'BOTH') {
        if (a.requestedClockOut) patch.clockOut = a.requestedClockOut;
      }
      return { ...a, ...patch };
    });
    set({ attendances: updated });
    saveStorage('ksa_attendances', updated, get().currentUser?.tenantId);
    const modifiedAtt = updated.find(a => a.id === attendanceId);
    if (isSupabaseConfigured && modifiedAtt) {
      supabaseService.saveAttendance(modifiedAtt);
    }
    get().addLog('ATTENDANCE', 'SYSTEM', `Koreksi absen ${approved ? 'DISETUJUI' : 'DITOLAK'} untuk ID: ${attendanceId}`);
  },

  // Authentication logic
  
  registerTenant: (tenantData) => {
    const newTenant: import('../types').Tenant = {
      ...tenantData,
      id: `tenant_${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    const updatedTenants = [...get().tenants, newTenant];
    set({ tenants: updatedTenants });
    saveStorage('ksa_tenants', updatedTenants);
  },

  approveTenant: (tenantId) => {
    const tenants = get().tenants;
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    tenant.status = 'ACTIVE';
    set({ tenants: [...tenants] });
    saveStorage('ksa_tenants', get().tenants);

    // Create owner account
    const ownerAccount: import('../types').UserAccount = {
      id: `user_${Date.now()}`,
      tenantId,
      name: tenant.ownerName,
      username: tenant.email,
      password: 'password123',
      role: 'OWNER',
      createdAt: new Date().toISOString(),
      isActive: true,
      isApproved: true
    };
    
    const users = getStorage('ksa_users') || [];
    users.push(ownerAccount);
    saveStorage('ksa_users', users);
  },

  loadTenantData: (tenantId) => {
    // Load tenant-scoped data with sensible defaults, and persist seed if missing
    const settingsSaved = getStorage('ksa_settings', tenantId) as StoreSettings | null;
    const stockMovementsSaved = getStorage('ksa_stock_movements', tenantId) as StockMovement[] | null;
    const transactionsSaved = getStorage('ksa_transactions', tenantId) as Transaction[] | null;
    const productsSaved = getStorage('ksa_products', tenantId) as Product[] | null;
    const categoriesSaved = getStorage('ksa_product_categories', tenantId) as string[] | null;
    const journalSaved = getStorage('ksa_journal_entries', tenantId) as JournalEntry[] | null;
    const branchesSaved = getStorage('ksa_branches', tenantId) as Branch[] | null;
    const customersSaved = getStorage('ksa_customers', tenantId) as Customer[] | null;
    const suppliersSaved = getStorage('ksa_suppliers', tenantId) as Supplier[] | null;
    const promosSaved = getStorage('ksa_promos', tenantId) as Promo[] | null;
    const attendancesSaved = getStorage('ksa_attendances', tenantId) as Attendance[] | null;
    const onlineOrdersSaved = getStorage('ksa_online_orders', tenantId) as OnlineOrder[] | null;
    const chatSaved = getStorage('ksa_chat_messages', tenantId) as ChatMessage[] | null;
    const zakatSaved = getStorage('ksa_zakat_records', tenantId) as ZakatCalculation[] | null;
    const zakatDistSaved = getStorage('ksa_zakat_distributions', tenantId) as ZakatDistribution[] | null;
    const purchaseOrdersSaved = getStorage('ksa_purchase_orders', tenantId) as PurchaseOrder[] | null;
    const expensesSaved = getStorage('ksa_expenses', tenantId) as Expense[] | null;
    const closingsSaved = getStorage('ksa_closings', tenantId) as ClosingRecord[] | null;
    const auditSaved = getStorage('ksa_audit_logs', tenantId) as AuditLog[] | null;

    const defaultSettings: StoreSettings = settingsSaved || { tenantId, isTaxEnabled: false, taxRate: 11, businessType: 'KOPERASI', ownerWhatsapp: '', qrisEnabled: true, maxDeliveryRadiusKm: 5, storeName: '', storeAddress: '', storePhone: '' };

    const migratedTransactions = (transactionsSaved || []).map((t: any) => {
      let pm = t.paymentMethod;
      if (pm === 'TEMPO') pm = 'KASBON';
      if (pm === 'QRIS') pm = 'QRIS_SHARIAH';
      if (pm === 'TRANSFER') pm = 'TRANSFER_BSI';
      return { ...t, paymentMethod: pm };
    });

    set({
      settings: defaultSettings,
      stockMovements: stockMovementsSaved || [],
      transactions: migratedTransactions,
      products: productsSaved || [],
      journalEntries: journalSaved || [],
      branches: branchesSaved || [],
      categories: categoriesSaved || getSavedCategories(tenantId),
      customers: customersSaved || [],
      suppliers: suppliersSaved || [],
      promos: promosSaved || [],
      attendances: attendancesSaved || [],
      onlineOrders: onlineOrdersSaved || [],
      chatMessages: chatSaved || [],
      zakatRecords: zakatSaved || [],
      zakatDistributions: zakatDistSaved || [],
      purchaseOrders: purchaseOrdersSaved || [],
      expenses: expensesSaved || [],
      closings: closingsSaved || [],
      auditLogs: auditSaved || []
    });

    // Persist seed defaults when nothing existed
    if (!settingsSaved) saveStorage('ksa_settings', defaultSettings, tenantId);
    if (!branchesSaved || (branchesSaved && branchesSaved.length === 0)) saveStorage('ksa_branches', branchesSaved && branchesSaved.length > 0 ? branchesSaved : [{ id: `br_${Date.now()}`, tenantId, name: 'Cabang Utama', address: '', phone: '', isActive: true, createdAt: new Date().toISOString() }], tenantId);
    if (!categoriesSaved) saveStorage('ksa_product_categories', getSavedCategories(tenantId), tenantId);
    if (!productsSaved) saveStorage('ksa_products', [], tenantId);
    if (!transactionsSaved) saveStorage('ksa_transactions', [], tenantId);
    if (!customersSaved) saveStorage('ksa_customers', [], tenantId);
    if (!suppliersSaved) saveStorage('ksa_suppliers', [], tenantId);
    if (!promosSaved) saveStorage('ksa_promos', [], tenantId);
    if (!auditSaved) saveStorage('ksa_audit_logs', [], tenantId);
  },

  login: async (username, password) => {
    let { users } = get();
    let foundUser = users.find(u => u.username === username && u.password === password && u.isActive);

    if (!foundUser && isSupabaseConfigured) {
      // Fetch users dynamically for new devices that haven't synced yet
      const remoteUsers = await supabaseService.getUsers();
      if (remoteUsers) {
        const defaultUsers = getStorage('ksa_users') || [];
        const merged = [...remoteUsers];
        defaultUsers.forEach((du: any) => {
          if (!merged.some(ru => ru.username === du.username)) {
            merged.push(du);
            supabaseService.saveUser(du);
          }
        });
        set({ users: merged });
        saveStorage('ksa_users', merged);
        foundUser = merged.find(u => u.username === username && u.password === password && u.isActive);
      }
    }

    if (!foundUser) return 'INVALID';
    if (!foundUser.isApproved) return 'PENDING';

    const authUser: CurrentUser = { 
      name: foundUser.name, 
      username: foundUser.username, 
      role: foundUser.role, 
      branchId: foundUser.branchId,
      tenantId: foundUser.tenantId || 'tenant_default',
      phone: foundUser.phone || ''
    };
    
    // Set user and CLEAR customerCart so it doesn't leak between sessions
    set({ currentUser: authUser, activeBranchId: foundUser.branchId || '', customerCart: [] });

    // If not SUPERADMIN, load tenant-specific data
    const authTenantId = foundUser.tenantId || 'tenant_default';
    if (foundUser.role !== 'SUPERADMIN') {
      get().loadTenantData(authTenantId);
    }
    
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      tenantId: authUser.tenantId || 'tenant_default',
      timestamp: new Date().toISOString(),
      user: authUser.name,
      action: 'LOGIN',
      category: 'SYSTEM',
      details: `LOGIN Sukses: ${authUser.name} (${authUser.role})`,
      ipAddress: '192.168.1.15'
    };
    set(state => ({ auditLogs: [log, ...state.auditLogs] }));
    if (isSupabaseConfigured) { supabaseService.saveAuditLog(log); }
    
    // Save to localStorage for persistence
    localStorage.setItem('ksa_current_user', JSON.stringify(authUser));
    
    return 'SUCCESS';
  },

  logout: () => {
    const { currentUser } = get();
    if (currentUser) {
      get().addLog('LOGOUT', 'SYSTEM', `Sesi pengguna diakhiri: ${currentUser.name}`);
    }
    // Set currentUser to null and CLEAR customerCart
    set({ currentUser: null, customerCart: [] });
    localStorage.removeItem('ksa_current_user');
  },

  // Cart implementations (Admin)
  addToCart: (product: Product, isBox: boolean = false, targetNumber?: string) => {
    const { cart } = get();
    // For box, we will check if stock >= pcsPerBox. We assume stock is always in pieces.
    const requiredQty = isBox ? (product.pcsPerBox || 1) : 1;
    
    // Bypass stock check for PPOB
    if (!product.isPPOB && product.stock < requiredQty) return;
    
    // We will use a unique key for the cart item: product.id + isBox + targetNumber.
    const existingIndex = cart.findIndex(item => item.product.id === product.id && !!item.isBox === isBox && item.targetNumber === targetNumber);
    
    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newQuantity = existing.quantity + 1;
      
      if (!product.isPPOB && (newQuantity * requiredQty) > product.stock) return;
      
      const newCart = [...cart];
      newCart[existingIndex] = { ...existing, quantity: newQuantity };
      set({ cart: newCart });
      saveStorage('ksa_cart', newCart, get().currentUser?.tenantId);
    } else {
      const newCart = [...cart, { product, quantity: 1, isBox, targetNumber }];
      set({ cart: newCart });
      saveStorage('ksa_cart', newCart, get().currentUser?.tenantId);
    }
  },
  
  removeFromCart: (productId: string, isBox?: boolean) => {
    let newCart;
    if (isBox === undefined) {
       newCart = get().cart.filter(item => item.product.id !== productId);
    } else {
       newCart = get().cart.filter(item => !(item.product.id === productId && !!item.isBox === isBox));
    }
    set({ cart: newCart });
    saveStorage('ksa_cart', newCart, get().currentUser?.tenantId);
  },
  
  updateCartQuantity: (productId: string, quantity: number, isBox: boolean = false) => {
    const { cart } = get();
    const itemIndex = cart.findIndex(i => i.product.id === productId && !!i.isBox === isBox);
    if (itemIndex < 0) return;
    
    if (quantity <= 0) {
      get().removeFromCart(productId, isBox);
      return;
    }
    
    const item = cart[itemIndex];
    const requiredQty = isBox ? (item.product.pcsPerBox || 1) : 1;
    
    let newQty = quantity;
    if (!item.product.isPPOB) {
      const maxQty = Math.floor(item.product.stock / requiredQty);
      newQty = Math.min(quantity, maxQty);
    }
    
    const newCart = [...cart];
    newCart[itemIndex] = { ...item, quantity: newQty };
    set({ cart: newCart });
    saveStorage('ksa_cart', newCart, get().currentUser?.tenantId);
  },
  
  clearCart: () => {
    set({ cart: [] });
    saveStorage('ksa_cart', [], get().currentUser?.tenantId);
  },

  // Customer Portal Actions
  addToCustomerCart: (product: Product) => {
    const { customerCart } = get();
    if (product.stock <= 0) return;
    
    const existing = customerCart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      set({
        customerCart: customerCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      set({ customerCart: [...customerCart, { product, quantity: 1 }] });
    }
  },
  
  removeFromCustomerCart: (productId: string) => {
    set({ customerCart: get().customerCart.filter(item => item.product.id !== productId) });
  },
  
  updateCustomerCartQuantity: (productId: string, quantity: number) => {
    const { customerCart } = get();
    const item = customerCart.find(i => i.product.id === productId);
    if (!item) return;
    
    if (quantity <= 0) {
      get().removeFromCustomerCart(productId);
      return;
    }
    
    const newQty = Math.min(quantity, item.product.stock);
    set({
      customerCart: customerCart.map(i =>
        i.product.id === productId ? { ...i, quantity: newQty } : i
      )
    });
  },
  
  clearCustomerCart: () => set({ customerCart: [] }),

  submitOnlineOrder: (customerId, customerName, customerPhone, notes, customerAddress, paymentCode, distanceKm, branchId) => {
    const { customerCart } = get();
    if (customerCart.length === 0) return;

    const baseTotal = customerCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const orderNo = `ORD-${Date.now()}`;
    const newOrder: OnlineOrder = {
      id: `oo_${Date.now()}`,
      tenantId: get().currentUser?.tenantId || 'tenant_default',
      orderNo,
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      distanceKm,
      branchId,
      items: customerCart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        price: i.product.price
      })),
      totalAmount: baseTotal,
      shippingFee: 0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes,
      paymentCode
    };

    const updatedOrders = [newOrder, ...get().onlineOrders];
    set({ onlineOrders: updatedOrders, customerCart: [] });
    saveStorage('ksa_online_orders', updatedOrders, get().currentUser?.tenantId);
    
    if (isSupabaseConfigured) {
      supabaseService.saveOnlineOrder(newOrder);
    }

    // Mock Whatsapp Notification
    console.log(`SEND WA TO 082210027952: Ada Pesanan Baru ${orderNo} dari ${customerName} sebesar Rp ${baseTotal.toLocaleString('id-ID')}`);
  },

  updateOrderStatus: (orderId, status) => {
    const updatedOrders = get().onlineOrders.map(o => 
      o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
    );
    set({ onlineOrders: updatedOrders });
    saveStorage('ksa_online_orders', updatedOrders, get().currentUser?.tenantId);
    
    if (isSupabaseConfigured) {
      const updatedOrder = updatedOrders.find(o => o.id === orderId);
      if (updatedOrder) supabaseService.saveOnlineOrder(updatedOrder);
    }
  },

  processOnlineOrderPayment: (orderId, paymentMethod) => {
    const { onlineOrders, currentUser, products, journalEntries, transactions } = get();
    if (!currentUser) return;
    
    const order = onlineOrders.find(o => o.id === orderId);
    if (!order || order.status === 'COMPLETED') return;

    // Build Transaction
    const invoiceNo = `INV-OL-${Date.now()}`;
    const totalAmount = order.totalAmount;
    
    let totalCost = 0;
    
    // Decrease Stock & Calc Cost
    let updatedProducts = [...products];
    order.items.forEach(item => {
      const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIndex !== -1) {
        const prod = updatedProducts[prodIndex];
        const itemCost = prod.costPrice || 0;
        totalCost += (itemCost * item.quantity);
        if (!prod.isPPOB) {
          prod.stock -= item.quantity;
          get().addStockMovement({
            tenantId: currentUser.tenantId || 'tenant_default',
            productId: item.productId,
            type: 'OUT',
            qty: item.quantity,
            reason: `Pesanan Online ${order.orderNo}`,
            branchId: order.branchId
          });
        }
      }
    });

    const marginContribution = totalAmount - totalCost;
    const zakatContribution = marginContribution > 0 ? Math.round(marginContribution * 0.025) : 0;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      tenantId: currentUser.tenantId || 'tenant_default',
      invoiceNo,
      timestamp: new Date().toISOString(),
      cashierName: currentUser.name,
      items: order.items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
        costPrice: 0 
      })),
      totalAmount,
      shippingFee: order.shippingFee,
      paymentMethod,
      amountPaid: totalAmount,
      changeAmount: 0,
      zakatContribution,
      marginContribution,
      customerId: order.customerId,
      customerName: order.customerName,
      branchId: order.branchId
    };

    // Journal Entry
    const now = new Date().toISOString();
    const resolveCoa = (keyword: string, fallback: string) => {
      const coas = get().coaList;
      const exact = coas.find(c => c.code === fallback || c.code.includes(fallback.split(' ')[0]));
      if (exact) return exact.code;
      const fuzzy = coas.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
      return fuzzy ? fuzzy.code : fallback;
    };

    const kasCode = paymentMethod === 'TRANSFER_BSI' 
      ? resolveCoa('bank', '1-1010 Bank Syariah Indonesia (BSI)') 
      : paymentMethod === 'QRIS_SHARIAH'
      ? resolveCoa('qris', '1-1020 QRIS Syariah Dana')
      : resolveCoa('kas', '1-1000 Kas Tunai Toko');

    const newJournals: JournalEntry[] = [
      {
        id: `je_1_${Date.now()}`,
        tenantId: currentUser.tenantId || 'tenant_default',
        date: now,
        account: kasCode,
        description: `Penerimaan Online ${invoiceNo}`,
        debit: totalAmount,
        credit: 0,
        referenceId: newTx.id,
        referenceType: 'AUTO_TRANSAKSI',
        createdBy: currentUser.name,
        branchId: order.branchId
      },
    ];

    const revenueGroups: Record<string, number> = {};
    const cogsGroups: Record<string, number> = {};

    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const sCoa = prod?.salesCoaCode || resolveCoa('pendapatan online', resolveCoa('pendapatan', '4-1001 Pendapatan Penjualan'));
      const cCoa = prod?.cogsCoaCode || resolveCoa('hpp online', resolveCoa('hpp', '5-1000 Beban Pokok Penjualan (HPP)'));
      
      const rev = item.price * item.quantity;
      const cogs = (prod?.costPrice || 0) * item.quantity;
      
      revenueGroups[sCoa] = (revenueGroups[sCoa] || 0) + rev;
      
      const invCoa = prod?.isPPOB 
        ? resolveCoa('radar', '1-1050 Saldo Radar Pulsa / Digital')
        : resolveCoa('persediaan', '1-1040 Persediaan Barang Dagang');
        
      const key = `${cCoa}|${invCoa}`;
      cogsGroups[key] = (cogsGroups[key] || 0) + cogs;
    });

    Object.entries(revenueGroups).forEach(([coa, amount], index) => {
      if (amount > 0) {
        newJournals.push({
          id: `je_rev_${Date.now()}_${index}`,
          tenantId: currentUser.tenantId || 'tenant_default',
          date: now,
          account: coa,
          description: `Penjualan Online ${invoiceNo}`,
          debit: 0,
          credit: amount,
          referenceId: newTx.id,
          referenceType: 'AUTO_TRANSAKSI',
          createdBy: currentUser.name,
          branchId: order.branchId
        });
      }
    });

    Object.entries(cogsGroups).forEach(([key, amount], index) => {
      if (amount > 0) {
        const [cogsCoa, inventoryCoa] = key.split('|');
        newJournals.push({
          id: `je_cogs_${Date.now()}_${index}`,
          tenantId: currentUser.tenantId || 'tenant_default',
          date: now,
          account: cogsCoa,
          description: `HPP Online ${invoiceNo}`,
          debit: amount,
          credit: 0,
          referenceId: newTx.id,
          referenceType: 'AUTO_TRANSAKSI',
          createdBy: currentUser.name,
          branchId: order.branchId
        });
        newJournals.push({
          id: `je_inv_${Date.now()}_${index}`,
          tenantId: currentUser.tenantId || 'tenant_default',
          date: now,
          account: inventoryCoa,
          description: `Keluar Persediaan/Radar ${invoiceNo}`,
          debit: 0,
          credit: amount,
          referenceId: newTx.id,
          referenceType: 'AUTO_TRANSAKSI',
          createdBy: currentUser.name,
          branchId: order.branchId
        });
      }
    });

    const updatedTxs = [newTx, ...transactions];
    const updatedJournals = [...newJournals, ...journalEntries];

    // Handle Customer Points for Online Orders
    if (order.customerId) {
      const currentCustomer = get().customers.find(c => c.id === order.customerId);
      if (currentCustomer) {
        const earnedPoints = Math.floor(totalAmount / 1000);
        get().updateCustomer(order.customerId, {
          points: (currentCustomer.points || 0) + earnedPoints,
          totalPointsEarned: (currentCustomer.totalPointsEarned || 0) + earnedPoints,
          lastPointsUpdate: new Date().toISOString().split('T')[0]
        });
      }
    }

    set({ 
      products: updatedProducts, 
      transactions: updatedTxs,
      journalEntries: updatedJournals
    });
    
    saveStorage('ksa_products', updatedProducts, get().currentUser?.tenantId);
    saveStorage('ksa_transactions', updatedTxs, get().currentUser?.tenantId);
    saveStorage('ksa_journal_entries', updatedJournals, get().currentUser?.tenantId);
    
    if (isSupabaseConfigured) {
      supabaseService.saveTransaction(newTx);
      newJournals.forEach(j => supabaseService.saveJournalEntry(j));
      order.items.forEach(item => {
        const prod = updatedProducts.find(p => p.id === item.productId);
        if (prod) supabaseService.saveProduct(prod);
      });
    }

    get().addLog('ONLINE_ORDER_COMPLETE', 'FINANCE', `Pesanan Online ${order.orderNo} diselesaikan dan dibayar via ${paymentMethod}`);
    get().updateOrderStatus(orderId, 'COMPLETED');
  },

  sendChatMessage: (orderId, senderId, senderName, text) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      tenantId: get().currentUser?.tenantId || 'tenant_default',
      orderId,
      senderId,
      senderName,
      text,
      timestamp: new Date().toISOString()
    };
    const updatedMsgs = [...get().chatMessages, newMessage];
    set({ chatMessages: updatedMsgs });
    saveStorage('ksa_chat_messages', updatedMsgs, get().currentUser?.tenantId);
  },
  
  // Checkout Implementation
  checkout: (options) => {
    const { paymentMethod, amountPaid, shippingFee = 0, customerId, promoId, pointsToRedeem, splitPayments } = options;
    const { cart, currentUser, products, customers, promos, settings, addStockMovement } = get();
    if (cart.length === 0 || !currentUser) return null;
    
    // Dynamic pricing for wholesale
    const getDynamicPrice = (item: CartItem) => {
      if (item.product.isPromoActive && item.product.promoPrice) {
        return item.product.promoPrice;
      }
      if (item.product.wholesalePrice && item.product.wholesaleMinQty && item.quantity >= item.product.wholesaleMinQty) {
        return item.product.wholesalePrice;
      }
      return item.product.price;
    };

    const baseTotal = cart.reduce((sum, item) => sum + (getDynamicPrice(item) * item.quantity), 0);
    const totalCost = cart.reduce((sum, item) => sum + (item.product.costPrice * item.quantity), 0);
    
    // Apply promo
    const selectedPromo = promos.find(p => p.id === promoId);
    let discountAmount = 0;
    if (selectedPromo && selectedPromo.isActive && baseTotal >= selectedPromo.minPurchase) {
      if (selectedPromo.type === 'PERCENTAGE') {
        discountAmount = baseTotal * (selectedPromo.value / 100);
      } else {
        discountAmount = selectedPromo.value;
      }
    }

    const redeemed = pointsToRedeem || 0;
    const currentCustomer = customers.find(c => c.id === customerId);
    if (currentCustomer && redeemed > (currentCustomer.points || 0)) {
      return null;
    }
    const pointsDiscount = (settings.enablePoints !== false) ? (redeemed * (settings.pointRedemptionValue || 10)) : 0;
    let totalAmount = Math.max(0, baseTotal - discountAmount - pointsDiscount) + shippingFee;
    let taxAmount = 0;
    if (settings.isTaxEnabled) {
      taxAmount = totalAmount * (settings.taxRate / 100);
      totalAmount += taxAmount;
    }

    const marginContribution = totalAmount - taxAmount - totalCost; // Tax is not profit
    
    let zakatContribution = 0;
    if (settings.enableCharityZakat !== false) {
      const zakatPct = (settings.charityZakatPercentage ?? 2.5) / 100;
      zakatContribution = marginContribution > 0 ? Math.round(marginContribution * zakatPct) : 0;
    }
    
    let actualPaid = splitPayments ? splitPayments.reduce((s, p) => s + p.amount, 0) : amountPaid;
    if (paymentMethod === 'KASBON') {
      actualPaid = 0;
    }
    const changeAmount = actualPaid > totalAmount ? actualPaid - totalAmount : 0;
    
    if (paymentMethod !== 'KASBON' && actualPaid < totalAmount) return null;
    
    const invoiceNo = `INV-20260607-${Math.floor(100 + Math.random() * 900)}`;
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      tenantId: currentUser.tenantId || 'tenant_default',
      invoiceNo,
      timestamp: new Date().toISOString(),
      cashierName: currentUser.name,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.isBox ? `${item.product.name} (Box)` : item.product.name,
        quantity: item.quantity,
        price: getDynamicPrice(item),
        costPrice: item.isBox ? (item.product.boxCostPrice || 0) : item.product.costPrice,
        targetNumber: item.targetNumber
      })),
      totalAmount,
      shippingFee,
      paymentMethod,
      amountPaid: actualPaid,
      changeAmount,
      zakatContribution,
      marginContribution,
      customerId,
      customerName: currentCustomer?.name,
      promoId,
      discountAmount,
      taxAmount,
      splitPayments,
      branchId: currentUser.branchId,
      pointsEarned: (paymentMethod !== 'KASBON' && settings.enablePoints !== false) ? Math.floor(totalAmount / (settings.pointEarningRate || 1000)) : 0,
      pointsRedeemed: redeemed,
      pointsDiscount: pointsDiscount
    };
    
    // Deduct stocks
    const updatedProducts = products.map(prod => {
      // PPOB does not use stock
      if (prod.isPPOB) return prod;
      
      const relatedCartItems = cart.filter(c => c.product.id === prod.id);
      if (relatedCartItems.length > 0) {
        let totalDeductQty = 0;
        relatedCartItems.forEach(cartItem => {
          totalDeductQty += cartItem.isBox ? (cartItem.quantity * (prod.pcsPerBox || 1)) : cartItem.quantity;
        });
        const remainingStock = Math.max(0, prod.stock - totalDeductQty);
        const updated = { ...prod, stock: remainingStock };
        if (isSupabaseConfigured) { supabaseService.saveProduct(updated); }
        return updated;
      }
      return prod;
    });
    
    set({
      products: updatedProducts,
      transactions: [newTx, ...get().transactions],
      cart: [],
      lastTransactionId: newTx.id
    });
    
    // Save to localStorage immediately
    saveStorage('ksa_products', updatedProducts, get().currentUser?.tenantId);
    saveStorage('ksa_transactions', [newTx, ...get().transactions], get().currentUser?.tenantId);
    saveStorage('ksa_cart', [], get().currentUser?.tenantId);
    saveStorage('ksa_last_transaction', newTx.id, get().currentUser?.tenantId);

    // Handle KASBON customer debt logic
    if (paymentMethod === 'KASBON' && customerId) {
      get().updateCustomer(customerId, { debtAmount: (currentCustomer?.debtAmount || 0) + totalAmount });
    }
    // Handle Customer Points (+1 point per 1.000 spent)
    if (customerId) {
      const earnedPoints = paymentMethod !== 'KASBON' ? Math.floor(totalAmount / 1000) : 0;
      get().updateCustomer(customerId, {
        points: Math.max(0, (currentCustomer?.points || 0) - redeemed + earnedPoints),
        totalPointsEarned: (currentCustomer?.totalPointsEarned || 0) + earnedPoints,
        totalPointsRedeemed: (currentCustomer?.totalPointsRedeemed || 0) + redeemed,
        lastPointsUpdate: new Date().toISOString().split('T')[0]
      });
    }

    // === JURNAL OTOMATIS dari Transaksi POS ===
    const now = new Date().toISOString();
    const jId = `je_${Date.now()}`;
    const journalEntries = get().journalEntries;
    
    let autoJournals: JournalEntry[] = [];
    
    const resolveCoa = (keyword: string, fallback: string) => {
      const coas = get().coaList;
      const exact = coas.find(c => c.code === fallback || c.code.includes(fallback.split(' ')[0]));
      if (exact) return exact.code;
      const fuzzy = coas.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
      return fuzzy ? fuzzy.code : fallback;
    };

    if (splitPayments && splitPayments.length > 0) {
      splitPayments.forEach((sp, i) => {
        const akunKas = sp.method === 'CASH' ? resolveCoa('kas', 'KAS') : sp.method === 'QRIS_SHARIAH' ? resolveCoa('qris', 'QRIS_SYARIAH') : resolveCoa('bank', 'BANK_BSI');
        autoJournals.push({
          id: `${jId}_${i+1}`,
          tenantId: currentUser.tenantId || 'tenant_default',
          date: now,
          account: akunKas,
          description: `[Auto] Penjualan SPLIT (${sp.method}) dari ${invoiceNo}`,
          debit: sp.amount - (i === 0 ? changeAmount : 0), // Kurangi kembalian dari pembayaran pertama
          credit: 0,
          referenceId: newTx.id,
          referenceType: 'AUTO_TRANSAKSI' as JournalSourceType,
          createdBy: currentUser.name,
          branchId: currentUser.branchId
        });
      });
    } else {
      const akunKas = paymentMethod === 'CASH' ? resolveCoa('kas', 'KAS') : paymentMethod === 'QRIS_SHARIAH' ? resolveCoa('qris', 'QRIS_SYARIAH') : paymentMethod === 'KASBON' ? resolveCoa('piutang', 'PIUTANG_DAGANG') : resolveCoa('bank', 'BANK_BSI');
      autoJournals.push({
        id: `${jId}_1`,
        tenantId: currentUser.tenantId || 'tenant_default',
        date: now,
        account: akunKas,
        description: `[Auto] Penjualan ${paymentMethod} dari ${invoiceNo}`,
        debit: totalAmount,
        credit: 0,
        referenceId: newTx.id,
        referenceType: 'AUTO_TRANSAKSI' as JournalSourceType,
        createdBy: currentUser.name,
        branchId: currentUser.branchId
      });
    }

    const revenueGroups: Record<string, number> = {};
    const cogsGroups: Record<string, number> = {};
    const productList = get().products;

    cart.forEach(item => {
      const prod = productList.find(p => p.id === item.product.id) || item.product;
      const sCoa = prod.salesCoaCode || resolveCoa('pendapatan', '4-1001 Pendapatan Penjualan');
      const cCoa = prod.cogsCoaCode || resolveCoa('hpp', '5-1000 Beban Pokok Penjualan (HPP)');
      
      const rev = getDynamicPrice(item) * item.quantity;
      const cogs = (item.isBox ? (prod.boxCostPrice || 0) : prod.costPrice) * item.quantity;
      
      revenueGroups[sCoa] = (revenueGroups[sCoa] || 0) + rev;
      const invCoa = prod.isPPOB 
        ? resolveCoa('radar', '1-1050 Saldo Radar Pulsa / Digital')
        : resolveCoa('persediaan', '1-1040 Persediaan Barang Dagang');
      const key = `${cCoa}|${invCoa}`;
      cogsGroups[key] = (cogsGroups[key] || 0) + cogs;
    });

    const discountTotal = discountAmount + pointsDiscount;
    const discountFactor = baseTotal > 0 ? (baseTotal - discountTotal) / baseTotal : 1;

    let totalRevenueJournaled = 0;
    Object.entries(revenueGroups).forEach(([coa, amount], index, array) => {
      let netRev = Math.round(amount * discountFactor);
      if (index === array.length - 1) {
        netRev = (totalAmount - taxAmount) - totalRevenueJournaled;
      }
      totalRevenueJournaled += netRev;

      if (netRev > 0) {
        autoJournals.push({
          id: `${jId}_rev_${index}`,
          tenantId: currentUser.tenantId || 'tenant_default',
          date: now,
          account: coa,
          description: `[Auto] Pendapatan penjualan ${invoiceNo}`,
          debit: 0,
          credit: netRev,
          referenceId: newTx.id,
          referenceType: 'AUTO_TRANSAKSI' as JournalSourceType,
          createdBy: currentUser.name,
          branchId: currentUser.branchId
        });
      }
    });

    Object.entries(cogsGroups).forEach(([key, amount], index) => {
      const [cCoa, invCoa] = key.split('|');
      if (amount > 0) {
        autoJournals.push({
          id: `${jId}_cogs_${index}`,
          tenantId: currentUser.tenantId || 'tenant_default',
          date: now,
          account: cCoa,
          description: `[Auto] HPP ${invoiceNo}`,
          debit: amount,
          credit: 0,
          referenceId: newTx.id,
          referenceType: 'AUTO_TRANSAKSI' as JournalSourceType,
          createdBy: currentUser.name,
          branchId: currentUser.branchId
        });
        autoJournals.push({
          id: `${jId}_inv_${index}`,
          tenantId: currentUser.tenantId || 'tenant_default',
          date: now,
          account: invCoa,
          description: `[Auto] Keluar Saldo/Persediaan ${invoiceNo}`,
          debit: 0,
          credit: amount,
          referenceId: newTx.id,
          referenceType: 'AUTO_TRANSAKSI' as JournalSourceType,
          createdBy: currentUser.name,
          branchId: currentUser.branchId
        });
      }
    });
      
    if (taxAmount > 0) {
      autoJournals.push({
        id: `${jId}_tax`,
        tenantId: currentUser.tenantId || 'tenant_default',
        date: now,
        account: resolveCoa('pajak', 'HUTANG_PAJAK'),
        description: `[Auto] Pajak dari ${invoiceNo}`,
        debit: 0,
        credit: taxAmount,
        referenceId: newTx.id,
        referenceType: 'AUTO_TRANSAKSI' as JournalSourceType,
        createdBy: currentUser.name,
        branchId: currentUser.branchId
      });
    }

    const updatedJournals = [...autoJournals, ...journalEntries];
    set({ journalEntries: updatedJournals });
    saveStorage('ksa_journal_entries', updatedJournals, get().currentUser?.tenantId);
    // === END JURNAL OTOMATIS ===
    
    get().addLog(
      'POS_TRANSACTION',
      'POS',
      `Penjualan sukses ${invoiceNo} senilai Rp ${totalAmount.toLocaleString('id-ID')} via ${paymentMethod} oleh ${currentUser.name}`
    );

    if (isSupabaseConfigured) { supabaseService.saveTransaction(newTx); }
    return newTx;
  },
  
  // CRUD Products/Stock
  addProduct: (newProd) => {
    const id = `prod_${Date.now()}`;
    const product: Product = { ...newProd, id };
    const updated = [...get().products, product];
    set({ products: updated });
    saveStorage('ksa_products', updated, get().currentUser?.tenantId);
    get().addLog('PRODUCT_ADD', 'INVENTORY', `Menambah produk baru: ${product.name} [SKU: ${product.sku}]`);
    
    if (isSupabaseConfigured) {
      supabaseService.saveProduct(product);
    }
    // Background: generate image for product if not provided
    (async () => {
      try {
        const { generateProductImage } = await import('../lib/ai');
        if (!product.image) {
          const img = await generateProductImage(product.name);
          const updatedProd = { ...product, image: img };
          // update store & persistence
          const after = get().products.map(p => p.id === updatedProd.id ? updatedProd : p);
          set({ products: after });
          saveStorage('ksa_products', after, get().currentUser?.tenantId);
          get().addLog('PRODUCT_IMAGE_GENERATED', 'INVENTORY', `Gambar di-generate otomatis untuk produk: ${product.name}`);
          if (isSupabaseConfigured) supabaseService.saveProduct(updatedProd);
        }
      } catch (e) {
        // ignore image generation errors
      }
    })();
  },
  
  addProductsBulk: (newProds) => {
    const startId = Date.now();
    const products: Product[] = newProds.map((p, idx) => ({
      ...p,
      id: `prod_${startId}_${idx}`
    }));
    const updated = [...get().products, ...products];
    set({ products: updated });
    saveStorage('ksa_products', updated, get().currentUser?.tenantId);
    get().addLog('PRODUCT_BULK_ADD', 'INVENTORY', `Mengimpor ${products.length} produk secara massal`);

    if (isSupabaseConfigured) {
      supabaseService.saveProductsBulk(products);
    }

    // Enqueue image generation for products without images and start background processor.
    try {
      const tenant = get().currentUser?.tenantId;
      const queueKey = tenant ? 'ksa_image_queue' : 'ksa_image_queue';
      const existingQueue = (getStorage(queueKey, tenant) as string[]) || [];
      const idsToEnqueue = products.filter(p => !p.image).map(p => p.id);
      const newQueue = Array.from(new Set([...existingQueue, ...idsToEnqueue]));
      saveStorage(queueKey, newQueue, tenant);
      // schedule processor shortly
      setTimeout(() => {
        try { get().processImageQueue(); } catch (e) {}
      }, 200);
    } catch (e) {}
  },
  
  updateProduct: (updatedProd) => {
    const oldProd = get().products.find(p => p.id === updatedProd.id);
    const updated = get().products.map(p => p.id === updatedProd.id ? updatedProd : p);
    set({
      products: updated
    });
    saveStorage('ksa_products', updated, get().currentUser?.tenantId);
    get().addLog('PRODUCT_UPDATE', 'INVENTORY', `Ubah informasi produk: ${updatedProd.name}`);
    
    // Check for Restock Notification
    if (oldProd && oldProd.stock <= 0 && updatedProd.stock > 0) {
      get().addNotification({
        title: 'Barang Berhasil Di-restock',
        message: `Stok untuk ${updatedProd.name} (SKU: ${updatedProd.sku}) telah diperbarui dari Habis menjadi ${updatedProd.stock} pcs.`,
        type: 'INFO',
        link: '/inventory'
      });
    }
    
    if (isSupabaseConfigured) {
      supabaseService.saveProduct(updatedProd);
    }
  },

  // Image generation queue stored per-tenant to allow gradual background processing
  imageQueue: getStorage('ksa_image_queue', undefined) || [],
  enqueueImageGeneration: (productId: string) => {
    try {
      const tenant = get().currentUser?.tenantId;
      const qKey = 'ksa_image_queue';
      const q = (getStorage(qKey, tenant) as string[]) || [];
      if (!q.includes(productId)) {
        const updatedQ = [...q, productId];
        saveStorage(qKey, updatedQ, tenant);
        set({ imageQueue: updatedQ });
        setTimeout(() => { try { get().processImageQueue(); } catch (e) {} }, 200);
      }
    } catch (e) {}
  },

  processImageQueue: async () => {
    if (imageWorkerRunning) return;
    imageWorkerRunning = true;
    try {
      const tenant = get().currentUser?.tenantId;
      const qKey = 'ksa_image_queue';
      let queue = (getStorage(qKey, tenant) as string[]) || [];
      set({ imageQueue: queue });

      const { generateProductImage } = await import('../lib/ai');

      const concurrency = 2;
      const delayMs = 400;

      while (queue.length > 0) {
        // take a small batch
        const batch = queue.slice(0, concurrency);
        const promises = batch.map(async (prodId) => {
          try {
            const prod = get().products.find(p => p.id === prodId);
            if (!prod) return;
            const img = await generateProductImage(prod.name);

            let finalImg = img;
            if (finalImg && finalImg.startsWith('data:') && isSupabaseConfigured) {
              // upload data URL to storage to get URL
              try {
                const file = dataUrlToFile(finalImg, `${prodId}.jpg`);
                const uploadPath = `products/${prodId}_${Date.now()}.jpg`;
                const url = await uploadImageToStorage(file, 'product-images', uploadPath, finalImg as any);
                if (url) finalImg = url;
              } catch (err) {
                // fallback keep dataUrl
              }
            }

            const updatedProd = { ...prod, image: finalImg };
            const after = get().products.map(pp => pp.id === updatedProd.id ? updatedProd : pp);
            set({ products: after });
            saveStorage('ksa_products', after, tenant);
            get().addLog('PRODUCT_IMAGE_GENERATED', 'INVENTORY', `Gambar di-generate otomatis (queue) untuk produk: ${prod.name}`);
            if (isSupabaseConfigured) supabaseService.saveProduct(updatedProd);
          } catch (err) {
            // ignore per-item errors
          }
        });

        await Promise.all(promises);

        // remove processed ids from queue and persist
        queue = queue.slice(batch.length);
        saveStorage(qKey, queue, tenant);
        set({ imageQueue: queue });

        // small delay to yield to main thread and network
        await new Promise(res => setTimeout(res, delayMs));
      }
    } catch (err) {
      // ignore
    } finally {
      imageWorkerRunning = false;
    }
  },
  
  deleteProduct: (id) => {
    const prod = get().products.find(p => p.id === id);
    const updated = get().products.filter(p => p.id !== id);
    set({ products: updated });
    saveStorage('ksa_products', updated, get().currentUser?.tenantId);
    if (prod) {
      get().addLog('PRODUCT_DELETE', 'INVENTORY', `Menghapus produk: ${prod.name}`);
    }
    
    if (isSupabaseConfigured) {
      supabaseService.deleteProduct(id);
    }
  },

  clearProducts: () => {
    const tenantId = get().currentUser?.tenantId || 'tenant_default';
    set({ products: [] });
    saveStorage('ksa_products', [], tenantId);
    localStorage.removeItem('ksa_products');
    localStorage.removeItem(`ksa_products__${tenantId}`);
    get().addLog('PRODUCTS_CLEAR', 'INVENTORY', 'Menghapus semua produk inventori untuk tenant ' + tenantId);

    if (isSupabaseConfigured) {
      supabaseService.deleteProductsByTenant(tenantId);
    }
  },
  
  adjustStock: (productId, amount) => {
    const prod = get().products.find(p => p.id === productId);
    if (!prod) return;

    const updated = { ...prod, stock: Math.max(0, prod.stock + amount) };
    const updatedList = get().products.map(p => p.id === productId ? updated : p);
    set({
      products: updatedList
    });
    saveStorage('ksa_products', updatedList, get().currentUser?.tenantId);
    
    // Check for Restock Notification
    if (prod.stock <= 0 && updated.stock > 0) {
      get().addNotification({
        title: 'Barang Berhasil Di-restock',
        message: `Stok untuk ${prod.name} (SKU: ${prod.sku}) telah diperbarui dari Habis menjadi ${updated.stock} pcs.`,
        type: 'INFO',
        link: '/inventory'
      });
    }

    // Log stock movement
    get().addStockMovement({
      tenantId: get().currentUser?.tenantId || 'tenant_default',
      productId,
      type: amount > 0 ? 'IN' : 'OUT',
      qty: Math.abs(amount),
      reason: 'Penyesuaian Manual / Opname',
      branchId: prod.branchId
    });

    get().addLog('STOCK_ADJUST', 'INVENTORY', `Penyesuaian stok ${prod.name} sejumlah ${amount > 0 ? '+' : ''}${amount}`);

    // Generate Journal Entries for Financial Report
    const totalValue = Math.abs(amount) * (prod.costPrice || 0);
    if (totalValue > 0) {
      const now = new Date().toISOString();
      const currentUser = get().currentUser;
      const refId = `opname_${Date.now()}`;
      
      const tenantId = prod.tenantId || currentUser?.tenantId || 'tenant_default';
      if (amount < 0) {
        // Stock reduced (loss/shrinkage)
        get().addJournalEntry({
          tenantId,
          date: now,
          account: 'BEBAN POKOK PENDAPATAN',
          description: `[Auto] Selisih kurang stok opname: ${prod.name} (${Math.abs(amount)} pcs)`,
          debit: totalValue,
          credit: 0,
          referenceId: refId,
          referenceType: 'MANUAL',
          createdBy: currentUser?.name || 'System'
        });
        get().addJournalEntry({
          tenantId,
          date: now,
          account: 'PERSEDIAAN BARANG DAGANG',
          description: `[Auto] Selisih kurang stok opname: ${prod.name} (${Math.abs(amount)} pcs)`,
          debit: 0,
          credit: totalValue,
          referenceId: refId,
          referenceType: 'MANUAL',
          createdBy: currentUser?.name || 'System'
        });
      } else {
        // Stock increased (gain)
        get().addJournalEntry({
          tenantId,
          date: now,
          account: 'PERSEDIAAN BARANG DAGANG',
          description: `[Auto] Selisih lebih stok opname: ${prod.name} (${Math.abs(amount)} pcs)`,
          debit: totalValue,
          credit: 0,
          referenceId: refId,
          referenceType: 'MANUAL',
          createdBy: currentUser?.name || 'System'
        });
        get().addJournalEntry({
          tenantId,
          date: now,
          account: 'PENDAPATAN LAINNYA',
          description: `[Auto] Selisih lebih stok opname: ${prod.name} (${Math.abs(amount)} pcs)`,
          debit: 0,
          credit: totalValue,
          referenceId: refId,
          referenceType: 'MANUAL',
          createdBy: currentUser?.name || 'System'
        });
      }
    }
    
    if (isSupabaseConfigured) {
      supabaseService.saveProduct(updated);
    }
  },
  
  // Zakat Calculator Records
  addZakatRecord: (record) => {
    const newRecord: ZakatCalculation = {
      ...record,
      id: `zk_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    const updated = [newRecord, ...get().zakatRecords];
    set({ zakatRecords: updated });
    saveStorage('ksa_zakat_records', updated, get().currentUser?.tenantId);
    get().addLog(
      'ZAKAT_CALCULATION',
      'ZAKAT',
      `Menyimpan kalkulasi zakat perdagangan dengan nilai harta bersih Rp ${record.netWealth.toLocaleString('id-ID')}`
    );

    if (isSupabaseConfigured) {
      supabaseService.saveZakatRecord(newRecord);
    }
  },

  // Zakat Distributions
  addZakatDistribution: (dist) => {
    const newDist: ZakatDistribution = {
      ...dist,
      id: `zkd_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    const updated = [newDist, ...get().zakatDistributions];
    set({ zakatDistributions: updated });
    saveStorage('ksa_zakat_distributions', updated, get().currentUser?.tenantId);
    get().addLog(
      'ZAKAT_DISTRIBUTION',
      'ZAKAT',
      `Penyaluran Zakat & ESG: Rp ${dist.amount.toLocaleString('id-ID')} disalurkan kepada ${dist.recipient} (${dist.esgCategory})`
    );

    if (isSupabaseConfigured) {
      supabaseService.saveZakatDistribution(newDist);
    }
  },

  registerUser: (userData) => {
    const { users } = get();
    if (users.find(u => u.username === userData.username)) {
      return false; // username sudah dipakai
    }
    const isPelanggan = userData.role === 'PELANGGAN';
    const newUser: UserAccount = {
      ...userData,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isActive: true,
      isApproved: isPelanggan ? true : false,
      role: userData.role || 'CASHIER'
    };
    const updated = [...users, newUser];
    set({ users: updated });
    saveStorage('ksa_users', updated);
    
    const statusText = isPelanggan ? 'AKTIF' : 'PENDING';
    get().addLog('USER_REGISTER', 'SYSTEM', `Pendaftaran akun baru (${statusText}): ${newUser.name} (@${newUser.username})`);

    // Create Customer profile dynamically for PELANGGAN
    if (isPelanggan) {
      const customerExists = get().customers.some(c => c.name === newUser.name || c.phone === newUser.phone);
      if (!customerExists) {
        const newCustomer: Customer = {
          id: `cust_${Date.now()}`,
          tenantId: newUser.tenantId || 'tenant_default',
          name: newUser.name,
          phone: newUser.phone || '',
          points: 0,
          debtAmount: 0,
          createdAt: new Date().toISOString(),
          branchId: get().currentUser?.branchId,
          isKoperasiMember: newUser.isKoperasiMember
        };
        const updatedCustomers = [...get().customers, newCustomer];
        set({ customers: updatedCustomers });
        saveStorage('ksa_customers', updatedCustomers, get().currentUser?.tenantId);
        if (isSupabaseConfigured) {
          supabaseService.saveCustomer(newCustomer);
        }
      }
    }
    
    if (isSupabaseConfigured) {
      supabaseService.saveUser(newUser);
    }
    return true;
  },

  approveUser: (id, approverName) => {
    const { users } = get();
    const updated = users.map(u => u.id === id ? {
      ...u,
      isApproved: true,
      approvedBy: approverName,
      approvedAt: new Date().toISOString()
    } : u);
    set({ users: updated });
    saveStorage('ksa_users', updated);
    const approvedUser = updated.find(u => u.id === id);
    get().addLog('USER_APPROVE', 'SYSTEM', `Akun disetujui: ${approvedUser?.name} (@${approvedUser?.username}) oleh ${approverName}`);
    
    if (isSupabaseConfigured && approvedUser) {
      supabaseService.saveUser(approvedUser);
    }
  },

  rejectUser: (id) => {
    const { users } = get();
    const rejected = users.find(u => u.id === id);
    const updated = users.filter(u => u.id !== id);
    set({ users: updated });
    saveStorage('ksa_users', updated);
    get().addLog('USER_REJECT', 'SYSTEM', `Pendaftaran ditolak: ${rejected?.name} (@${rejected?.username})`);
    
    if (isSupabaseConfigured) {
      supabaseService.deleteUser(id);
    }
  },

  updateUser: (id, updates) => {
    const { users, currentUser } = get();
    const updated = users.map(u => u.id === id ? { ...u, ...updates } : u);
    set({ users: updated });
    saveStorage('ksa_users', updated);
    get().addLog('USER_UPDATE', 'SYSTEM', `Update data akun ID: ${id}`);
    
    const modifiedUser = updated.find(u => u.id === id);
    if (currentUser && modifiedUser && currentUser.username === modifiedUser.username) {
      const newCurrentUser = { name: modifiedUser.name, username: modifiedUser.username, role: modifiedUser.role, branchId: modifiedUser.branchId, tenantId: modifiedUser.tenantId };
      set({ currentUser: newCurrentUser });
      localStorage.setItem('ksa_current_user', JSON.stringify(newCurrentUser));
    }
    
    if (isSupabaseConfigured && modifiedUser) {
      supabaseService.saveUser(modifiedUser);
    }
  },

  deleteUser: (id) => {
    const { users } = get();
    const updated = users.filter(u => u.id !== id);
    set({ users: updated });
    saveStorage('ksa_users', updated);
    get().addLog('USER_DELETE', 'SYSTEM', `Penghapusan akun ID: ${id}`);
    
    if (isSupabaseConfigured) {
      supabaseService.deleteUser(id);
    }
  },

  addPurchaseOrder: (poData) => {
    const { currentUser } = get();
    const newPo: PurchaseOrder = {
      tenantId: currentUser?.tenantId || 'tenant_default',
      ...poData,
      id: `po_${Date.now()}`
    };
    const updated = [newPo, ...get().purchaseOrders];
    set({ purchaseOrders: updated });
    saveStorage('ksa_purchase_orders', updated, get().currentUser?.tenantId);
    get().addLog('PO_CREATE', 'INVENTORY', `Membuat PO baru: ${newPo.poNumber} ke ${newPo.supplier} senilai Rp ${newPo.totalAmount.toLocaleString('id-ID')}`);

    if (isSupabaseConfigured) {
      (supabaseService as any).savePurchaseOrder(newPo);
    }

    // === JURNAL OTOMATIS dari Purchase Order ===
    const now = new Date().toISOString();
    const poJournals: JournalEntry[] = [
      {
        id: `je_${Date.now()}_po1`,
        tenantId: currentUser?.tenantId || 'tenant_default',
        date: now,
        account: 'PERSEDIAAN',
        description: `[Auto] PO Pembelian ${newPo.poNumber} dari ${newPo.supplier}`,
        debit: newPo.totalAmount,
        credit: 0,
        referenceId: newPo.id,
        referenceType: 'AUTO_PO' as JournalSourceType,
        createdBy: currentUser?.name || 'System'
      },
      {
        id: `je_${Date.now()}_po2`,
        tenantId: currentUser?.tenantId || 'tenant_default',
        date: now,
        account: 'HUTANG',
        description: `[Auto] Hutang usaha ke ${newPo.supplier} (${newPo.poNumber})`,
        debit: 0,
        credit: newPo.totalAmount,
        referenceId: newPo.id,
        referenceType: 'AUTO_PO' as JournalSourceType,
        createdBy: currentUser?.name || 'System'
      }
    ];
    const updatedJournals = [...poJournals, ...get().journalEntries];
    set({ journalEntries: updatedJournals });
    saveStorage('ksa_journal_entries', updatedJournals, get().currentUser?.tenantId);
    
    if (isSupabaseConfigured) {
      poJournals.forEach(j => (supabaseService as any).saveJournalEntry(j));
    }
    // === END JURNAL OTOMATIS ===
  },

  updatePurchaseOrder: (id, updates) => {
    const updated = get().purchaseOrders.map(p => p.id === id ? { ...p, ...updates } : p);
    set({ purchaseOrders: updated });
    saveStorage('ksa_purchase_orders', updated, get().currentUser?.tenantId);
    get().addLog('PO_UPDATE', 'INVENTORY', `Update PO ID: ${id}`);

    if (isSupabaseConfigured) {
      const updatedPo = updated.find(p => p.id === id);
      if (updatedPo) (supabaseService as any).savePurchaseOrder(updatedPo);
    }
  },

  addJournalEntry: (entryData) => {
    const newEntry: JournalEntry = {
      tenantId: get().currentUser?.tenantId || 'tenant_default',
      ...entryData,
      id: `je_${Date.now()}`
    };
    const updated = [newEntry, ...get().journalEntries];
    set({ journalEntries: updated });
    saveStorage('ksa_journal_entries', updated, get().currentUser?.tenantId);
    get().addLog('JOURNAL_ENTRY', 'FINANCE', `Mencatat Jurnal: ${newEntry.description}`);
    
    if (isSupabaseConfigured) {
      supabaseService.saveJournalEntry(newEntry);
    }
  },

  deleteJournalEntryByRef: (refId) => {
    const { journalEntries, currentUser, addLog } = get();
    const updated = journalEntries.filter(j => j.referenceId !== refId);
    set({ journalEntries: updated });
    saveStorage('ksa_journal_entries', updated, currentUser?.tenantId);
    addLog('JOURNAL_ENTRY', 'FINANCE', `Menghapus Group Jurnal: ${refId}`);
  },

  addExpense: (expenseData) => {
    const { currentUser, expenses } = get();
    const newExpense: Expense = {
      tenantId: currentUser?.tenantId || 'tenant_default',
      ...expenseData,
      id: `exp_${Date.now()}`,
      createdBy: currentUser ? currentUser.name : 'System'
    };
    const updated = [newExpense, ...expenses];
    set({ expenses: updated });
    saveStorage('ksa_expenses', updated, get().currentUser?.tenantId);
    get().addLog('EXPENSE_ADD', 'FINANCE', `Mencatat pengeluaran: ${newExpense.description} Rp ${newExpense.amount.toLocaleString('id-ID')} oleh ${newExpense.createdBy}`);

    // Update Petty Cash Balance if applicable
    if (newExpense.category === 'OPERASIONAL' && (newExpense.description.startsWith('Kas Kecil:') || newExpense.description.startsWith('Pemasukan Kas:'))) {
      const currentSettings = get().settings;
      const currentBalance = currentSettings.pettyCashBalance || 0;
      get().updateSettings({ pettyCashBalance: currentBalance - newExpense.amount });
    }

    // === JURNAL OTOMATIS dari Pengeluaran ===
    const now = new Date().toISOString();
    const expJournals: JournalEntry[] = [
      {
        id: `je_${Date.now()}_exp1`,
        tenantId: currentUser?.tenantId || 'tenant_default',
        date: now,
        account: 'BEBAN',
        description: `[Auto] Beban ${newExpense.category}: ${newExpense.description}`,
        debit: newExpense.amount,
        credit: 0,
        referenceId: newExpense.id,
        referenceType: 'AUTO_BEBAN' as JournalSourceType,
        createdBy: newExpense.createdBy
      },
      {
        id: `je_${Date.now()}_exp2`,
        tenantId: currentUser?.tenantId || 'tenant_default',
        date: now,
        account: 'KAS',
        description: `[Auto] Kas keluar untuk ${newExpense.description}`,
        debit: 0,
        credit: newExpense.amount,
        referenceId: newExpense.id,
        referenceType: 'AUTO_BEBAN' as JournalSourceType,
        createdBy: newExpense.createdBy
      }
    ];
    const updatedJournals = [...expJournals, ...get().journalEntries];
    set({ journalEntries: updatedJournals });
    saveStorage('ksa_journal_entries', updatedJournals, get().currentUser?.tenantId);
    // === END JURNAL OTOMATIS ===
  },

  deleteExpense: (id) => {
    const { expenses } = get();
    const exp = expenses.find(e => e.id === id);
    const updated = expenses.filter(e => e.id !== id);
    set({ expenses: updated });
    saveStorage('ksa_expenses', updated, get().currentUser?.tenantId);
    if (isSupabaseConfigured) {
      supabaseService.deleteExpense(id);
    }
    if (exp) {
      get().addLog('EXPENSE_DELETE', 'FINANCE', `Menghapus pengeluaran: ${exp.description}`);
      
      // Refund Petty Cash Balance if applicable
      if (exp.category === 'OPERASIONAL' && (exp.description.startsWith('Kas Kecil:') || exp.description.startsWith('Pemasukan Kas:'))) {
        const currentSettings = get().settings;
        const currentBalance = currentSettings.pettyCashBalance || 0;
        get().updateSettings({ pettyCashBalance: currentBalance + exp.amount });
      }
    }
  },

  addPettyCashDeposit: (amount, description) => {
    const { currentUser, settings, addLog, updateSettings } = get();
    const currentBalance = settings.pettyCashBalance || 0;
    updateSettings({ pettyCashBalance: currentBalance + amount });
    addLog('PETTY_CASH_TOPUP', 'FINANCE', `Top Up Kas Kecil: ${description} (Rp ${amount.toLocaleString('id-ID')}) oleh ${currentUser?.name || 'System'}`);
  },

  addClosing: (closing) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const newClosing: ClosingRecord = {
      tenantId: currentUser.tenantId || 'tenant_default',
      ...closing,
      id: `cls_${Date.now()}`,
      timestamp: new Date().toISOString(),
      createdBy: currentUser.name
    };
    const updated = [newClosing, ...get().closings];
    set({ closings: updated });
    saveStorage('ksa_closings', updated, get().currentUser?.tenantId);
    get().addLog('CLOSING_PERFORMED', 'FINANCE', `Melakukan penutupan buku (${newClosing.type}) pada ${newClosing.date}. Laba Bersih: Rp ${newClosing.netProfit.toLocaleString('id-ID')}`);
  },

  clearAllData: () => {
    const tenantId = get().currentUser?.tenantId;
    
    // Clear only transactional and product data
    const emptyState = {
      products: [],
      transactions: [],
      onlineOrders: [],
      chatMessages: [],
      auditLogs: [],
      zakatRecords: [],
      zakatDistributions: [],
      expenses: [],
      closings: [],
      purchaseOrders: [],
      journalEntries: [],
      customers: [],
      suppliers: [],
      promos: [],
      attendances: [],
      stockMovements: []
    };
    
    set(emptyState);
    
    // Update local storage
    const keysToClear = [
      'ksa_products', 'ksa_transactions', 'ksa_online_orders', 'ksa_chat_messages',
      'ksa_audit_logs', 'ksa_zakat_records', 'ksa_zakat_distributions', 'ksa_expenses',
      'ksa_closings', 'ksa_purchase_orders', 'ksa_journal_entries', 'ksa_customers',
      'ksa_suppliers', 'ksa_promos', 'ksa_attendances', 'ksa_stock_movements'
    ];
    
    keysToClear.forEach(key => {
      saveStorage(key, [], tenantId);
    });

    get().addLog('SYSTEM_RESET', 'SYSTEM', 'Seluruh data uji coba telah dihapus');

    if (isSupabaseConfigured && tenantId) {
      supabaseService.clearAllDatabase(tenantId);
    }
  },
  
  // Add Log implementation
  addLog: (action, category, details) => {
    const { currentUser } = get();
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: currentUser?.tenantId || 'tenant_default',
      timestamp: new Date().toISOString(),
      user: currentUser ? currentUser.name : 'System (Anonym)',
      action,
      category,
      details,
      ipAddress: '192.168.1.15'
    };
    const updated = [log, ...get().auditLogs];
    set({ auditLogs: updated });
    saveStorage('ksa_audit_logs', updated, get().currentUser?.tenantId);

    if (isSupabaseConfigured) {
      supabaseService.saveAuditLog(log);
    }
  },

  deleteAuditLogs: async (startDateStr: string, endDateStr: string) => {
    // 1. Delete from local state & storage
    const currentLogs = get().auditLogs;
    const updatedLogs = currentLogs.filter(log => {
      // Keep logs that are OUTSIDE the date range
      return log.timestamp < startDateStr || log.timestamp > endDateStr;
    });
    
    set({ auditLogs: updatedLogs });
    saveStorage('ksa_audit_logs', updatedLogs, get().currentUser?.tenantId);

    // 2. Delete from Supabase cloud
    if (isSupabaseConfigured && (supabaseService as any).deleteAuditLogs) {
      await (supabaseService as any).deleteAuditLogs(startDateStr, endDateStr);
    }
  },

  // Supabase Syncing on startup
  initializeStore: async (options?: { showLoading?: boolean; catalogOnly?: boolean }) => {
    const shouldShowLoading = options?.showLoading ?? true;
    const isCatalogOnly = options?.catalogOnly ?? false;
    if (!isSupabaseConfigured) {
      if (shouldShowLoading) {
        set({ isLoading: false });
      }
      return;
    }

    if (shouldShowLoading) {
      set({ isLoading: true });
    }

    const tenantId = get().currentUser?.tenantId || supabaseService.getTenantId();

    try {
      const tasks: Promise<void>[] = [];
      
      if (!isCatalogOnly) {
        tasks.push(runSupabaseTask('getCustomers', async () => {
          return await supabaseService.getCustomers();
        }, (remoteCustomers) => {
          if (remoteCustomers && remoteCustomers.length > 0) {
            const mapped = remoteCustomers.map(c => ({
              id: c.id,
              tenantId: c.tenant_id,
              name: c.name,
              phone: c.phone,
              points: Number(c.points || 0),
              debtAmount: Number(c.debt_amount || 0),
              branchId: c.branch_id,
              isKoperasiMember: Boolean(c.is_koperasi_member),
              createdAt: c.created_at || new Date().toISOString()
            }));
            set({ customers: mapped });
          }
        }));

        tasks.push(runSupabaseTask('getBranches', async () => {
          return await (supabaseService as any).getBranches();
        }, (remoteBranches) => {
          if (remoteBranches && remoteBranches.length > 0) {
            const mapped = remoteBranches.map(b => ({
              id: b.id,
              tenantId: b.tenant_id,
              name: b.name,
              address: b.address,
              phone: b.phone,
              whatsapp: b.whatsapp || '',
              isActive: b.is_active,
              qrisImageUrl: b.qris_image_url || '',
              createdAt: b.created_at || new Date().toISOString()
            }));
            set({ branches: mapped });
            saveStorage('ksa_branches', mapped, tenantId);
          }
        }));

        tasks.push(runSupabaseTask('getAttendances', async () => {
          return await supabaseService.getAttendances();
        }, (remoteAttendances) => {
          if (remoteAttendances && remoteAttendances.length > 0) {
            const mapped = remoteAttendances.map(a => ({
              id: a.id,
              tenantId: a.tenant_id,
              userId: a.user_id,
              userName: a.user_name,
              date: a.date,
              clockIn: a.clock_in,
              clockOut: a.clock_out,
              status: a.status,
              photoUrl: a.photo_url,
              clockOutPhotoUrl: a.clock_out_photo_url,
              latitude: a.latitude,
              longitude: a.longitude,
              clockOutLatitude: a.clock_out_latitude,
              clockOutLongitude: a.clock_out_longitude,
              correctionStatus: a.correction_status,
              correctionReason: a.correction_reason,
              correctionType: a.correction_type,
              requestedClockIn: a.requested_clock_in,
              requestedClockOut: a.requested_clock_out,
              isRevised: a.is_revised
            }));
            set({ attendances: mapped });
          }
        }));
      }

      tasks.push(runSupabaseTask('fetchProducts', async () => {
        await get().fetchProducts();
      }, () => {}));

      if (!isCatalogOnly) {
        tasks.push(runSupabaseTask('getUsers', async () => {
          return await supabaseService.getUsers();
        }, (remoteUsers) => {
          if (remoteUsers) {
            const defaultUsers = getSavedUsers();
            const merged = [...remoteUsers];
            defaultUsers.forEach(du => {
              if (!merged.some(ru => ru.username === du.username)) {
                merged.push(du);
                supabaseService.saveUser(du);
              }
            });
            set({ users: merged });
          }
        }));

        tasks.push(runSupabaseTask('getTransactions', async () => {
          return await supabaseService.getTransactions();
        }, (remoteTxs) => {
          if (remoteTxs && remoteTxs.length > 0) {
            const transactionsMap = remoteTxs.map(t => ({
              id: t.id,
              tenantId: t.tenant_id || get().currentUser?.tenantId || 'tenant_default',
              invoiceNo: t.invoice_no,
              timestamp: t.timestamp || t.created_at || new Date().toISOString(),
              cashierName: t.cashier_name,
              items: t.items,
              totalAmount: Number(t.total_amount),
              shippingFee: Number(t.shipping_fee || 0),
              paymentMethod: t.payment_method === 'TEMPO' ? 'KASBON' : t.payment_method === 'QRIS' ? 'QRIS_SHARIAH' : t.payment_method === 'TRANSFER' ? 'TRANSFER_BSI' : t.payment_method,
              amountPaid: Number(t.amount_paid),
              changeAmount: Number(t.change_amount),
              zakatContribution: Number(t.zakat_contribution),
              marginContribution: Number(t.margin_contribution)
            }));
            set({ transactions: transactionsMap });
          }
        }));

        tasks.push(runSupabaseTask('getAuditLogs', async () => {
          return await supabaseService.getAuditLogs();
        }, (remoteLogs) => {
          if (remoteLogs && remoteLogs.length > 0) {
            const logsMap = remoteLogs.map(l => ({
              id: l.id,
              tenantId: l.tenant_id || get().currentUser?.tenantId || 'tenant_default',
              timestamp: l.timestamp || l.created_at || new Date().toISOString(),
              user: l.username,
              action: l.action,
              category: l.category || 'SYSTEM',
              details: l.details,
              ipAddress: l.ip_address
            }));
            set({ auditLogs: logsMap });
          }
        }));

        tasks.push(runSupabaseTask('getZakatRecords', async () => {
          return await supabaseService.getZakatRecords();
        }, (remoteZk) => {
          if (remoteZk && remoteZk.length > 0) {
            const zkMap = remoteZk.map(zk => ({
              id: zk.id,
              tenantId: zk.tenant_id || get().currentUser?.tenantId || 'tenant_default',
              timestamp: zk.timestamp || zk.created_at || new Date().toISOString(),
              goldPricePerGram: Number(zk.gold_price),
              nisabValue: Number(zk.nisab_value),
              liquidAssets: Number(zk.liquid_assets),
              inventoryValue: Number(zk.inventory_value),
              receivables: Number(zk.receivables),
              liabilities: Number(zk.liabilities),
              netWealth: Number(zk.net_wealth),
              isZakatRequired: zk.is_eligible,
              zakatDue: Number(zk.zakat_due),
              notes: zk.notes
            }));
            set({ zakatRecords: zkMap });
          }
        }));

        tasks.push(runSupabaseTask('getZakatDistributions', async () => {
          return await supabaseService.getZakatDistributions();
        }, (remoteZkd) => {
          if (remoteZkd && remoteZkd.length > 0) {
            const zkdMap = remoteZkd.map(zkd => ({
              id: zkd.id,
              tenantId: zkd.tenant_id || get().currentUser?.tenantId || 'tenant_default',
              timestamp: zkd.timestamp || zkd.created_at || new Date().toISOString(),
              amount: Number(zkd.amount),
              recipient: zkd.recipient,
              esgCategory: zkd.esg_category,
              description: zkd.description
            }));
            set({ zakatDistributions: zkdMap });
          }
        }));

        tasks.push(runSupabaseTask('getCoaAccounts', async () => {
          return await supabaseService.getCoaAccounts();
        }, (remoteCoa) => {
          if (remoteCoa && remoteCoa.length > 0) {
            const mapped = remoteCoa.map(c => ({
              id: c.id,
              tenantId: c.tenant_id,
              code: c.code,
              name: c.name,
              category: c.category,
              normalBalance: c.normal_balance,
              isActive: c.is_active
            }));
            set({ coaList: mapped });
          }
        }));
      }

      tasks.push(runSupabaseTask('fetchStoreSettings', async () => {
        await get().fetchStoreSettings();
      }, () => {}));

      if (!isCatalogOnly) {
        tasks.push(runSupabaseTask('getJournalEntries', async () => {
          return await supabaseService.getJournalEntries();
        }, (remoteJournals) => {
          if (remoteJournals && remoteJournals.length > 0) {
            const mapped = remoteJournals.map(j => ({
              id: j.id,
              tenantId: j.tenant_id,
              date: j.date,
              account: j.account,
              description: j.description,
              debit: Number(j.debit),
              credit: Number(j.credit),
              referenceId: j.reference_id,
              referenceType: j.reference_type,
              createdBy: j.created_by,
              branchId: j.branch_id
            }));
            set({ journalEntries: mapped });
          }
        }));

        tasks.push(runSupabaseTask('getSuppliers', async () => {
          return await (supabaseService as any).getSuppliers();
        }, (remoteSuppliers) => {
          if (remoteSuppliers && remoteSuppliers.length > 0) {
            const mapped = remoteSuppliers.map(s => ({
              id: s.id,
              tenantId: s.tenant_id,
              name: s.name,
              contactPerson: s.contact_person || '',
              phone: s.phone || '',
              address: s.address || '',
              debtAmount: Number(s.debt_amount || 0),
              branchId: s.branch_id,
              createdAt: s.created_at || new Date().toISOString()
            }));
            set({ suppliers: mapped });
          }
        }));

        tasks.push(runSupabaseTask('getPurchaseOrders', async () => {
          return await (supabaseService as any).getPurchaseOrders();
        }, (remotePOs) => {
          if (remotePOs && remotePOs.length > 0) {
            const mapped = remotePOs.map(po => ({
              id: po.id,
              tenantId: po.tenant_id,
              poNumber: po.po_number,
              date: po.date,
              supplier: po.supplier,
              items: po.items || [],
              totalAmount: Number(po.total_amount || 0),
              status: po.status,
              createdBy: po.created_by,
              notes: po.notes || '',
              branchId: po.branch_id,
              invoiceSupplier: po.invoice_supplier
            }));
            set({ purchaseOrders: mapped });
          }
        }));

        tasks.push(runSupabaseTask('fetchOnlineOrders', async () => {
          await get().fetchOnlineOrders();
        }, () => {}));
      }

      // Execute tasks in background without blocking the UI
      Promise.allSettled(tasks).catch(e => {
        console.warn('Supabase initialization encountered an unexpected error. Proceeding in offline-first mode.', e);
      });

      // Release UI immediately (max 1.5s delay to allow fast queries to complete and prevent flicker)
      if (shouldShowLoading) {
        setTimeout(() => set({ isLoading: false }), 1500);
      }
    } catch (e) {
      console.warn('Initialization error:', e);
      if (shouldShowLoading) {
        set({ isLoading: false });
      }
    }
  },

  fetchProducts: async () => {
    if (!isSupabaseConfigured) return;
    const doFetch = async (): Promise<void> => {
      const tenantId = get().currentUser?.tenantId || supabaseService.getTenantId();
      const remoteProducts = await supabaseService.getProducts();
      if (remoteProducts && remoteProducts.length > 0) {
        const localProducts = JSON.parse(localStorage.getItem('ksa_products') || '[]');
        const productsMap = remoteProducts.map(p => {
          const localP = localProducts.find((lp: any) => lp.id === p.id);
          return {
            id: p.id,
            tenantId: p.tenant_id || get().currentUser?.tenantId || 'tenant_default',
            sku: p.sku,
            name: p.name,
            category: p.category,
            price: Number(p.price),
            costPrice: Number(p.cost_price),
            stock: Number(p.stock),
            minStock: Number(p.min_stock),
            unit: p.unit,
            barcode: p.barcode || undefined,
            isHalal: p.is_halal,
            isPPOB: Boolean(p.is_ppob),
            image: p.image || localP?.image || undefined,
            expiryDate: p.expiry_date || localP?.expiryDate || undefined
          };
        });
        set({ products: productsMap });
        saveStorage('ksa_products', productsMap, tenantId);
        
        // Expiry Date Check Notification (Once per day)
        const todayStr = new Date().toISOString().split('T')[0];
        const lastCheck = localStorage.getItem('ksa_last_expiry_check');
        if (lastCheck !== todayStr) {
          const nearExpired = productsMap.filter((prod: any) => {
            if (prod.isPPOB || !prod.expiryDate) return false;
            const daysToExpiry = (new Date(prod.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            return daysToExpiry >= 0 && daysToExpiry <= 30;
          });
          
          if (nearExpired.length > 0) {
            get().addNotification({
              title: 'Peringatan Stok Mendekati Expired',
              message: `Terdapat ${nearExpired.length} produk yang mendekati masa kadaluarsa (<= 30 hari). Silakan periksa inventaris Anda.`,
              type: 'WARNING',
              link: '/inventory'
            });
            localStorage.setItem('ksa_last_expiry_check', todayStr);
          }
        }
      }
      return;
    };
    try {
      await doFetch();
      // If products still empty after first fetch, auto-retry after 5 seconds
      // This handles slow network conditions on mobile/external devices
      if (get().products.length === 0) {
        setTimeout(async () => {
          try {
            await doFetch();
            console.log('[Supabase] fetchProducts retry completed, total:', get().products.length);
          } catch (e) {
            console.warn('[Supabase] fetchProducts retry failed:', e);
          }
        }, 5000);
      }
    } catch (e) {
      console.warn('Failed to fetch products from Supabase:', e);
    }
  },

  fetchStoreSettings: async () => {
    if (!isSupabaseConfigured) return;
    try {
      const remoteSettings = await supabaseService.getStoreSettings();
      if (remoteSettings) {
        set({
          settings: {
            tenantId: remoteSettings.tenant_id,
            storeName: remoteSettings.store_name,
            storeAddress: remoteSettings.store_address,
            storePhone: remoteSettings.store_phone,
            businessType: remoteSettings.business_type,
            ownerWhatsapp: remoteSettings.owner_whatsapp,
            isTaxEnabled: Boolean(remoteSettings.is_tax_enabled),
            taxRate: Number(remoteSettings.tax_rate),
            paymentTimeoutMinutes: Number(remoteSettings.payment_timeout_minutes),
            storeLocationLat: remoteSettings.store_location_lat ? Number(remoteSettings.store_location_lat) : undefined,
            storeLocationLng: remoteSettings.store_location_lng ? Number(remoteSettings.store_location_lng) : undefined,
            maxDeliveryRadiusKm: Number(remoteSettings.max_delivery_radius_km) || 5,
            attendanceRadiusMeters: Number(remoteSettings.attendance_radius_meters) || 50,
            qrisEnabled: Boolean(remoteSettings.qris_enabled),
            qrisImageUrl: remoteSettings.qris_image_url || '',
            maintenanceMode: Boolean(remoteSettings.maintenance_mode),
            minimumCashBalance: Number(remoteSettings.minimum_cash_balance),
            pettyCashBalance: Number(remoteSettings.petty_cash_balance) || 0,
            zakatRate: Number(remoteSettings.zakat_rate),
            autoApproveTransactions: Boolean(remoteSettings.auto_approve_transactions),
            ownerBankName: remoteSettings.owner_bank_name || '',
            ownerBankAccount: remoteSettings.owner_bank_account || '',
            paymentMethods: remoteSettings.payment_methods || { bankTransfer: [], ewallet: [] },
            operationalHours: remoteSettings.operational_hours || {
              isOpen: true,
              openTime: '07:00',
              closeTime: '21:00',
              closedMessage: 'Maaf, toko sedang tutup.'
            }
          }
        });
      }
    } catch (e) {
      console.warn('Failed to fetch settings from Supabase:', e);
    }
  },

  fetchOnlineOrders: async () => {
    if (!isSupabaseConfigured) return;
    try {
      const remoteOrders = await supabaseService.getOnlineOrders();
      if (remoteOrders && remoteOrders.length > 0) {
        const mapped = remoteOrders.map(o => ({
          id: o.id,
          orderNo: o.order_no,
          tenantId: o.tenant_id,
          customerId: o.customer_id,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          customerAddress: o.customer_address,
          items: o.items,
          totalAmount: Number(o.total_amount),
          shippingFee: Number(o.shipping_fee || 0),
          status: o.status,
          notes: o.notes,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          paymentMethod: o.payment_method,
          paymentCode: o.payment_code,
          branchId: o.branch_id
        }));
        set({ onlineOrders: mapped });
      }
    } catch (e) {
      console.warn('Failed to fetch online orders from Supabase:', e);
    }
  },

  forceSyncAllToCloud: async () => {
    if (!isSupabaseConfigured) return;

    const state = get();
    const tenantId = state.currentUser?.tenantId || 'tenant_default';

    console.log('[Force Sync] Starting cloud sync for tenant:', tenantId);

    const syncTask = async (name: string, items: any[], callback: (item: any) => Promise<void>) => {
      if (!items || items.length === 0) {
        console.log(`[Force Sync] No ${name} to sync.`);
        return;
      }

      console.log(`[Force Sync] Syncing ${items.length} ${name}...`);
      // Process in batches of 20 to prevent browser request timeout
      const batchSize = 20;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(item => callback(item)));
      }
    };

    try {
      // Products can be bulk upserted in a single request for speed
      try {
        console.log(`[Force Sync] Bulk syncing ${state.products.length} products...`);
        await supabaseService.saveProductsBulk(state.products);
      } catch (err) {
        console.warn('Failed to bulk sync products, falling back to batch sync:', err);
        await syncTask('products', state.products, async (product) => {
          await supabaseService.saveProduct(product);
        });
      }

      await Promise.allSettled([
        syncTask('customers', state.customers, async (customer) => {
          await supabaseService.saveCustomer(customer);
        }),
        syncTask('transactions', state.transactions, async (transaction) => {
          await (supabaseService as any).saveTransaction(transaction);
        }),
        syncTask('online orders', state.onlineOrders, async (order) => {
          await supabaseService.saveOnlineOrder(order);
        }),
        syncTask('coa accounts', state.coaList, async (coa) => {
          await (supabaseService as any).saveCoaAccount(coa);
        }),
        syncTask('suppliers', state.suppliers, async (supplier) => {
          await (supabaseService as any).saveSupplier(supplier);
        }),
        syncTask('purchase orders', state.purchaseOrders, async (po) => {
          await (supabaseService as any).savePurchaseOrder(po);
        }),
        syncTask('journal entries', state.journalEntries, async (journal) => {
          await (supabaseService as any).saveJournalEntry(journal);
        }),
        syncTask('ksa users', state.users, async (user) => {
          await (supabaseService as any).saveUser(user);
        }),
        syncTask('zakat records', state.zakatRecords, async (record) => {
          await (supabaseService as any).saveZakatRecord(record);
        }),
        syncTask('zakat distributions', state.zakatDistributions, async (dist) => {
          await (supabaseService as any).saveZakatDistribution(dist);
        }),
      ]);

      try {
        console.log('[Force Sync] Syncing settings...');
        await supabaseService.saveStoreSettings(state.settings);
      } catch (e) {
        console.warn('Failed to sync settings:', e);
      }

      const recentLogs = state.auditLogs.slice(0, 100);
      await syncTask('audit logs', recentLogs, async (log) => {
        await supabaseService.saveAuditLog(log);
      });

      console.log('[Force Sync] Cloud sync completed successfully.');
    } catch (e) {
      console.error('[Force Sync] Error:', e);
    }
  }
}));
