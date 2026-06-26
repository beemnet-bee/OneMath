import { create } from 'zustand';

export type TabId = 'home' | 'solver' | 'graph' | 'formulas' | 'more';

export interface HistoryEntry {
  id: string;
  type: string;
  input: string;
  output: string;
  timestamp: number;
}

interface OneMathState {
  activeTab: TabId;
  activeFeature: string | null;
  history: HistoryEntry[];
  favorites: string[];
  setTab: (tab: TabId) => void;
  setFeature: (feature: string | null) => void;
  addToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  toggleFavorite: (formulaId: string) => void;
  goBack: () => void;
}

export const useOneMathStore = create<OneMathState>((set, get) => ({
  activeTab: 'home',
  activeFeature: null,
  history: typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('onemath-history') || '[]')
    : [],
  favorites: typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('onemath-favorites') || '[]')
    : [],

  setTab: (tab) => set({ activeTab: tab, activeFeature: null }),
  setFeature: (feature) => set({ activeFeature: feature, activeTab: 'more' }),

  addToHistory: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
    };
    const history = [newEntry, ...get().history].slice(0, 50);
    localStorage.setItem('onemath-history', JSON.stringify(history));
    set({ history });
  },

  clearHistory: () => {
    localStorage.removeItem('onemath-history');
    set({ history: [] });
  },

  toggleFavorite: (formulaId) => {
    const favorites = get().favorites.includes(formulaId)
      ? get().favorites.filter((f) => f !== formulaId)
      : [...get().favorites, formulaId];
    localStorage.setItem('onemath-favorites', JSON.stringify(favorites));
    set({ favorites });
  },

  goBack: () => {
    const { activeFeature, activeTab } = get();
    if (activeFeature) {
      set({ activeFeature: null });
    } else if (activeTab !== 'home') {
      set({ activeTab: 'home' });
    }
  },
}));