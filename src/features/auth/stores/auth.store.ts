import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        setUser: (user) => set({ user, isAuthenticated: true }),
        clearAuth: () => set({ user: null, isAuthenticated: false }),
      }),
      { name: 'auth-storage', partialize: (state) => ({ user: state.user }) },
    ),
    { name: 'AuthStore' },
  ),
);
