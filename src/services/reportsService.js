// src/services/reportsService.js
import api, { BASE_URL } from './api';
import { getToken } from '../utils/storage';

// Build an authenticated export URL (token as query param) for PDF/Excel download.
export async function reportExportUrl(type, { format = 'excel', from_date, to_date, group_by } = {}) {
  const token = await getToken().catch(() => null);
  const qs = new URLSearchParams({ format });
  if (from_date) qs.append('from_date', from_date);
  if (to_date)   qs.append('to_date', to_date);
  if (group_by)  qs.append('group_by', group_by);
  if (token)     qs.append('token', token);
  return `${BASE_URL}/reports/${type}/export?${qs.toString()}`;
}

export const reportsService = {
  salesReport:    (params) => api.get('/reports/sales', { params }),
  purchaseReport: (params) => api.get('/reports/purchases', { params }),
  supplierReport: (params) => api.get('/reports/suppliers', { params }),
  expenseReport:  (params) => api.get('/reports/expenses', { params }),
  plReport:       (params) => api.get('/reports/profit-loss', { params }),
  topProducts:    (params) => api.get('/reports/top-products', { params }),
  topCustomers:   (params) => api.get('/reports/top-customers', { params }),
  analyticsTrend: (params) => api.get('/reports/analytics', { params }),
  dashboard:      ()       => api.get('/reports/dashboard'),
};
