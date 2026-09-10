// src/services/leadService.js
import api from './api';

export const leadService = {
  list:    (params)   => api.get('/leads', { params }),
  create:  (data)     => api.post('/leads', data),
  update:  (id, data) => api.put(`/leads/${id}`, data),
  convert: (id, data) => api.patch(`/leads/${id}/convert`, data || {}),
  remove:  (id)       => api.delete(`/leads/${id}`),
};

export const followupService = {
  list:   (params)   => api.get('/followups', { params }),
  create: (data)     => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
  remove: (id)       => api.delete(`/followups/${id}`),
};

export default leadService;
