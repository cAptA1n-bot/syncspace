import api from '@/lib/api';

export const authService = {
  async register({ firstName, lastName, email, password }) {
    const res = await api.post('/api/auth/register', { firstName, lastName, email, password });
    return res.data;
  },

  async login({ email, password }) {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },

  async logout() {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore error on logout request
    }
  },

  async getMe() {
    const res = await api.get('/api/auth/me');
    return res.data;
  },

  async changePassword({ currentPassword, newPassword }) {
    const res = await api.patch('/api/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};

