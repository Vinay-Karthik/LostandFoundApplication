import axiosClient from './axiosClient';

export const bookmarkApi = {
  getUserBookmarks: () => axiosClient.get('/bookmarks'),
  addBookmark: (itemId) => axiosClient.post(`/bookmarks/${itemId}`),
  removeBookmark: (itemId) => axiosClient.delete(`/bookmarks/${itemId}`),
  checkBookmark: (itemId) => axiosClient.get(`/bookmarks/check/${itemId}`),
};
