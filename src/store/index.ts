import { create } from 'zustand';
import { Product, CartItem, Transaction, AuditLog, ZakatCalculation, ZakatDistribution, CurrentUser, Expense, ClosingRecord, UserRole, UserAccount, PurchaseOrder, JournalEntry, JournalSourceType, Branch, Customer, Supplier, Promo, Attendance, StoreSettings, StockMovement, OnlineOrder, ChatMessage } from '../types';
import { supabaseService, isSupabaseConfigured } from '../lib/supabase';

interface AppState {
  tenants: import('../types').Tenant[];
  registerTenant: (tenant: Omit<import('../types').Tenant, 'id' | 'status' | 'createdAt'>) => void;
  approveTenant: (tenantId: string) => void;
  loadTenantData: (tenantId: string) => void;

  products: Product[];
  cart: CartItem[];
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
  customers: Customer[];
  suppliers: Supplier[];
  promos: Promo[];
  attendances: Attendance[];
  
  // Phase 2 features
  settings: StoreSettings;
  stockMovements: StockMovement[];
  activeBranchId: string;

  // Settings
  updateSettings: (settings: Partial<StoreSettings>) => void;
  
  // Stock Movement
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'date' | 'userId'>) => void;
  
  // Branch Filter
  setActiveBranchId: (branchId: string) => void;
  
  // Void
  voidTransaction: (txId: string, reason: string) => void;

  // Branch Actions
  addBranch: (branch: Omit<Branch, 'id' | 'createdAt'>) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;

  // CRM & Supplier
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
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
  clockOut: (attendanceId: string) => void;

  // Auth Actions
  login: (username: string, password: string) => 'SUCCESS' | 'PENDING' | 'INVALID';
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

  // Cart Actions (Admin)
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Customer Portal Actions
  addToCustomerCart: (product: Product) => void;
  removeFromCustomerCart: (productId: string) => void;
  updateCustomerCartQuantity: (productId: string, quantity: number) => void;
  clearCustomerCart: () => void;
  submitOnlineOrder: (customerId: string, customerName: string, customerPhone: string, notes?: string) => void;
  updateOrderStatus: (orderId: string, status: OnlineOrder['status']) => void;
  sendChatMessage: (orderId: string, senderId: string, senderName: string, text: string) => void;
  processOnlineOrderPayment: (orderId: string, paymentMethod: 'CASH' | 'TRANSFER_BSI' | 'QRIS_SHARIAH') => void;
  
  // Transaction Actions
  checkout: (options: {
    paymentMethod: 'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI' | 'KASBON';
    amountPaid: number;
    customerId?: string;
    promoId?: string;
    splitPayments?: { method: 'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI'; amount: number }[];
  }) => Transaction | null;
  
  // Product/Stock actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, amount: number) => void;
  
  // Zakat Actions
  addZakatRecord: (record: Omit<ZakatCalculation, 'id' | 'timestamp'>) => void;
  addZakatDistribution: (dist: Omit<ZakatDistribution, 'id' | 'timestamp'>) => void;
  
  // Expenses & Closing Actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdBy'>) => void;
  deleteExpense: (id: string) => void;
  addClosing: (closing: Omit<ClosingRecord, 'id' | 'timestamp' | 'createdBy'>) => void;
  clearAllData: () => void;

  // System Log API
  addLog: (action: string, category: AuditLog['category'], details: string) => void;
  
  // Supabase Initial Sync
  initializeStore: () => Promise<void>;
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'prod_1', sku: 'BRS-001', name: 'Beras Premium Cianjur 5kg', category: 'Sembako', price: 78000, costPrice: 68000, stock: 45, minStock: 10, unit: 'Pack', isHalal: true, barcode: '8991234560012', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_2', sku: 'MNG-002', name: 'Minyak Goreng SunCo 2L', category: 'Sembako', price: 34500, costPrice: 29000, stock: 32, minStock: 8, unit: 'Botol', isHalal: true, barcode: '8991234560029', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_3', sku: 'GLA-003', name: 'Gula Pasir Gulaku 1kg', category: 'Sembako', price: 17500, costPrice: 15000, stock: 40, minStock: 12, unit: 'Pack', isHalal: true, barcode: '8991234560036', image: 'https://images.unsplash.com/photo-1581428982868-e410dd147a90?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_4', sku: 'TLR-004', name: 'Telur Ayam Negeri 1kg', category: 'Sembako', price: 28000, costPrice: 24000, stock: 15, minStock: 15, unit: 'Kg', isHalal: true, barcode: '8991234560043', image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_5', sku: 'BND-005', name: 'Ikan Bandeng Segar (Tanpa Duri)', category: 'Fresh Food', price: 42000, costPrice: 35000, stock: 8, minStock: 5, unit: 'Pack', isHalal: true, barcode: '8991234560050', image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_6', sku: 'KPP-006', name: 'Kopi Kapal Api 380g', category: 'Minuman', price: 24900, costPrice: 21500, stock: 24, minStock: 6, unit: 'Pack', isHalal: true, barcode: '8991234560067', image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_7', sku: 'TEH-007', name: 'Teh Celup Sariwangi isi 50', category: 'Minuman', price: 11000, costPrice: 9000, stock: 40, minStock: 8, unit: 'Kotak', isHalal: true, barcode: '8991234560074', image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8c0a1?auto=format&fit=crop&q=80&w=300' },
  { id: 'prod_8', sku: 'SBN-008', name: 'Sabun Lifebuoy Cair Refill 450ml', category: 'Kebutuhan Rumah', price: 23500, costPrice: 19500, stock: 18, minStock: 5, unit: 'Pouch', isHalal: true, barcode: '8991234560081', image: 'https://images.unsplash.com/photo-1584824486516-0555a07fc511?auto=format&fit=crop&q=80&w=300' }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    invoiceNo: 'INV-20260607-001',
    timestamp: '2026-06-07T03:00:00Z',
    cashierName: 'Kasir Asy',
    items: [
      { productId: 'prod_1', productName: 'Beras Premium Cianjur 5kg', quantity: 1, price: 78000, costPrice: 68000 },
      { productId: 'prod_2', productName: 'Minyak Goreng SunCo 2L', quantity: 2, price: 34500, costPrice: 29000 }
    ],
    totalAmount: 147000,
    paymentMethod: 'CASH',
    amountPaid: 150000,
    changeAmount: 3000,
    zakatContribution: 525, // 2.5% of (147k - 126k profit = 21k profit => 21k * 2.5% = 525)
    marginContribution: 21000
  },
  {
    id: 'tx_2',
    invoiceNo: 'INV-20260607-002',
    timestamp: '2026-06-07T03:15:00Z',
    cashierName: 'Kasir Asy',
    items: [
      { productId: 'prod_3', productName: 'Gula Pasir Gulaku 1kg', quantity: 3, price: 17500, costPrice: 15000 },
      { productId: 'prod_4', productName: 'Telur Ayam Negeri 1kg', quantity: 1, price: 28000, costPrice: 24000 },
      { productId: 'prod_5', productName: 'Ikan Bandeng Segar (Tanpa Duri)', quantity: 1, price: 42000, costPrice: 35000 }
    ],
    totalAmount: 122500,
    paymentMethod: 'QRIS_SHARIAH',
    amountPaid: 122500,
    changeAmount: 0,
    zakatContribution: 462.5, // 2.5% of 18.5k margin
    marginContribution: 18500
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  { id: 'log_1', timestamp: '2026-06-07T02:00:00Z', user: 'Kasir Asy', action: 'LOGIN', category: 'SYSTEM', details: 'Sesi kasir dimulai - BA Mart', ipAddress: '192.168.1.15' },
  { id: 'log_2', timestamp: '2026-06-07T02:15:00Z', user: 'Kasir Asy', action: 'STOCK_CHECK', category: 'INVENTORY', details: 'Pemeriksaan stok harian produk sembako', ipAddress: '192.168.1.15' }
];

const DEFAULT_ZAKAT_RECORDS: ZakatCalculation[] = [
  {
    id: 'zk_1',
    timestamp: '2026-06-07T02:30:00Z',
    goldPricePerGram: 1450000,
    nisabValue: 123250000, // 85 * 1.45m
    liquidAssets: 85000000,
    inventoryValue: 48000000,
    receivables: 5000000,
    liabilities: 12000000,
    netWealth: 126000000,
    isZakatRequired: true,
    zakatDue: 3150000,
    notes: 'Kalkulasi Zakat Perdagangan - Sesuai FATWA MUI'
  }
];

const DEFAULT_ZAKAT_DISTRIBUTIONS: ZakatDistribution[] = [
  {
    id: 'zkd_1',
    timestamp: '2020-06-05T08:00:00Z',
    amount: 1500000,
    recipient: 'Fakir Miskin Sekitar Tazkia',
    esgCategory: 'SOCIAL',
    description: 'Penyaluran sembako bahan pokok pangan gratis untuk dhuafa terdekat'
  },
  {
    id: 'zkd_2',
    timestamp: '2020-06-03T10:00:00Z',
    amount: 1200000,
    recipient: 'Gharimin UMKM Binaan',
    esgCategory: 'GOVERNANCE',
    description: 'Bantuan modal bebas riba untuk melunasi utang usaha pedagang kecil'
  },
  {
    id: 'zkd_3',
    timestamp: '2020-06-01T14:30:00Z',
    amount: 800000,
    recipient: 'Fisabilillah Kampus Tazkia',
    esgCategory: 'ENVIRONMENTAL',
    description: 'Penyediaan pack ramah lingkungan sebagai kampanye zero-plastic pembagian zakat'
  }
];

const getSavedUsers = (): UserAccount[] => {
  const saved = localStorage.getItem('ba_users');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return [
    { id: 'usr_0', tenantId: '', name: 'Platform Admin', username: 'superadmin.platform', password: 'superadmin123!', role: 'SUPERADMIN', createdAt: new Date().toISOString(), isActive: true, isApproved: true },
    { id: 'usr_1', tenantId: 'tenant_default', name: 'Kasir Asy', username: 'asy.23.kk', password: 'kasir123!', role: 'CASHIER', createdAt: new Date().toISOString(), isActive: true, isApproved: true },
    { id: 'usr_2', tenantId: 'tenant_default', name: 'Superadmin BA', username: 'superadmin.23kk', password: 'admin123!', role: 'ADMIN', createdAt: new Date().toISOString(), isActive: true, isApproved: true },
    { id: 'usr_3', tenantId: 'tenant_default', name: 'Owner BA', username: 'owner.23kk', password: 'owner123!', role: 'OWNER', createdAt: new Date().toISOString(), isActive: true, isApproved: true },
    { id: 'usr_4', tenantId: 'tenant_default', name: 'Pelanggan Setia', username: 'pelanggan1', password: 'password123', role: 'PELANGGAN', createdAt: new Date().toISOString(), isActive: true, isApproved: true }
  ];
};

const getSavedPurchaseOrders = (): PurchaseOrder[] => {
  const saved = localStorage.getItem('ba_purchase_orders');
  if (saved) { try { return JSON.parse(saved); } catch (e) {} }
  return [];
};

const getSavedJournalEntries = (): JournalEntry[] => {
  const saved = localStorage.getItem('ba_journal_entries');
  if (saved) { try { return JSON.parse(saved); } catch (e) {} }
  return [];
};

const getSavedExpenses = (): Expense[] => {
  const saved = localStorage.getItem('ba_expenses');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [
    { id: 'exp_1', date: '2026-06-01', category: 'SEWA_LAPAK', amount: 500000, description: 'Sewa Lapak Mart Bulanan', createdBy: 'Superadmin BA' },
    { id: 'exp_2', date: '2026-06-03', category: 'LISTRIK_AIR_WIFI', amount: 200000, description: 'Listrik & Wi-fi Toko', createdBy: 'Superadmin BA' },
    { id: 'exp_3', date: '2026-06-05', category: 'GAJI', amount: 1000000, description: 'Gaji Bulanan Staff Utama', createdBy: 'Superadmin BA' }
  ];
};

const getSavedClosings = (): ClosingRecord[] => {
  const saved = localStorage.getItem('ba_closings');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [
    {
      id: 'cls_1',
      date: '2026-05-31',
      type: 'MONTHLY',
      revenue: 4200000,
      expensesTotal: 1700000,
      netProfit: 2500000,
      zakatContribution: 62500,
      isBalanced: true,
      notes: 'Penutupan Buku Final Bulanan Mei 2026',
      createdBy: 'Superadmin BA',
      timestamp: '2026-05-31T23:59:00Z'
    }
  ];
};

const getSavedProducts = (): Product[] => {
  const saved = localStorage.getItem('ba_products');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return DEFAULT_PRODUCTS;
};

const getSavedTransactions = (): Transaction[] => {
  const saved = localStorage.getItem('ba_transactions');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return DEFAULT_TRANSACTIONS;
};

const getSavedAuditLogs = (): AuditLog[] => {
  const saved = localStorage.getItem('ba_audit_logs');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return DEFAULT_AUDIT_LOGS;
};

const getSavedZakatRecords = (): ZakatCalculation[] => {
  const saved = localStorage.getItem('ba_zakat_records');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return DEFAULT_ZAKAT_RECORDS;
};

const getSavedZakatDistributions = (): ZakatDistribution[] => {
  const saved = localStorage.getItem('ba_zakat_distributions');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return DEFAULT_ZAKAT_DISTRIBUTIONS;
};

const getSavedBranches = (): Branch[] => {
  const saved = localStorage.getItem('ba_branches');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [
    { id: 'br_1', name: 'BA Mart Pusat Tazkia', address: 'Kampus Tazkia Sentul', phone: '08123456789', isActive: true, createdAt: new Date().toISOString() }
  ];
};

const getSavedCustomers = (): Customer[] => {
  const saved = localStorage.getItem('ba_customers');
  if (saved) { try { return JSON.parse(saved); } catch (e) {} }
  return [];
};

const getSavedSuppliers = (): Supplier[] => {
  const saved = localStorage.getItem('ba_suppliers');
  if (saved) { try { return JSON.parse(saved); } catch (e) {} }
  return [];
};

const getSavedPromos = (): Promo[] => {
  const saved = localStorage.getItem('ba_promos');
  if (saved) { try { return JSON.parse(saved); } catch (e) {} }
  return [];
};

const getSavedAttendances = (): Attendance[] => {
  const saved = localStorage.getItem('ba_attendances');
  if (saved) { try { return JSON.parse(saved); } catch (e) {} }
  return [];
};

const getSavedSettings = (): StoreSettings => {
  const saved = localStorage.getItem('ba_settings');
  if (saved) { try { return JSON.parse(saved); } catch (e) {} }
  return { 
    isTaxEnabled: false, 
    taxRate: 11,
    ownerBankName: 'BSI (Bank Syariah Indonesia)',
    ownerBankAccount: '7182938495',
    qrisEnabled: true,
    businessType: 'KOPERASI'
  };
};

const getSavedStockMovements = (): StockMovement[] => {
  const saved = localStorage.getItem('ba_stock_movements');
  if (saved) { try { return JSON.parse(saved); } catch (e) {} }
  return [];
};

const getSavedOnlineOrders = (): OnlineOrder[] => {
  const saved = localStorage.getItem('ba_online_orders');
  if (saved) { try { return JSON.parse(saved); } catch (e) {} }
  return [];
};

const getSavedChatMessages = (): ChatMessage[] => {
  const saved = localStorage.getItem('ba_chat_messages');
  if (saved) { try { return JSON.parse(saved); } catch (e) {} }
  return [];
};

export const useAppStore = create<AppState>((set, get) => ({
  tenants: (() => {
    const saved = localStorage.getItem('ba_tenants');
    const parsed = saved ? JSON.parse(saved) : [];
    // Ensure default tenant always exists for demo data
    if (!parsed.find((t: any) => t.id === 'tenant_default')) {
      const defaultTenant = {
        id: 'tenant_default',
        name: 'BA Mart Syariah',
        ownerName: 'Owner BA',
        email: 'owner.23kk',
        phone: '081234567890',
        address: 'Jl. Contoh No.1, Jakarta',
        businessType: 'KOPERASI' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString()
      };
      parsed.unshift(defaultTenant);
      localStorage.setItem('ba_tenants', JSON.stringify(parsed));
    }
    return parsed;
  })(),
  products: getSavedProducts(),
  cart: [],
  customerCart: [],
  transactions: getSavedTransactions(),
  onlineOrders: getSavedOnlineOrders(),
  chatMessages: getSavedChatMessages(),
  auditLogs: getSavedAuditLogs(),
  zakatRecords: getSavedZakatRecords(),
  zakatDistributions: getSavedZakatDistributions(),
  currentUser: null, // Forces user log in first
  isLoading: false,
  expenses: getSavedExpenses(),
  closings: getSavedClosings(),
  users: getSavedUsers(),
  purchaseOrders: getSavedPurchaseOrders(),
  journalEntries: getSavedJournalEntries(),
  branches: getSavedBranches(),
  customers: getSavedCustomers(),
  suppliers: getSavedSuppliers(),
  promos: getSavedPromos(),
  attendances: getSavedAttendances(),
  settings: getSavedSettings(),
  stockMovements: getSavedStockMovements(),
  activeBranchId: '', // Default to global view initially

  // Branch implementations
  setActiveBranchId: (branchId) => set({ activeBranchId: branchId }),

  // Settings
  updateSettings: (updates) => {
    const updated = { ...get().settings, ...updates };
    set({ settings: updated });
    saveStorage('ba_settings', updated, get().currentUser?.tenantId);
    get().addLog('SETTINGS_UPDATE', 'SYSTEM', 'Update pengaturan toko (Pajak)');
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
    saveStorage('ba_stock_movements', updated, get().currentUser?.tenantId);
  },

  // Void
  voidTransaction: (txId, reason) => {
    const { transactions, currentUser, products, journalEntries } = get();
    if (!currentUser) return;
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.isVoided) return;

    // 1. Mark as voided
    const updatedTx = { ...tx, isVoided: true, voidReason: reason };
    const updatedTransactions = transactions.map(t => t.id === txId ? updatedTx : t);

    // 2. Rollback stocks
    let updatedProducts = [...products];
    tx.items.forEach(item => {
      const prod = updatedProducts.find(p => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
      }
      get().addStockMovement({
        productId: item.productId,
        type: 'IN',
        qty: item.quantity,
        reason: `VOID: ${tx.invoiceNo} - ${reason}`,
        branchId: tx.branchId
      });
    });

    // 3. Rollback journal (Create reversing entries)
    const now = new Date().toISOString();
    const jId = `je_void_${Date.now()}`;
    const reversingJournals: JournalEntry[] = [];
    
    // Find all journals related to this tx
    const relatedJournals = journalEntries.filter(j => j.referenceId === tx.id);
    relatedJournals.forEach((j, i) => {
      reversingJournals.push({
        id: `${jId}_${i}`,
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

    saveStorage('ba_transactions', updatedTransactions, get().currentUser?.tenantId);
    saveStorage('ba_products', updatedProducts, get().currentUser?.tenantId);
    saveStorage('ba_journal_entries', updatedJournals, get().currentUser?.tenantId);

    get().addLog('TRANSACTION_VOID', 'POS', `Void transaksi ${tx.invoiceNo}: ${reason}`);
  },

  addBranch: (branchData) => {
    const newBranch: Branch = {
      ...branchData,
      id: `br_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [...get().branches, newBranch];
    set({ branches: updated });
    saveStorage('ba_branches', updated, get().currentUser?.tenantId);
    get().addLog('BRANCH_ADD', 'SYSTEM', `Menambah cabang baru: ${newBranch.name}`);
  },

  updateBranch: (id, updates) => {
    const updated = get().branches.map(b => b.id === id ? { ...b, ...updates } : b);
    set({ branches: updated });
    saveStorage('ba_branches', updated, get().currentUser?.tenantId);
    get().addLog('BRANCH_UPDATE', 'SYSTEM', `Update data cabang: ${updated.find(b => b.id === id)?.name}`);
  },

  deleteBranch: (id) => {
    const branch = get().branches.find(b => b.id === id);
    const updated = get().branches.filter(b => b.id !== id);
    set({ branches: updated });
    saveStorage('ba_branches', updated, get().currentUser?.tenantId);
    if (branch) {
      get().addLog('BRANCH_DELETE', 'SYSTEM', `Menghapus cabang: ${branch.name}`);
    }
  },

  // CRM & Supplier
  addCustomer: (customerData) => {
    const newCustomer: Customer = { ...customerData, id: `cust_${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [...get().customers, newCustomer];
    set({ customers: updated });
    saveStorage('ba_customers', updated, get().currentUser?.tenantId);
    get().addLog('CUSTOMER_ADD', 'SYSTEM', `Menambah pelanggan: ${newCustomer.name}`);
  },
  updateCustomer: (id, updates) => {
    const updated = get().customers.map(c => c.id === id ? { ...c, ...updates } : c);
    set({ customers: updated });
    saveStorage('ba_customers', updated, get().currentUser?.tenantId);
    get().addLog('CUSTOMER_UPDATE', 'SYSTEM', `Update pelanggan ID: ${id}`);
  },
  deleteCustomer: (id) => {
    const updated = get().customers.filter(c => c.id !== id);
    set({ customers: updated });
    saveStorage('ba_customers', updated, get().currentUser?.tenantId);
    get().addLog('CUSTOMER_DELETE', 'SYSTEM', `Menghapus pelanggan ID: ${id}`);
  },

  addSupplier: (supplierData) => {
    const newSupplier: Supplier = { ...supplierData, id: `sup_${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [...get().suppliers, newSupplier];
    set({ suppliers: updated });
    saveStorage('ba_suppliers', updated, get().currentUser?.tenantId);
    get().addLog('SUPPLIER_ADD', 'SYSTEM', `Menambah supplier: ${newSupplier.name}`);
  },
  updateSupplier: (id, updates) => {
    const updated = get().suppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    set({ suppliers: updated });
    saveStorage('ba_suppliers', updated, get().currentUser?.tenantId);
    get().addLog('SUPPLIER_UPDATE', 'SYSTEM', `Update supplier ID: ${id}`);
  },
  deleteSupplier: (id) => {
    const updated = get().suppliers.filter(s => s.id !== id);
    set({ suppliers: updated });
    saveStorage('ba_suppliers', updated, get().currentUser?.tenantId);
    get().addLog('SUPPLIER_DELETE', 'SYSTEM', `Menghapus supplier ID: ${id}`);
  },

  // Promos
  addPromo: (promoData) => {
    const newPromo: Promo = { ...promoData, id: `prm_${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [...get().promos, newPromo];
    set({ promos: updated });
    saveStorage('ba_promos', updated, get().currentUser?.tenantId);
    get().addLog('PROMO_ADD', 'SYSTEM', `Menambah promo: ${newPromo.name}`);
  },
  updatePromo: (id, updates) => {
    const updated = get().promos.map(p => p.id === id ? { ...p, ...updates } : p);
    set({ promos: updated });
    saveStorage('ba_promos', updated, get().currentUser?.tenantId);
    get().addLog('PROMO_UPDATE', 'SYSTEM', `Update promo ID: ${id}`);
  },
  deletePromo: (id) => {
    const updated = get().promos.filter(p => p.id !== id);
    set({ promos: updated });
    saveStorage('ba_promos', updated, get().currentUser?.tenantId);
    get().addLog('PROMO_DELETE', 'SYSTEM', `Menghapus promo ID: ${id}`);
  },

  // Attendance
  clockIn: (userId, userName, photoUrl, latitude, longitude) => {
    const newAtt: Attendance = {
      id: `att_${Date.now()}`,
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
    saveStorage('ba_attendances', updated, get().currentUser?.tenantId);
    get().addLog('ATTENDANCE', 'SYSTEM', `${userName} Clock-In Shift`);
  },
  clockOut: (attendanceId) => {
    const updated = get().attendances.map(a => 
      a.id === attendanceId ? { ...a, clockOut: new Date().toISOString() } : a
    );
    set({ attendances: updated });
    saveStorage('ba_attendances', updated, get().currentUser?.tenantId);
    get().addLog('ATTENDANCE', 'SYSTEM', `Selesai Shift (Clock-Out) ID: ${attendanceId}`);
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
    saveStorage('ba_tenants', updatedTenants);
  },

  approveTenant: (tenantId) => {
    const tenants = get().tenants;
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    tenant.status = 'ACTIVE';
    set({ tenants: [...tenants] });
    saveStorage('ba_tenants', get().tenants);

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
    
    const users = getStorage('ba_users') || [];
    users.push(ownerAccount);
    saveStorage('ba_users', users);
  },

  loadTenantData: (tenantId) => {
    set({
      settings: getStorage('ba_settings', tenantId) || { isTaxEnabled: false, taxRate: 11, businessType: 'KOPERASI', tenantId },
      stockMovements: getStorage('ba_stock_movements', tenantId) || [],
      transactions: getStorage('ba_transactions', tenantId) || [],
      products: getStorage('ba_products', tenantId) || [],
      journalEntries: getStorage('ba_journal_entries', tenantId) || [],
      branches: getStorage('ba_branches', tenantId) || [],
      customers: getStorage('ba_customers', tenantId) || [],
      suppliers: getStorage('ba_suppliers', tenantId) || [],
      promos: getStorage('ba_promos', tenantId) || [],
      attendances: getStorage('ba_attendances', tenantId) || [],
      onlineOrders: getStorage('ba_online_orders', tenantId) || [],
      chatMessages: getStorage('ba_chat_messages', tenantId) || [],
      zakatRecords: getStorage('ba_zakat_records', tenantId) || [],
      zakatDistributions: getStorage('ba_zakat_distributions', tenantId) || [],
      purchaseOrders: getStorage('ba_purchase_orders', tenantId) || [],
      expenses: getStorage('ba_expenses', tenantId) || [],
      closings: getStorage('ba_closings', tenantId) || [],
      auditLogs: getStorage('ba_audit_logs', tenantId) || []
    });
  },

  login: (username, password) => {
    const { users } = get();
    const foundUser = users.find(u => u.username === username && u.password === password && u.isActive);

    if (!foundUser) return 'INVALID';
    if (!foundUser.isApproved) return 'PENDING';

    const authUser: CurrentUser = { 
      name: foundUser.name, 
      username: foundUser.username, 
      role: foundUser.role, 
      branchId: foundUser.branchId,
      tenantId: foundUser.tenantId || ''
    };
    set({ currentUser: authUser, activeBranchId: foundUser.branchId || '' });

    // If not SUPERADMIN, load tenant-specific data
    if (foundUser.role !== 'SUPERADMIN' && foundUser.tenantId) {
      get().loadTenantData(foundUser.tenantId);
    }
    
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: authUser.name,
      action: 'LOGIN',
      category: 'SYSTEM',
      details: `LOGIN Sukses: ${authUser.name} (${authUser.role})`,
      ipAddress: '192.168.1.15'
    };
    set(state => ({ auditLogs: [log, ...state.auditLogs] }));
    if (isSupabaseConfigured) { supabaseService.saveAuditLog(log); }
    return 'SUCCESS';
  },


  logout: () => {
    const { currentUser } = get();
    if (currentUser) {
      const log: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        action: 'LOGOUT',
        category: 'SYSTEM',
        details: `LOGOUT Sukses: ${currentUser.name}`,
        ipAddress: '192.168.1.15'
      };
      set(state => ({ auditLogs: [log, ...state.auditLogs] }));
      if (isSupabaseConfigured) {
        supabaseService.saveAuditLog(log);
      }
    }
    set({ currentUser: null, cart: [], customerCart: [], activeBranchId: '' });
  },

  // Cart implementations (Admin)
  addToCart: (product: Product) => {
    const { cart } = get();
    if (product.stock <= 0) return;
    
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      set({
        cart: cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      set({ cart: [...cart, { product, quantity: 1 }] });
    }
  },
  
  removeFromCart: (productId: string) => {
    set({ cart: get().cart.filter(item => item.product.id !== productId) });
  },
  
  updateCartQuantity: (productId: string, quantity: number) => {
    const { cart } = get();
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    
    const newQty = Math.min(quantity, item.product.stock);
    set({
      cart: cart.map(i =>
        i.product.id === productId ? { ...i, quantity: newQty } : i
      )
    });
  },
  
  clearCart: () => set({ cart: [] }),

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

  submitOnlineOrder: (customerId, customerName, customerPhone, notes) => {
    const { customerCart } = get();
    if (customerCart.length === 0) return;

    const baseTotal = customerCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const orderNo = `ORD-${Date.now()}`;
    const newOrder: OnlineOrder = {
      id: `oo_${Date.now()}`,
      orderNo,
      customerId,
      customerName,
      customerPhone,
      items: customerCart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        price: i.product.price
      })),
      totalAmount: baseTotal,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes
    };

    const updatedOrders = [newOrder, ...get().onlineOrders];
    set({ onlineOrders: updatedOrders, customerCart: [] });
    saveStorage('ba_online_orders', updatedOrders, get().currentUser?.tenantId);

    // Mock Whatsapp Notification
    console.log(`SEND WA TO 082210027952: Ada Pesanan Baru ${orderNo} dari ${customerName} sebesar Rp ${baseTotal.toLocaleString('id-ID')}`);
  },

  updateOrderStatus: (orderId, status) => {
    const updatedOrders = get().onlineOrders.map(o => 
      o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
    );
    set({ onlineOrders: updatedOrders });
    saveStorage('ba_online_orders', updatedOrders, get().currentUser?.tenantId);
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
        const itemCost = updatedProducts[prodIndex].costPrice || 0;
        totalCost += (itemCost * item.quantity);
        updatedProducts[prodIndex].stock -= item.quantity;
        get().addStockMovement({
          productId: item.productId,
          type: 'OUT',
          qty: item.quantity,
          reason: `Pesanan Online ${order.orderNo}`,
          branchId: order.branchId
        });
      }
    });

    const marginContribution = totalAmount - totalCost;
    const zakatContribution = marginContribution > 0 ? marginContribution * 0.025 : 0;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
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
    const newJournals: JournalEntry[] = [
      {
        id: `je_1_${Date.now()}`,
        date: now,
        account: paymentMethod === 'TRANSFER_BSI' ? '1-1002 Kas di Bank' : '1-1001 Kas Tunai',
        description: `Penerimaan Online ${invoiceNo}`,
        debit: totalAmount,
        credit: 0,
        referenceId: newTx.id,
        referenceType: 'AUTO_TRANSAKSI',
        createdBy: currentUser.name,
        branchId: order.branchId
      },
      {
        id: `je_2_${Date.now()}`,
        date: now,
        account: '4-1001 Pendapatan Penjualan',
        description: `Penjualan Online ${invoiceNo}`,
        debit: 0,
        credit: totalAmount,
        referenceId: newTx.id,
        referenceType: 'AUTO_TRANSAKSI',
        createdBy: currentUser.name,
        branchId: order.branchId
      }
    ];

    const updatedTxs = [newTx, ...transactions];
    const updatedJournals = [...newJournals, ...journalEntries];
    set({ 
      products: updatedProducts, 
      transactions: updatedTxs,
      journalEntries: updatedJournals
    });
    
    saveStorage('ba_products', updatedProducts, get().currentUser?.tenantId);
    saveStorage('ba_transactions', updatedTxs, get().currentUser?.tenantId);
    saveStorage('ba_journal_entries', updatedJournals, get().currentUser?.tenantId);

    get().addLog('ONLINE_ORDER_COMPLETE', 'FINANCE', `Pesanan Online ${order.orderNo} diselesaikan dan dibayar via ${paymentMethod}`);
    get().updateOrderStatus(orderId, 'COMPLETED');
  },

  sendChatMessage: (orderId, senderId, senderName, text) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      orderId,
      senderId,
      senderName,
      text,
      timestamp: new Date().toISOString()
    };
    const updatedMsgs = [...get().chatMessages, newMessage];
    set({ chatMessages: updatedMsgs });
    saveStorage('ba_chat_messages', updatedMsgs, get().currentUser?.tenantId);
  },
  
  // Checkout Implementation
  checkout: (options) => {
    const { paymentMethod, amountPaid, customerId, promoId, splitPayments } = options;
    const { cart, currentUser, products, customers, promos, settings, addStockMovement } = get();
    if (cart.length === 0 || !currentUser) return null;
    
    // Dynamic pricing for wholesale
    const getDynamicPrice = (item: CartItem) => {
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

    let totalAmount = baseTotal - discountAmount;
    let taxAmount = 0;
    if (settings.isTaxEnabled) {
      taxAmount = totalAmount * (settings.taxRate / 100);
      totalAmount += taxAmount;
    }

    const marginContribution = totalAmount - taxAmount - totalCost; // Tax is not profit
    const zakatContribution = marginContribution > 0 ? marginContribution * 0.025 : 0; // 2.5% shariah margin zakat
    
    let actualPaid = splitPayments ? splitPayments.reduce((s, p) => s + p.amount, 0) : amountPaid;
    if (paymentMethod === 'KASBON') {
      actualPaid = 0;
    }
    const changeAmount = actualPaid > totalAmount ? actualPaid - totalAmount : 0;
    
    if (paymentMethod !== 'KASBON' && actualPaid < totalAmount) return null;
    
    const customer = customers.find(c => c.id === customerId);
    const invoiceNo = `INV-20260607-${Math.floor(100 + Math.random() * 900)}`;
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      invoiceNo,
      timestamp: new Date().toISOString(),
      cashierName: currentUser.name,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: getDynamicPrice(item),
        costPrice: item.product.costPrice
      })),
      totalAmount,
      paymentMethod,
      amountPaid: actualPaid,
      changeAmount,
      zakatContribution,
      marginContribution,
      customerId,
      customerName: customer?.name,
      promoId,
      discountAmount,
      taxAmount,
      splitPayments,
      branchId: currentUser.branchId
    };
    
    // Deduct stocks
    const updatedProducts = products.map(prod => {
      const cartItem = cart.find(c => c.product.id === prod.id);
      if (cartItem) {
        const remainingStock = Math.max(0, prod.stock - cartItem.quantity);
        const updated = { ...prod, stock: remainingStock };
        if (isSupabaseConfigured) { supabaseService.saveProduct(updated); }
        return updated;
      }
      return prod;
    });
    
    set({
      products: updatedProducts,
      transactions: [newTx, ...get().transactions],
      cart: []
    });
    
    // Save to localStorage immediately
    saveStorage('ba_products', updatedProducts, get().currentUser?.tenantId);
    saveStorage('ba_transactions', [newTx, ...get().transactions], get().currentUser?.tenantId);

    // Handle KASBON customer debt logic
    if (paymentMethod === 'KASBON' && customerId) {
      get().updateCustomer(customerId, { debtAmount: (customer?.debtAmount || 0) + totalAmount });
    }
    // Handle Customer Points (+1 point per 50.000 spent)
    if (customerId && paymentMethod !== 'KASBON') {
      const earnedPoints = Math.floor(totalAmount / 50000);
      if (earnedPoints > 0) {
        get().updateCustomer(customerId, { points: (customer?.points || 0) + earnedPoints });
      }
    }

    // === JURNAL OTOMATIS dari Transaksi POS ===
    const now = new Date().toISOString();
    const jId = `je_${Date.now()}`;
    const journalEntries = get().journalEntries;
    
    let autoJournals: JournalEntry[] = [];
    
    if (splitPayments && splitPayments.length > 0) {
      splitPayments.forEach((sp, i) => {
        const akunKas = sp.method === 'CASH' ? 'KAS' : sp.method === 'QRIS_SHARIAH' ? 'QRIS_SYARIAH' : 'BANK_BSI';
        autoJournals.push({
          id: `${jId}_${i+1}`,
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
      const akunKas = paymentMethod === 'CASH' ? 'KAS' : paymentMethod === 'QRIS_SHARIAH' ? 'QRIS_SYARIAH' : paymentMethod === 'KASBON' ? 'PIUTANG_DAGANG' : 'BANK_BSI';
      autoJournals.push({
        id: `${jId}_1`,
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

    autoJournals.push({
        id: `${jId}_2`,
        date: now,
        account: 'PENDAPATAN',
        description: `[Auto] Pendapatan penjualan ${invoiceNo}`,
        debit: 0,
        credit: totalAmount - taxAmount,
        referenceId: newTx.id,
        referenceType: 'AUTO_TRANSAKSI' as JournalSourceType,
        createdBy: currentUser.name,
        branchId: currentUser.branchId
      });
      
    if (taxAmount > 0) {
      autoJournals.push({
        id: `${jId}_tax`,
        date: now,
        account: 'HUTANG_PAJAK',
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
    saveStorage('ba_journal_entries', updatedJournals, get().currentUser?.tenantId);
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
    saveStorage('ba_products', updated, get().currentUser?.tenantId);
    get().addLog('PRODUCT_ADD', 'INVENTORY', `Menambah produk baru: ${product.name} [SKU: ${product.sku}]`);
    
    if (isSupabaseConfigured) {
      supabaseService.saveProduct(product);
    }
  },
  
  updateProduct: (updatedProd) => {
    const updated = get().products.map(p => p.id === updatedProd.id ? updatedProd : p);
    set({
      products: updated
    });
    saveStorage('ba_products', updated, get().currentUser?.tenantId);
    get().addLog('PRODUCT_UPDATE', 'INVENTORY', `Ubah informasi produk: ${updatedProd.name}`);
    
    if (isSupabaseConfigured) {
      supabaseService.saveProduct(updatedProd);
    }
  },
  
  deleteProduct: (id) => {
    const prod = get().products.find(p => p.id === id);
    const updated = get().products.filter(p => p.id !== id);
    set({ products: updated });
    saveStorage('ba_products', updated, get().currentUser?.tenantId);
    if (prod) {
      get().addLog('PRODUCT_DELETE', 'INVENTORY', `Menghapus produk: ${prod.name}`);
    }
    
    if (isSupabaseConfigured) {
      supabaseService.deleteProduct(id);
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
    saveStorage('ba_products', updatedList, get().currentUser?.tenantId);

    // Log stock movement
    get().addStockMovement({
      productId,
      type: amount > 0 ? 'IN' : 'OUT',
      qty: Math.abs(amount),
      reason: 'Penyesuaian Manual (Adjustment)',
      branchId: prod.branchId
    });

    get().addLog('STOCK_ADJUST', 'INVENTORY', `Penyesuaian stok ${prod.name} sejumlah ${amount > 0 ? '+' : ''}${amount}`);
    
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
    saveStorage('ba_zakat_records', updated, get().currentUser?.tenantId);
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
    saveStorage('ba_zakat_distributions', updated, get().currentUser?.tenantId);
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
    const newUser: UserAccount = {
      ...userData,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isActive: true,
      isApproved: false, // Semua pendaftar baru harus menunggu approval
      role: 'CASHIER' // Default role, bisa diubah oleh Admin/Owner setelah approve
    };
    const updated = [...users, newUser];
    set({ users: updated });
    saveStorage('ba_users', updated, get().currentUser?.tenantId);
    get().addLog('USER_REGISTER', 'SYSTEM', `Pendaftaran akun baru (PENDING): ${newUser.name} (@${newUser.username}) — menunggu persetujuan Admin.`);
    
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
    saveStorage('ba_users', updated, get().currentUser?.tenantId);
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
    saveStorage('ba_users', updated, get().currentUser?.tenantId);
    get().addLog('USER_REJECT', 'SYSTEM', `Pendaftaran ditolak: ${rejected?.name} (@${rejected?.username})`);
    
    if (isSupabaseConfigured) {
      supabaseService.deleteUser(id);
    }
  },

  updateUser: (id, updates) => {
    const { users, currentUser } = get();
    const updated = users.map(u => u.id === id ? { ...u, ...updates } : u);
    set({ users: updated });
    saveStorage('ba_users', updated, get().currentUser?.tenantId);
    get().addLog('USER_UPDATE', 'SYSTEM', `Update data akun ID: ${id}`);
    
    const modifiedUser = updated.find(u => u.id === id);
    if (currentUser && modifiedUser && currentUser.username === modifiedUser.username) {
      set({ currentUser: { name: modifiedUser.name, username: modifiedUser.username, role: modifiedUser.role, branchId: modifiedUser.branchId } });
    }
    
    if (isSupabaseConfigured && modifiedUser) {
      supabaseService.saveUser(modifiedUser);
    }
  },

  deleteUser: (id) => {
    const { users } = get();
    const updated = users.filter(u => u.id !== id);
    set({ users: updated });
    saveStorage('ba_users', updated, get().currentUser?.tenantId);
    get().addLog('USER_DELETE', 'SYSTEM', `Penghapusan akun ID: ${id}`);
    
    if (isSupabaseConfigured) {
      supabaseService.deleteUser(id);
    }
  },

  addPurchaseOrder: (poData) => {
    const { currentUser } = get();
    const newPo: PurchaseOrder = { ...poData, id: `po_${Date.now()}` };
    const updated = [newPo, ...get().purchaseOrders];
    set({ purchaseOrders: updated });
    saveStorage('ba_purchase_orders', updated, get().currentUser?.tenantId);
    get().addLog('PO_CREATE', 'INVENTORY', `Membuat PO baru: ${newPo.poNumber} ke ${newPo.supplier} senilai Rp ${newPo.totalAmount.toLocaleString('id-ID')}`);

    // === JURNAL OTOMATIS dari Purchase Order ===
    const now = new Date().toISOString();
    const poJournals: JournalEntry[] = [
      {
        id: `je_${Date.now()}_po1`,
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
    saveStorage('ba_journal_entries', updatedJournals, get().currentUser?.tenantId);
    // === END JURNAL OTOMATIS ===
  },

  updatePurchaseOrder: (id, updates) => {
    const updated = get().purchaseOrders.map(p => p.id === id ? { ...p, ...updates } : p);
    set({ purchaseOrders: updated });
    saveStorage('ba_purchase_orders', updated, get().currentUser?.tenantId);
    get().addLog('PO_UPDATE', 'INVENTORY', `Update PO ID: ${id}`);
  },

  addJournalEntry: (entryData) => {
    const newEntry: JournalEntry = { ...entryData, id: `je_${Date.now()}` };
    const updated = [newEntry, ...get().journalEntries];
    set({ journalEntries: updated });
    saveStorage('ba_journal_entries', updated, get().currentUser?.tenantId);
    get().addLog('JOURNAL_ENTRY', 'FINANCE', `Mencatat Jurnal: ${newEntry.description}`);
  },

  addExpense: (expenseData) => {
    const { currentUser, expenses } = get();
    const newExpense: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}`,
      createdBy: currentUser ? currentUser.name : 'System'
    };
    const updated = [newExpense, ...expenses];
    set({ expenses: updated });
    saveStorage('ba_expenses', updated, get().currentUser?.tenantId);
    get().addLog('EXPENSE_ADD', 'FINANCE', `Mencatat pengeluaran: ${newExpense.description} Rp ${newExpense.amount.toLocaleString('id-ID')} oleh ${newExpense.createdBy}`);

    // === JURNAL OTOMATIS dari Pengeluaran ===
    const now = new Date().toISOString();
    const expJournals: JournalEntry[] = [
      {
        id: `je_${Date.now()}_exp1`,
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
    saveStorage('ba_journal_entries', updatedJournals, get().currentUser?.tenantId);
    // === END JURNAL OTOMATIS ===
  },

  deleteExpense: (id) => {
    const { expenses } = get();
    const exp = expenses.find(e => e.id === id);
    const updated = expenses.filter(e => e.id !== id);
    set({ expenses: updated });
    saveStorage('ba_expenses', updated, get().currentUser?.tenantId);
    if (exp) {
      get().addLog('EXPENSE_DELETE', 'FINANCE', `Menghapus pengeluaran: ${exp.description}`);
    }
  },

  addClosing: (closingData) => {
    const { currentUser, closings } = get();
    const newClosing: ClosingRecord = {
      ...closingData,
      id: `cls_${Date.now()}`,
      createdBy: currentUser ? currentUser.name : 'System',
      timestamp: new Date().toISOString()
    };
    const updated = [newClosing, ...closings];
    set({ closings: updated });
    saveStorage('ba_closings', updated, get().currentUser?.tenantId);
    get().addLog('CLOSING_PERFORMED', 'FINANCE', `Melakukan penutupan buku (${newClosing.type}) pada ${newClosing.date}. Laba Bersih: Rp ${newClosing.netProfit.toLocaleString('id-ID')}`);
  },

  clearAllData: () => {
    const initialProducts = [
      { id: 'prod_1', sku: 'BRS-001', name: 'Beras Premium Cianjur 5kg', category: 'Sembako', price: 78000, costPrice: 68000, stock: 45, minStock: 10, unit: 'Pack', isHalal: true, barcode: '8991234560012' },
      { id: 'prod_2', sku: 'MNG-002', name: 'Minyak Goreng SunCo 2L', category: 'Sembako', price: 34500, costPrice: 29000, stock: 32, minStock: 8, unit: 'Botol', isHalal: true, barcode: '8991234560029' },
      { id: 'prod_3', sku: 'GLA-003', name: 'Gula Pasir Gulaku 1kg', category: 'Sembako', price: 17500, costPrice: 15000, stock: 40, minStock: 12, unit: 'Pack', isHalal: true, barcode: '8991234560036' }
    ];
    set({
      products: initialProducts,
      transactions: [],
      expenses: [],
      closings: [],
      zakatRecords: [],
      zakatDistributions: [],
      cart: [],
      auditLogs: [],
      purchaseOrders: [],
      journalEntries: []
    });
    localStorage.removeItem('ba_expenses');
    localStorage.removeItem('ba_closings');
    localStorage.removeItem('ba_products');
    localStorage.removeItem('ba_transactions');
    localStorage.removeItem('ba_zakat_records');
    localStorage.removeItem('ba_zakat_distributions');
    localStorage.removeItem('ba_audit_logs');
    localStorage.removeItem('ba_users');
    localStorage.removeItem('ba_purchase_orders');
    localStorage.removeItem('ba_journal_entries');
    get().addLog('DATABASE_RESET', 'SYSTEM', 'Semua data transaksi dan laporan diset ulang untuk penggunaan dari awal.');
  },
  
  // Add Log implementation
  addLog: (action, category, details) => {
    const { currentUser } = get();
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user: currentUser ? currentUser.name : 'System (Anonym)',
      action,
      category,
      details,
      ipAddress: '192.168.1.15'
    };
    const updated = [log, ...get().auditLogs];
    set({ auditLogs: updated });
    saveStorage('ba_audit_logs', updated, get().currentUser?.tenantId);

    if (isSupabaseConfigured) {
      supabaseService.saveAuditLog(log);
    }
  },

  // Supabase Syncing on startup
  initializeStore: async () => {
    if (!isSupabaseConfigured) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });

    // Inline timeout helper for robust cloud fetching
    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]);
    };

    try {
      // Parallelize fetches with a pool timeout of 1800ms
      await withTimeout(
        Promise.all([
          supabaseService.getProducts().then(remoteProducts => {
            if (remoteProducts && remoteProducts.length > 0) {
              const localProducts = JSON.parse(localStorage.getItem('ba_products') || '[]');
              const productsMap = remoteProducts.map(p => {
                const localP = localProducts.find((lp: any) => lp.id === p.id);
                return {
                  id: p.id,
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
                  image: p.image || localP?.image || undefined
                };
              });
              set({ products: productsMap });
            }
          }),
          supabaseService.getUsers().then(remoteUsers => {
            if (remoteUsers && remoteUsers.length > 0) {
              set({ users: remoteUsers });
            }
          }),
          supabaseService.getTransactions().then(remoteTxs => {
            if (remoteTxs && remoteTxs.length > 0) {
              const transactionsMap = remoteTxs.map(t => ({
                id: t.id,
                invoiceNo: t.invoice_no,
                timestamp: t.timestamp || t.created_at || new Date().toISOString(),
                cashierName: t.cashier_name,
                items: t.items,
                totalAmount: Number(t.total_amount),
                paymentMethod: t.payment_method,
                amountPaid: Number(t.amount_paid),
                changeAmount: Number(t.change_amount),
                zakatContribution: Number(t.zakat_contribution),
                marginContribution: Number(t.margin_contribution)
              }));
              set({ transactions: transactionsMap });
            }
          }),
          supabaseService.getAuditLogs().then(remoteLogs => {
            if (remoteLogs && remoteLogs.length > 0) {
              const logsMap = remoteLogs.map(l => ({
                id: l.id,
                timestamp: l.timestamp || l.created_at || new Date().toISOString(),
                user: l.username,
                action: l.action,
                category: l.category || 'SYSTEM',
                details: l.details,
                ipAddress: l.ip_address
              }));
              set({ auditLogs: logsMap });
            }
          }),
          supabaseService.getZakatRecords().then(remoteZk => {
            if (remoteZk && remoteZk.length > 0) {
              const zkMap = remoteZk.map(zk => ({
                id: zk.id,
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
          }),
          supabaseService.getZakatDistributions().then(remoteZkd => {
            if (remoteZkd && remoteZkd.length > 0) {
              const zkdMap = remoteZkd.map(zkd => ({
                id: zkd.id,
                timestamp: zkd.timestamp || zkd.created_at || new Date().toISOString(),
                amount: Number(zkd.amount),
                recipient: zkd.recipient,
                esgCategory: zkd.esg_category,
                description: zkd.description
              }));
              set({ zakatDistributions: zkdMap });
            }
          })
        ]),
        1800
      );
    } catch (e) {
      console.warn('Supabase initialization timed out or database tables failed to sync. Falling back to offline-first mode.', e);
    } finally {
      set({ isLoading: false });
    }
  }
}));
