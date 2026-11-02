import api from '@/lib/api';

export const aiService = {
  async summarize(documentId, summaryType = 'medium') {
    const res = await api.post('/api/ai/summarize', { documentId, summaryType });
    return res.data?.data?.summary;
  },

  async getSummaries(documentId) {
    const res = await api.get(`/api/ai/summaries/${documentId}`);
    return res.data?.data?.summaries || [];
  },
};

