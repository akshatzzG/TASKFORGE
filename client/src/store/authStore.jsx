import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // Initial State
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  tenant: JSON.parse(localStorage.getItem('tenant')) || null,
  isAuthenticated: !!localStorage.getItem('token'),

  // Login
  login: (token, user, tenant) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tenant', JSON.stringify(tenant));

    set({
      token,
      user,
      tenant,
      isAuthenticated: true,
    });
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');

    set({
      token: null,
      user: null,
      tenant: null,
      isAuthenticated: false,
    });
  },

  // Update User
  setUser: (user) =>
    set(() => {
      localStorage.setItem('user', JSON.stringify(user));
      return { user };
    }),

  // Update Tenant
  setTenant: (tenant) =>
    set(() => {
      localStorage.setItem('tenant', JSON.stringify(tenant));
      return { tenant };
    }),
}));

export default useAuthStore;