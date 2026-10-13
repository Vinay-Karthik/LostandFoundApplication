import axiosClient from './axiosClient';

export const adminApi = {
  // Users
  getAllUsers: (params) => axiosClient.get('/admin/users', { params }),
  getUserDetails: (userId) => axiosClient.get(`/admin/users/${userId}/details`),
  createUser: (data) => axiosClient.post('/admin/users', data),
  updateUser: (userId, data) => axiosClient.put(`/admin/users/${userId}`, data),
  resetUserPassword: (userId, newPassword) => axiosClient.post(`/admin/users/${userId}/reset-password`, null, { params: { newPassword } }),
  toggleUserSuspension: (userId, suspended) => axiosClient.patch(`/admin/users/${userId}/suspend`, null, { params: { suspended } }),
  getUnverifiedUsers: () => axiosClient.get('/admin/unverified-users'),
  verifyUser: (userId, approve) => axiosClient.post(`/admin/verify-user/${userId}`, null, { params: { approve } }),
  toggleUserVerification: (userId, verified) => axiosClient.patch(`/admin/users/${userId}/verify`, null, { params: { verified } }),
  updateUserRole: (userId, role) => axiosClient.patch(`/admin/users/${userId}/role`, null, { params: { role } }),
  deleteUser: (userId) => axiosClient.delete(`/admin/users/${userId}`),

  // Items
  getAdminItems: (params) => axiosClient.get('/admin/items', { params }),
  setItemStatus: (itemId, status, reason) => axiosClient.patch(`/admin/items/${itemId}`, null, { params: { status, reason } }),
  deleteItem: (itemId) => axiosClient.delete(`/admin/items/${itemId}`),

  // Matches
  getAdminMatches: (params) => axiosClient.get('/admin/matches', { params }),
  setMatchStatus: (matchId, status) => axiosClient.patch(`/admin/matches/${matchId}/status`, null, { params: { status } }),

  // Flags & Moderation
  createFlag: (data) => axiosClient.post('/flags', data),
  getFlags: () => axiosClient.get('/admin/flags'),
  resolveFlag: (flagId, data) => axiosClient.post(`/admin/flags/${flagId}/resolve`, data),

  // Stats & Analytics
  getStatsSummary: (params) => axiosClient.get('/admin/stats/summary', { params }),
  getEngagementStats: () => axiosClient.get('/admin/stats/engagement'),
  reseedDatabase: () => axiosClient.post('/admin/reseed'),
};
