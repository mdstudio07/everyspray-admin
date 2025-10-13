import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Brand } from '@/lib/data/dummy-brands';
import { generateDummyBrands, filterBrands, sortBrands } from '@/lib/data/dummy-brands';

/**
 * Brand Table Store
 *
 * Manages brand table state including:
 * - Data fetching and filtering
 * - Sorting and pagination
 * - Column visibility
 * - Search functionality
 *
 * Persists pagination and column preferences to localStorage
 */

export type BrandSortField = keyof Brand;
export type SortDirection = 'asc' | 'desc';

export interface BrandColumnVisibility {
  logo: boolean;
  name: boolean;
  country: boolean;
  founder: boolean;
  foundedYear: boolean;
  perfumeCount: boolean;
  status: boolean;
  createdAt: boolean;
  actions: boolean;
}

interface BrandTableState {
  // Data
  allBrands: Brand[];
  filteredBrands: Brand[];
  displayedBrands: Brand[];

  // Pagination
  currentPage: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;

  // Sorting
  sortBy: BrandSortField;
  sortDirection: SortDirection;

  // Filtering
  searchQuery: string;
  statusFilter: Brand['status'] | 'all';

  // Column visibility
  visibleColumns: BrandColumnVisibility;

  // Loading state
  isLoading: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: Brand['status'] | 'all') => void;
  setSorting: (field: BrandSortField, direction: SortDirection) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleColumnVisibility: (column: keyof BrandColumnVisibility) => void;
  refreshData: () => void;
  deleteBrand: (id: string) => void;
}

const DEFAULT_VISIBLE_COLUMNS: BrandColumnVisibility = {
  logo: true,
  name: true,
  country: true,
  founder: true,
  foundedYear: true,
  perfumeCount: true,
  status: true,
  createdAt: true,
  actions: true,
};

export const useBrandTableStore = create<BrandTableState>()(
  persist(
    (set, get) => ({
      // Initial state
      allBrands: [],
      filteredBrands: [],
      displayedBrands: [],
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      pageCount: 0,
      sortBy: 'name',
      sortDirection: 'asc',
      searchQuery: '',
      statusFilter: 'all',
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      isLoading: false,

      // Set search query and reset to page 1
      setSearchQuery: (query: string) => {
        set({ searchQuery: query, currentPage: 1 });
        get().refreshData();
      },

      // Set status filter and reset to page 1
      setStatusFilter: (status: Brand['status'] | 'all') => {
        set({ statusFilter: status, currentPage: 1 });
        get().refreshData();
      },

      // Set sorting
      setSorting: (field: BrandSortField, direction: SortDirection) => {
        set({ sortBy: field, sortDirection: direction });
        get().refreshData();
      },

      // Set current page
      setPage: (page: number) => {
        set({ currentPage: page });
        get().refreshData();
      },

      // Set page size and reset to page 1
      setPageSize: (size: number) => {
        set({ pageSize: size, currentPage: 1 });
        get().refreshData();
      },

      // Toggle column visibility
      toggleColumnVisibility: (column: keyof BrandColumnVisibility) => {
        set((state) => ({
          visibleColumns: {
            ...state.visibleColumns,
            [column]: !state.visibleColumns[column],
          },
        }));
      },

      // Refresh data (fetch, filter, sort, paginate)
      refreshData: () => {
        const { searchQuery, statusFilter, sortBy, sortDirection, currentPage, pageSize } = get();

        // Fetch all brands (simulated)
        let brands = generateDummyBrands(30);

        // Apply status filter
        if (statusFilter !== 'all') {
          brands = brands.filter((brand) => brand.status === statusFilter);
        }

        // Apply search filter
        brands = filterBrands(brands, searchQuery);

        // Apply sorting
        brands = sortBrands(brands, sortBy, sortDirection);

        // Calculate pagination
        const totalCount = brands.length;
        const pageCount = Math.ceil(totalCount / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const displayedBrands = brands.slice(startIndex, endIndex);

        set({
          allBrands: generateDummyBrands(30),
          filteredBrands: brands,
          displayedBrands,
          totalCount,
          pageCount,
        });
      },

      // Delete brand (simulated)
      deleteBrand: (id: string) => {
        // In real app, this would call API
        // For now, just refresh to simulate deletion
        console.log('Deleting brand:', id);
        get().refreshData();
      },
    }),
    {
      name: 'brand-table-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user preferences
        pageSize: state.pageSize,
        visibleColumns: state.visibleColumns,
      }),
    }
  )
);
