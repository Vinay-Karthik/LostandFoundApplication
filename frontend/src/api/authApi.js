import axiosClient from './axiosClient';

export const authApi = {
  sendOtp: (email) => axiosClient.post('/auth/send-otp', { email }),
  verifyOtp: (email, otp) => axiosClient.post('/auth/verify-otp', { email, otp }),
  register: (data) => axiosClient.post('/auth/register', data),
  login: (data) => axiosClient.post('/auth/login', data),
  getMe: () => axiosClient.get('/auth/me'),
  updateProfile: (data) => axiosClient.patch('/auth/profile', data),
  changePassword: (data) => axiosClient.patch('/auth/change-password', data),
  uploadAvatar: (formData) => axiosClient.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
