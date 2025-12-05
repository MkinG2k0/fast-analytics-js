import { create } from "zustand";
import type { EventLevel } from "@/entities/event";
import type { LogsTableFilters } from "./types";

interface LogsTableState {
  filters: LogsTableFilters;
  pagination: {
    current: number;
    pageSize: number;
  };
}

export interface LogsTableActions {
  setFilters: (filters: LogsTableFilters) => void;
  setFilter: <K extends keyof LogsTableFilters>(
    filterName: K,
    value: LogsTableFilters[K]
  ) => void;
  setLevel: (level: EventLevel | undefined) => void;
  resetFilters: () => void;
  setPagination: (pagination: { current: number; pageSize: number }) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

type LogsTableStore = LogsTableState & LogsTableActions;

const initialState: LogsTableState = {
  filters: {},
  pagination: {
    current: 1,
    pageSize: 50,
  },
};

export const useLogsTableStore = create<LogsTableStore>((set) => ({
  ...initialState,
  setFilters: (filters) => set({ filters }),
  setFilter: (filterName, value) =>
    set((state) => ({ filters: { ...state.filters, [filterName]: value } })),
  setLevel: (level) =>
    set((state) => ({
      filters: { ...state.filters, level },
    })),
  resetFilters: () => set(initialState),
  setPagination: (pagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),
  setPage: (page) =>
    set((state) => ({
      pagination: { ...state.pagination, current: page },
    })),
  setPageSize: (pageSize) =>
    set((state) => ({
      pagination: { ...state.pagination, pageSize, current: 1 },
    })),
}));
