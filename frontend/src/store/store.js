import { create } from 'zustand';
import { authAPI, preferencesAPI } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access_token } = res.data;
    localStorage.setItem('access_token', access_token);
    set({ token: access_token, isAuthenticated: true });
    return res.data;
  },

  register: async (data) => {
    const res = await authAPI.register(data);
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export const useShoppingStore = create((set, get) => ({
  // Search
  searchResults: [],
  searchLoading: false,
  searchType: 'text',
  lastQuery: '',

  setSearchResults: (results) => set({ searchResults: results }),
  setSearchLoading: (loading) => set({ searchLoading: loading }),
  setSearchType: (type) => set({ searchType: type }),
  setLastQuery: (q) => set({ lastQuery: q }),

  // Selected products for comparison
  compareList: [],
  addToCompare: (product) => {
    const list = get().compareList;
    if (list.length < 4 && !list.find((p) => p.external_id === product.external_id)) {
      set({ compareList: [...list, product] });
    }
  },
  removeFromCompare: (id) =>
    set({ compareList: get().compareList.filter((p) => p.external_id !== id) }),
  clearCompare: () => set({ compareList: [] }),

  // Agent chat
  chatHistory: [],
  agentLoading: false,
  addMessage: (msg) => set({ chatHistory: [...get().chatHistory, msg] }),
  setAgentLoading: (v) => set({ agentLoading: v }),

  // Dashboard
  dashboardData: null,
  dashboardLoading: false,
  setDashboard: (data) => set({ dashboardData: data }),
  setDashboardLoading: (v) => set({ dashboardLoading: v }),

  // Shopping lists
  shoppingLists: [],
  setShoppingLists: (lists) => set({ shoppingLists: lists }),

  // Price alerts
  priceAlerts: [],
  setPriceAlerts: (alerts) => set({ priceAlerts: alerts }),

  // Preferences
  preferences: null,
  setPreferences: (prefs) => set({ preferences: prefs }),
}));
