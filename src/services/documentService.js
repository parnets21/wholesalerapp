// src/services/documentService.js
import api from './api';

export const documentService = {
  // params: { doc_type }
  list: (params = {}) => api.get('/documents', { params }),
  delete: (id) => api.delete(`/documents/${id}`),
  // Upload a document file. { uri, name, type } + doc_type
  upload: (file, doc_type) => {
    const form = new FormData();
    form.append('file', { uri: file.uri, name: file.name || `doc_${Date.now()}`, type: file.type || 'application/octet-stream' });
    form.append('entity_type', 'company');
    form.append('doc_type', doc_type || 'Other');
    return api.upload('/documents', form);
  },
};

export default documentService;
