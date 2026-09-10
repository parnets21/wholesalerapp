// src/utils/permissions.js
//
// Client-side role → module access, mirroring the backend config/permissions.js
// ROLE_MODULES. Used to gate dashboard actions / tabs by the logged-in user's role.
//
// Non-breaking rule: unknown role, Company Owner, or Super Admin → FULL access.
//

// Module keys used across the wholesaler app's feature areas.
export const ROLE_MODULES = {
  'Super Admin':   '*',
  'Company Owner': '*',
  'Wholesaler':    '*',   // the registered wholesaler owner — full app
  'Manager': [
    'dashboard', 'profile', 'notifications', 'products', 'product_search',
    'inventory', 'stock_transfer', 'warehouses', 'enquiries', 'orders',
    'dispatches', 'customers', 'reports', 'staff',
  ],
  'Accountant': [
    'dashboard', 'profile', 'notifications', 'customers', 'purchases',
    'quotations', 'invoices', 'sales', 'expenses', 'payments', 'accounts',
    'profit_loss', 'reports',
  ],
  'Sales Executive': [
    'dashboard', 'profile', 'notifications', 'product_search', 'products',
    'enquiries', 'orders', 'customers', 'quotations',
  ],
  'Warehouse Staff': [
    'dashboard', 'profile', 'notifications', 'product_search', 'products',
    'warehouses', 'inventory', 'stock_transfer', 'orders', 'dispatches',
  ],
};

/**
 * Can this role access a module?
 * @param {string} role
 * @param {string} moduleKey
 */
export function canAccess(role, moduleKey) {
  if (!role) return true;                 // not loaded yet → don't hide anything
  const mods = ROLE_MODULES[role];
  if (!mods) return true;                 // unknown role → full (fail open, non-breaking)
  if (mods === '*') return true;          // owner/admin/wholesaler → full
  return mods.includes(moduleKey);
}
