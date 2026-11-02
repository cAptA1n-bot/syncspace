import api from '@/lib/api';

export const searchService = {
  async search(query, workspaceId) {
    const params = { q: query };
    if (workspaceId) params.workspaceId = workspaceId;
    const res = await api.get('/api/search', { params });
    return res.data?.data?.documents || [];
  },
};

