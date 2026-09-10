// src/services/inventoryService.js
import api from './api';

export const inventoryService = {
  // ── Wholesaler view-only endpoints ────────────────────────────────────────
  list:        (params) => api.get('/wholesaler/inventory',         { params }),
  summary:     ()       => api.get('/wholesaler/inventory/summary'),
  get:         (id)     => api.get(`/wholesaler/inventory/${id}`),
  movements:   (params) => api.get('/wholesaler/inventory/movements', { params }),
  warehouses:  ()       => api.get('/wholesaler/warehouses'),
  // Warehouse management (ERP endpoint — wholesaler role has 'warehouses' module access).
  listWarehouses:  ()       => api.get('/warehouses'),
  createWarehouse: (data)   => api.post('/warehouses', data),
  updateWarehouse: (id, d)  => api.put(`/warehouses/${id}`, d),

  // ── Stock mutations (shared ERP inventory endpoints) ───────────────────────
  // adjust: positive adjustment = Stock In, negative = Stock Out.
  //   { product_id, warehouse_id?, adjustment, reason?, purchase_rate? }
  adjust:      (data)   => api.patch('/inventory/adjust', data),
  // ── Stock transfer (warehouse → warehouse) ─────────────────────────────────
  // create: { from_warehouse, to_warehouse, product_id, quantity, notes?, reason? }
  transfer:      (data)   => api.post('/stock-transfers', data),
  transfers:     (params) => api.get('/stock-transfers', { params }),   // transfer log

  // Products available to pick for a stock action (wholesaler's own catalog)
  productOptions: (params) => api.get('/wholesaler/products/mine', { params }),
};
