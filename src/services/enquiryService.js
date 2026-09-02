// src/services/enquiryService.js
import api from './api';

export const enquiryService = {
  list:  (params)    => api.get('/enquiries', { params }),
  stats: ()          => api.get('/enquiries/stats'),
  get:   (id)        => api.get(`/enquiries/${id}`),
  update:(id, data)  => api.patch(`/enquiries/${id}`, data),
  reply: (id, data)  => api.post(`/enquiries/${id}/reply`, data),
};
