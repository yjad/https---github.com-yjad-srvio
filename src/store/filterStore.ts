import { create } from 'zustand';
import type { FilterState } from '@/types';

interface FilterStore extends FilterState {
  setFamily: (family: number | null) => void;
  setCategory: (category: number | null) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: FilterState['sortBy']) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  family: null,
  category: null,
  priceMin: null,
  priceMax: null,
  search: '',
  sortBy: 'rating',

  setFamily: (family) => set({ family, category: null }),
  setCategory: (category) => set({ category }),
  setPriceRange: (priceMin, priceMax) => set({ priceMin, priceMax }),
  setSearch: (search) => set({ search }),
  setSortBy: (sortBy) => set({ sortBy }),
  resetFilters: () => set({ family: null, category: null, priceMin: null, priceMax: null, search: '', sortBy: 'rating' }),
}));
