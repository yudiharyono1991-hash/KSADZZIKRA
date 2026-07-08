import { useAppStore } from '../store';

export function useBranchData() {
  const store = useAppStore();
  const { currentUser } = store;

  const isGlobalAdmin = !currentUser?.branchId || ['OWNER', 'SUPERADMIN', 'PENGURUS'].includes(currentUser?.role || '');
  const branchId = currentUser?.branchId;

  const filterByBranch = <T extends { branchId?: string }>(items: T[]) => {
    return items.filter(item => isGlobalAdmin || item.branchId === branchId || !item.branchId);
  };

  const filterStrictByBranch = <T extends { branchId?: string }>(items: T[]) => {
    return items.filter(item => isGlobalAdmin || item.branchId === branchId);
  };

  const filterCustomersByBranch = <T extends { branchId?: string }>(items: T[]) => {
    return items.filter(item => isGlobalAdmin || item.branchId === branchId);
  };

  return {
    ...store,
    isGlobalAdmin,
    currentBranchId: branchId,
    
    // Strict filters (Must belong to the branch)
    transactions: filterStrictByBranch(store.transactions),
    expenses: filterStrictByBranch(store.expenses),
    attendances: filterStrictByBranch(store.attendances),
    onlineOrders: filterStrictByBranch(store.onlineOrders),
    stockMovements: filterStrictByBranch(store.stockMovements),
    notifications: filterStrictByBranch(store.notifications || []),
    
    // Loose filters (Belongs to branch OR is global/pusat)
    products: filterByBranch(store.products),
    customers: filterCustomersByBranch(store.customers),
    suppliers: filterByBranch(store.suppliers),
    promos: filterByBranch(store.promos),
  };
}
