import axiosClient from './axiosClient';

export const matchApi = {
  getMatchesForItem: (itemId) => axiosClient.get(`/items/${itemId}/matches`),
  getMyMatches: () => axiosClient.get('/matches/my-matches'),
  confirmMatch: (matchId) => axiosClient.post(`/matches/${matchId}/confirm`),
  rejectMatch: (matchId) => axiosClient.post(`/matches/${matchId}/reject`),
};
