// src/services/productService.js
import api from './api';

// ── Admin/internal product APIs (for stock/inventory management) ─────────────
export const productService = {
  list:          (params) => api.get('/products', { params }),
  get:           (id)     => api.get(`/products/${id}`),
  create:        (data)   => api.post('/products', data),
  update:        (id, d)  => api.patch(`/products/${id}`, d),
  delete:        (id)     => api.delete(`/products/${id}`),
  stockIn:       (data)   => api.post('/inventory/stock-in', data),
  stockOut:      (data)   => api.post('/inventory/stock-out', data),
  stockTransfer: (data)   => api.post('/inventory/transfer', data),
  lowStockList:  ()       => api.get('/products/low-stock'),
};

// ── Wholesaler product catalog API (view only — admin products) ───────────────
// Products are created by Admin. Wholesaler can only view them.
// Stock is managed via Purchase → Inventory (separate module).
export const wholesalerProductService = {
  // GET /api/wholesaler/products?page=1&limit=20&search=&size=&finish=...
  listCatalog: (params) => api.get('/wholesaler/products', { params }),

  // GET /api/wholesaler/products/:id
  getProduct: (id) => api.get(`/wholesaler/products/${id}`),

  // GET /api/wholesaler/products/filters  — distinct size/finish/material/color values
  getFilters: () => api.get('/wholesaler/products/filters'),

  // POST /api/wholesaler/products  — wholesaler creates their own product/item
  create: (data) => api.post('/wholesaler/products', data),

  // GET /api/wholesaler/products/mine  — products this wholesaler created
  listMine: (params) => api.get('/wholesaler/products/mine', { params }),

  // DELETE /api/wholesaler/products/:id  — delete own product
  delete: (id) => api.delete(`/wholesaler/products/${id}`),
};
