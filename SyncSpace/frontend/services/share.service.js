import api from '@/lib/api';

export const shareService = {
  async getCollaborators(documentId) {
    const res = await api.get(`/api/shares/${documentId}`);
    return res.data?.data;
  },

  async shareDocument(documentId, { email, role }) {
    const res = await api.post(`/api/shares/${documentId}`, { email, role });
    return res.data;
  },

  async revokeShare(documentId, userId) {
    const res = await api.delete(`/api/shares/${documentId}/users/${userId}`);
    return res.data;
  },

  async updateShareLink(documentId, { enabled, role }) {
    const res = await api.post(`/api/shares/${documentId}/link`, { enabled, role });
    return res.data?.data?.shareLink;
  },
};

