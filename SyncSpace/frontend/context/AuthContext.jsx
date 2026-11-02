'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { workspaceService } from '@/services/workspace.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const list = await workspaceService.getWorkspaces();
      setWorkspaces(list);
      if (list.length > 0 && !currentWorkspace) {
        // Pick personal workspace or first available
        const personal = list.find((w) => w.isPersonal) || list[0];
        setCurrentWorkspace(personal);
      }
      return list;
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      return [];
    }
  }, [currentWorkspace]);

  // Initial authentication check on load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('syncspace_token');
        if (storedToken) {
          setToken(storedToken);
          const userData = await authService.getMe();
          if (userData?.data?.user) {
            setUser(userData.data.user);
            const wsList = await workspaceService.getWorkspaces();
            setWorkspaces(wsList);
            const savedWsId = localStorage.getItem('syncspace_active_workspace');
            const foundWs = wsList.find((w) => w._id === savedWsId);
            const activeWs = foundWs || wsList.find((w) => w.isPersonal) || wsList[0] || null;
            setCurrentWorkspace(activeWs);
          }
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        localStorage.removeItem('syncspace_token');
        localStorage.removeItem('syncspace_user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const selectWorkspace = (ws) => {
    setCurrentWorkspace(ws);
    if (ws?._id) {
      localStorage.setItem('syncspace_active_workspace', ws._id);
    }
  };

  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password });
    if (data?.data?.token) {
      localStorage.setItem('syncspace_token', data.data.token);
      localStorage.setItem('syncspace_user', JSON.stringify(data.data.user));
      setToken(data.data.token);
      setUser(data.data.user);
      const wsList = await workspaceService.getWorkspaces();
      setWorkspaces(wsList);
      const personal = wsList.find((w) => w.isPersonal) || wsList[0] || null;
      selectWorkspace(personal);
      router.push('/dashboard');
    }
    return data;
  };

  const register = async ({ firstName, lastName, email, password }) => {
    const data = await authService.register({ firstName, lastName, email, password });
    if (data?.data?.token) {
      localStorage.setItem('syncspace_token', data.data.token);
      localStorage.setItem('syncspace_user', JSON.stringify(data.data.user));
      setToken(data.data.token);
      setUser(data.data.user);
      const wsList = await workspaceService.getWorkspaces();
      setWorkspaces(wsList);
      const personal = wsList.find((w) => w.isPersonal) || wsList[0] || null;
      selectWorkspace(personal);
      router.push('/dashboard');
    }
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('syncspace_token');
      localStorage.removeItem('syncspace_user');
      localStorage.removeItem('syncspace_active_workspace');
      setUser(null);
      setToken(null);
      setWorkspaces([]);
      setCurrentWorkspace(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        workspaces,
        currentWorkspace,
        setCurrentWorkspace: selectWorkspace,
        loading,
        login,
        register,
        logout,
        fetchWorkspaces,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

