import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Perfume } from '@/lib/data/dummy-perfumes';
import {
  generateDummyPerfumes,
  filterPerfumes,
  sortPerfumes,
  getPaginatedPerfumes,
} from '@/lib/data/dummy-perfumes';

/**
 * Perfume Table Store
 *
 * Manages state for the perfume table including:
 * - Data fetching (dummy data for now, Supabase later)
 * - Pagination
 * - Sorting
 * - Filtering/searching
 * - Column visibility
 * - Row selection
 */

export interface PerfumeTableState {
  // Data
  allPerfumes: Perfume[];
  filteredPerfumes: Perfume[];
  displayedPerfumes: Perfume[];

  // Pagination
  currentPage: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;

  // Sorting
  sortBy: keyof Perfume | null;
  sortDirection: 'asc' | 'desc';

  // Filtering
  searchQuery: string;
  statusFilter: Perfume['status'] | 'all';

  // Column visibility (persisted to localStorage)
  visibleColumns: Record<string, boolean>;

  // Row selection
  selectedRows: Set<string>;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (column: keyof Perfume, direction?: 'asc' | 'desc') => void;
  setSearch: (query: string) => void;
  setStatusFilter: (status: Perfume['status'] | 'all') => void;
  toggleColumn: (columnId: string) => void;
  setColumnVisibility: (columnId: string, visible: boolean) => void;
  toggleRowSelection: (rowId: string) => void;
  toggleAllRowsSelection: () => void;
  clearSelection: () => void;
  refreshData: () => void;
  resetFilters: () => void;
}

const DEFAULT_VISIBLE_COLUMNS = {
  // Fixed columns (always visible)
  select: true,
  thumbnail: true,
  name: true,
  brandName: true,
  status: true,
  actions: true,

  // Optional columns (can be hidden)
  launchYear: true,
  perfumer: true,
  concentration: true,
  gender: true,
  allNotes: false, // Hidden by default (too wide)
  longevity: false,
  sillage: false,
  priceRange: true,
  verifiedData: true,
  createdAt: false,
  updatedAt: false,
};

export const usePerfumeTableStore = create<PerfumeTableState>()(
  persist(
    (set, get) => ({
      // Initial state
      allPerfumes: [],
      filteredPerfumes: [],
      displayedPerfumes: [],
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      pageCount: 0,
      sortBy: 'name',
      sortDirection: 'asc',
      searchQuery: '',
      statusFilter: 'all',
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      selectedRows: new Set(),
      isLoading: false,
      isInitialized: false,

      // Initialize with dummy data
      initialize: () => {
        if (get().isInitialized) return;

        set({ isLoading: true });

        // Simulate async data fetch
        setTimeout(() => {
          const dummyData = generateDummyPerfumes(100);
          const state = get();

          // Apply initial filters and sorting
          let filtered = dummyData;
          if (state.searchQuery) {
            filtered = filterPerfumes(filtered, state.searchQuery);
          }
          if (state.statusFilter !== 'all') {
            filtered = filtered.filter((p) => p.status === state.statusFilter);
          }
          if (state.sortBy) {
            filtered = sortPerfumes(filtered, state.sortBy, state.sortDirection);
          }

          // Paginate
          const paginated = getPaginatedPerfumes(filtered, state.currentPage, state.pageSize);

          set({
            allPerfumes: dummyData,
            filteredPerfumes: filtered,
            displayedPerfumes: paginated.data,
            totalCount: paginated.totalCount,
            pageCount: paginated.pageCount,
            isLoading: false,
            isInitialized: true,
          });
        }, 500);
      },

      // Update displayed data based on current filters/sorting/pagination
      refreshData: () => {
        const state = get();
        let filtered = state.allPerfumes;

        // Apply search
        if (state.searchQuery) {
          filtered = filterPerfumes(filtered, state.searchQuery);
        }

        // Apply status filter
        if (state.statusFilter !== 'all') {
          filtered = filtered.filter((p) => p.status === state.statusFilter);
        }

        // Apply sorting
        if (state.sortBy) {
          filtered = sortPerfumes(filtered, state.sortBy, state.sortDirection);
        }

        // Paginate
        const paginated = getPaginatedPerfumes(filtered, state.currentPage, state.pageSize);

        set({
          filteredPerfumes: filtered,
          displayedPerfumes: paginated.data,
          totalCount: paginated.totalCount,
          pageCount: paginated.pageCount,
        });
      },

      // Pagination
      setPage: (page: number) => {
        set({ currentPage: page });
        get().refreshData();
      },

      setPageSize: (size: number) => {
        set({ pageSize: size, currentPage: 1 });
        get().refreshData();
      },

      // Sorting
      setSort: (column: keyof Perfume, direction?: 'asc' | 'desc') => {
        const state = get();
        const newDirection =
          direction || (state.sortBy === column && state.sortDirection === 'asc' ? 'desc' : 'asc');

        set({
          sortBy: column,
          sortDirection: newDirection,
          currentPage: 1,
        });
        get().refreshData();
      },

      // Filtering
      setSearch: (query: string) => {
        set({ searchQuery: query, currentPage: 1 });
        get().refreshData();
      },

      setStatusFilter: (status: Perfume['status'] | 'all') => {
        set({ statusFilter: status, currentPage: 1 });
        get().refreshData();
      },

      resetFilters: () => {
        set({
          searchQuery: '',
          statusFilter: 'all',
          currentPage: 1,
        });
        get().refreshData();
      },

      // Column visibility
      toggleColumn: (columnId: string) => {
        set((state) => ({
          visibleColumns: {
            ...state.visibleColumns,
            [columnId]: !state.visibleColumns[columnId],
          },
        }));
      },

      setColumnVisibility: (columnId: string, visible: boolean) => {
        set((state) => ({
          visibleColumns: {
            ...state.visibleColumns,
            [columnId]: visible,
          },
        }));
      },

      // Row selection
      toggleRowSelection: (rowId: string) => {
        set((state) => {
          const newSelection = new Set(state.selectedRows);
          if (newSelection.has(rowId)) {
            newSelection.delete(rowId);
          } else {
            newSelection.add(rowId);
          }
          return { selectedRows: newSelection };
        });
      },

      toggleAllRowsSelection: () => {
        const state = get();
        const allIds = state.displayedPerfumes.map((p) => p.id);
        const allSelected = allIds.every((id) => state.selectedRows.has(id));

        if (allSelected) {
          // Deselect all
          set({ selectedRows: new Set() });
        } else {
          // Select all on current page
          set({ selectedRows: new Set(allIds) });
        }
      },

      clearSelection: () => {
        set({ selectedRows: new Set() });
      },
    }),
    {
      name: 'perfume-table-storage',
      partialize: (state) => ({
        // Only persist these fields
        pageSize: state.pageSize,
        visibleColumns: state.visibleColumns,
      }),
    }
  )
);
