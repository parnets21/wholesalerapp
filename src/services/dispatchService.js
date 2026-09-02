// src/services/dispatchService.js
import api from './api';

export const dispatchService = {
  list:        (params) => api.get('/dispatches',              { params }),
  get:         (id)     => api.get(`/dispatches/${id}`),
  create:      (data)   => api.post('/dispatches', data),
  markInTransit: (id)   => api.patch(`/dispatches/${id}/intransit`, {}),
  markDelivered: (id, d)=> api.patch(`/dispatches/${id}/deliver`, d || {}),
  update:      (id, d)  => api.put(`/dispatches/${id}`, d),
};
