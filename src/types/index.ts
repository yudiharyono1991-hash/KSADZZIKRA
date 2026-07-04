export interface Tenant {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  businessType: 'KOPERASI' | 'UMUM';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface Branch {
  tenantId: string;
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface StoreSettings {
  tenantId: string;
  isTaxEnabled: boolean;
  taxRate: number; // e.g. 11 for 11%
  ownerBankAccount?: string;
  ownerBankName?: string;
  qrisEnabled?: boolean;
  qrisImageUrl?: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  businessType?: 'KOPERASI' | 'UMUM';
  // Payment Methods for customer orders
  paymentMethods?: {
    bankTransfer?: { enabled: boolean; bankName: string; accountNumber: string; accountName: string; }[];
    ewallet?: { enabled: boolean; provider: string; number: string; accountName: string; }[];
  };
  ownerWhatsapp?: string;
  paymentTimeoutMinutes?: number;
  // Location & Delivery Restrictions
  storeLocationLat?: number;
  storeLocationLng?: number;
  maxDeliveryRadiusKm?: number;
  // Advanced Config
  maintenanceMode?: boolean;
  minimumCashBalance?: number;
  zakatRate?: number; // e.g. 2.5
  autoApproveTransactions?: boolean;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  qty: number; // positive number, type dictates direction
  reason: string;
  date: string; // ISO String
  branchId?: string;
  userId: string;
}


export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  points: number;
  debtAmount: number;
  createdAt: string;
  branchId?: string;
  isKoperasiMember?: boolean;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  debtAmount: number;
  createdAt: string;
  branchId?: string;
}

export interface Promo {
  id: string;
  tenantId: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // e.g. 10 for 10%, or 5000 for Rp 5000
  minPurchase: number; // minimum total amount to apply
  isActive: boolean;
  createdAt: string;
  branchId?: string;
}

export interface Attendance {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO String
  clockOut?: string; // ISO String
  status: 'PRESENT' | 'LATE';
  branchId?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  clockOutPhotoUrl?: string;
  clockOutLatitude?: number;
  clockOutLongitude?: number;
  
  // Correction Request Fields
  correctionStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  correctionReason?: string;
  correctionType?: 'CLOCK_IN' | 'CLOCK_OUT' | 'BOTH';
  requestedClockIn?: string;
  requestedClockOut?: string;
  isRevised?: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  costPrice: number; // For Shariah margin calculation
  stock: number;
  minStock: number;
  unit: string;
  barcode?: string;
  isHalal: boolean;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  branchId?: string; // Optional for backward compatibility, but should be required eventually
  image?: string; // Product photo URL (Base64)
  expiryDate?: string; // Tanggal Kadaluarsa
  hasBoxUnit?: boolean; // Pilihan dijual per box
  boxBarcode?: string; // Barcode untuk box
  pcsPerBox?: number; // Jumlah satuan per box
  boxPrice?: number; // Harga jual per box
  boxCostPrice?: number; // Modal per box
  salesCoaCode?: string; // Akun Pendapatan
  cogsCoaCode?: string;  // Akun HPP
  isPPOB?: boolean; // PPOB/Digital Product flag
}

export interface CartItem {
  product: Product;
  quantity: number;
  isBox?: boolean;
  targetNumber?: string; // e.g. Phone number for Pulsa, ID for PDAM
}

export interface Transaction {
  id: string;
  tenantId: string;
  invoiceNo: string;
  timestamp: string;
  cashierName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    costPrice: number;
    targetNumber?: string;
  }[];
  totalAmount: number;
  paymentMethod: 'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI' | 'KASBON';
  amountPaid: number;
  changeAmount: number;
  zakatContribution: number; // 2.5% on pure profit if applicable
  marginContribution: number; // total revenue - costPrice
  customerId?: string;
  customerName?: string;
  promoId?: string;
  discountAmount?: number;
  branchId?: string;
  // Phase 2 Enterprise additions
  isVoided?: boolean;
  voidStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  voidReason?: string;
  voidRequestedBy?: string;
  taxAmount?: number;
  splitPayments?: { method: 'CASH' | 'QRIS_SHARIAH' | 'TRANSFER_BSI'; amount: number }[];
  pointsEarned?: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  timestamp: string;
  user: string;
  action: string;
  category: 'POS' | 'INVENTORY' | 'FINANCE' | 'SYSTEM' | 'ZAKAT';
  details: string;
  ipAddress: string;
}

export interface ZakatCalculation {
  id: string;
  tenantId: string;
  timestamp: string;
  goldPricePerGram: number;
  nisabValue: number; // 85 grams of gold
  liquidAssets: number; // CASH + Bank Shariah balance
  inventoryValue: number; // Cost Price of total inventory
  receivables: number;
  liabilities: number;
  netWealth: number;
  isZakatRequired: boolean;
  zakatDue: number;
  notes?: string;
}

export interface ZakatDistribution {
  id: string;
  tenantId: string;
  timestamp: string;
  amount: number;
  recipient: string; // Fakir, Miskin, Amil, Muallaf, Riqab, Gharimin, Fisabilillah, Ibnu Sabil
  esgCategory: 'ENVIRONMENTAL' | 'SOCIAL' | 'GOVERNANCE';
  description: string;
}

export type UserRole = 'SUPERADMIN' | 'CASHIER' | 'ADMIN' | 'MANAGER' | 'PENGURUS' | 'OWNER' | 'STAFF_GUDANG' | 'STAFF_LAPANGAN' | 'PELANGGAN';

export interface CurrentUser {
  name: string;
  username: string;
  role: UserRole;
  password?: string; // Optional for active credentials modification
  tenantId?: string; // Empty if SUPERADMIN
  branchId?: string;
  employeeId?: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  date: string; // Format: YYYY-MM-DD or YYYY-MM-DDTHH:mm
  category: 'GAJI' | 'LISTRIK_AIR_WIFI' | 'SEWA_LAPAK' | 'OPERASIONAL' | 'LAINNYA';
  amount: number;
  description: string;
  createdBy: string;
  branchId?: string;
}

export interface ClosingRecord {
  id: string;
  tenantId: string;
  date: string; // YYYY-MM-DD or YYYY-MM
  type: 'DAILY' | 'MONTHLY';
  revenue: number;
  expensesTotal: number;
  netProfit: number;
  zakatContribution: number;
  isBalanced: boolean;
  notes: string;
  createdBy: string;
  timestamp: string;
}

export interface UserAccount {
  id: string;
  tenantId: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  jobTitle?: string;
  employeeId?: string;
  branchId?: string;
  isApproved?: boolean;
  isActive?: boolean;
  createdAt?: string;
  phone?: string;
  approvedBy?: string;
  isKoperasiMember?: boolean;
}

export interface AppNotification {
  id: string;
  tenantId: string;
  branchId?: string;
  targetRole?: UserRole | UserRole[]; // If specific roles should see this
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'APPROVAL';
  isRead: boolean;
  createdAt: string;
  link?: string; // Optional route to navigate to
}

export interface UserAccountExtended {
  id: string;
  tenantId: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  jobTitle?: string; // Jabatan spesifik, e.g., "Ketua DPS", "Sekretaris"
  createdAt: string;
  isActive: boolean;
  isApproved: boolean; // false = pending persetujuan Admin/Owner
  approvedBy?: string;
  approvedAt?: string;
  phone?: string;
  branchId?: string;
  isKoperasiMember?: boolean;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  poNumber: string;
  date: string;
  supplier: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    expectedPrice: number;
  }[];
  totalAmount: number;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  createdBy: string;
  notes?: string;
  branchId?: string;
  invoiceSupplier?: string; // Untuk menyimpan referensi/URL invoice dari supplier
}

export type JournalSourceType = 'AUTO_TRANSAKSI' | 'AUTO_BEBAN' | 'AUTO_PO' | 'MANUAL';

export interface JournalEntry {
  id: string;
  tenantId: string;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  referenceId?: string; // e.g. transaction id or expense id
  referenceType?: JournalSourceType; // source classification
  createdBy?: string;
  branchId?: string;
}

export interface OnlineOrder {
  id: string;
  tenantId: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'PENDING' | 'PROCESSED' | 'READY' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  branchId?: string;
  notes?: string;
  paymentCode?: string;
  distanceKm?: number;
}

export interface ChatMessage {
  id: string;
  tenantId: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface CoaAccount {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  isActive: boolean;
}

