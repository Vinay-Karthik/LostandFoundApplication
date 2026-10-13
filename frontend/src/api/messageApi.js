import axiosClient from './axiosClient';

export const messageApi = {
  sendMessage: (data) => axiosClient.post('/messages', data),
  getConversation: (userId) => axiosClient.get(`/messages/${userId}`),
  getPartners: () => axiosClient.get('/messages/partners'),
  getUnreadCount: () => axiosClient.get('/messages/unread-count'),
  blockUser: (userId) => axiosClient.post(`/users/block/${userId}`),
  unblockUser: (userId) => axiosClient.post(`/users/unblock/${userId}`),
  reportUser: (userId, reason) => axiosClient.post(`/users/report/${userId}`, null, { params: { reason } }),
};
