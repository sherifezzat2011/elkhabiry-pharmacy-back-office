import { create } from "zustand";
import type { FilterState } from "@/types";

type FilterStore = {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
};

export const defaultFilters: FilterState = {
  dateFrom: "2026-01-01",
  dateTo: "2026-06-30",
  branch: "All",
  city: "All",
  area: "All",
  category: "All",
  product: "All",
  supplier: "All",
  customerType: "All",
  prescriptionStatus: "All",
  doctorSpecialty: "All",
  inventoryMovementGranularity: "Weekly",
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
