import api from '@/lib/api';

export const documentService = {
  async getDocuments(workspaceId) {
    const params = workspaceId ? { workspaceId } : {};
    const res = await api.get('/api/documents', { params });
    return res.data?.data?.documents || res.data?.data?.docs || [];
  },

  async getRecentDocuments() {
    const res = await api.get('/api/documents/recent');
    return res.data?.data?.documents || res.data?.data?.docs || [];
  },

  async getTrashDocuments() {
    const res = await api.get('/api/documents/trash');
    return res.data?.data?.documents || res.data?.data?.docs || [];
  },

  async getDocument(id) {
    const res = await api.get(`/api/documents/${id}`);
    return res.data?.data;
  },

  async createDocument({ workspaceId, title, folderId }) {
    const res = await api.post('/api/documents', { workspaceId, title, folderId });
    return res.data?.data?.document;
  },

  async updateMeta(id, { title, icon, isFavorited }) {
    const res = await api.patch(`/api/documents/${id}`, { title, icon, isFavorited });
    return res.data?.data?.document;
  },

  async saveContent(id, { content, revision }) {
    const res = await api.post(`/api/documents/${id}/content`, { content, revision });
    return res.data?.data;
  },

  async deleteDocument(id) {
    const res = await api.delete(`/api/documents/${id}`);
    return res.data;
  },

  async restoreDocument(id) {
    const res = await api.post(`/api/documents/${id}/restore`);
    return res.data;
  },
};

