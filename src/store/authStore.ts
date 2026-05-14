import { create } from 'zustand';
import type { User } from '@/types';
import { mockApi } from '@/api/mockApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone: string; role: 'CUSTOMER' | 'PROVIDER' }) => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  init: async () => {
    try {
      const token = localStorage.getItem('ss_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const user = await mockApi.getMe(token);
      if (user) {
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem('ss_token');
        set({ isLoading: false });
      }
    } catch {
      localStorage.removeItem('ss_token');
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await mockApi.login(email, password);
      localStorage.setItem('ss_token', result.token);
      set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await mockApi.register(data);
      localStorage.setItem('ss_token', result.token);
      set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('ss_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));
