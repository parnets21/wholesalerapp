// src/services/reportsService.js
import api from './api';

export const reportsService = {
  salesReport:    (params) => api.get('/reports/sales', { params }),
  purchaseReport: (params) => api.get('/reports/purchases', { params }),
  expenseReport:  (params) => api.get('/reports/expenses', { params }),
  plReport:       (params) => api.get('/reports/profit-loss', { params }),
  topProducts:    (params) => api.get('/reports/top-products', { params }),
  topCustomers:   (params) => api.get('/reports/top-customers', { params }),
  analyticsTrend: (params) => api.get('/reports/analytics', { params }),
  dashboard:      ()       => api.get('/reports/dashboard'),
};
