import axiosClient from './axiosClient';

export const itemApi = {
  getItems: (params) => axiosClient.get('/items', { params }),
  getItemById: (id) => axiosClient.get(`/items/${id}`),
  createItemMultipart: (formData) => axiosClient.post('/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  createItemJson: (data) => axiosClient.post('/items', data),
  updateItemMultipart: (id, formData) => axiosClient.patch(`/items/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateItemJson: (id, data) => axiosClient.patch(`/items/${id}`, data),
  deleteItem: (id) => axiosClient.delete(`/items/${id}`),
  getMyItems: () => axiosClient.get('/items/my-items'),
  getCategories: () => axiosClient.get('/categories'),
};
