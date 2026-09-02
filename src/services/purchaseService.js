// src/services/purchaseService.js
// Wholesaler "Buy / Purchase" APIs — records a purchase into own inventory.
import api from './api';

export const purchaseService = {
  // POST /api/wholesaler/purchases
  // body: { supplier_name, product_id?, product_code?, product_name?, qty, rate,
  //         gst_percent?, warehouse_id?, invoice_number?, notes? }
  create: (data) => api.post('/wholesaler/purchases', data),

  // GET /api/wholesaler/purchases?page=&limit=&search=
  list: (params) => api.get('/wholesaler/purchases', { params }),

  // GET /api/wholesaler/purchases/:id
  get: (id) => api.get(`/wholesaler/purchases/${id}`),
};

export default purchaseService;
