import { create } from 'zustand';

type RecentSearchState = {
  searches: string[];
  add: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
};

export const useRecentSearchStore = create<RecentSearchState>((set) => ({
  searches: [],
  add: (query) =>
    set((state) => ({
      searches: [query, ...state.searches.filter((item) => item !== query)].slice(0, 8),
    })),
  remove: (query) =>
    set((state) => ({ searches: state.searches.filter((item) => item !== query) })),
  clear: () => set({ searches: [] }),
}));
