import api from '@/lib/api';

export const workspaceService = {
  async getWorkspaces() {
    const res = await api.get('/api/workspaces');
    return res.data?.data?.workspaces || [];
  },

  async getWorkspace(id) {
    const res = await api.get(`/api/workspaces/${id}`);
    return res.data?.data;
  },

  async createWorkspace({ name, description }) {
    const res = await api.post('/api/workspaces', { name, description });
    return res.data?.data?.workspace;
  },

  async updateWorkspace(id, data) {
    const res = await api.patch(`/api/workspaces/${id}`, data);
    return res.data?.data?.workspace;
  },

  async deleteWorkspace(id) {
    const res = await api.delete(`/api/workspaces/${id}`);
    return res.data;
  },

  async getMembers(workspaceId) {
    const res = await api.get(`/api/workspaces/${workspaceId}/members`);
    return res.data?.data?.members || [];
  },

  async addMember(workspaceId, { email, role }) {
    const res = await api.post(`/api/workspaces/${workspaceId}/members`, { email, role });
    return res.data;
  },

  async removeMember(workspaceId, memberId) {
    const res = await api.delete(`/api/workspaces/${workspaceId}/members/${memberId}`);
    return res.data;
  },
};

