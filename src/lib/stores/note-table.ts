import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Note } from '@/lib/data/dummy-notes';
import { generateDummyNotes, filterNotes, sortNotes } from '@/lib/data/dummy-notes';

/**
 * Note Table Store
 *
 * Manages note table state including:
 * - Data fetching and filtering
 * - Sorting and pagination
 * - Column visibility
 * - Search functionality
 *
 * Persists pagination and column preferences to localStorage
 */

export type NoteSortField = keyof Note;
export type SortDirection = 'asc' | 'desc';

export interface NoteColumnVisibility {
  name: boolean;
  category: boolean;
  scentProfile: boolean;
  usageCount: boolean;
  status: boolean;
  createdAt: boolean;
  actions: boolean;
}

interface NoteTableState {
  // Data
  allNotes: Note[];
  filteredNotes: Note[];
  displayedNotes: Note[];

  // Pagination
  currentPage: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;

  // Sorting
  sortBy: NoteSortField;
  sortDirection: SortDirection;

  // Filtering
  searchQuery: string;
  statusFilter: Note['status'] | 'all';
  categoryFilter: Note['category'] | 'all';

  // Column visibility
  visibleColumns: NoteColumnVisibility;

  // Loading state
  isLoading: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: Note['status'] | 'all') => void;
  setCategoryFilter: (category: Note['category'] | 'all') => void;
  setSorting: (field: NoteSortField, direction: SortDirection) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleColumnVisibility: (column: keyof NoteColumnVisibility) => void;
  refreshData: () => void;
  deleteNote: (id: string) => void;
}

const DEFAULT_VISIBLE_COLUMNS: NoteColumnVisibility = {
  name: true,
  category: true,
  scentProfile: true,
  usageCount: true,
  status: true,
  createdAt: true,
  actions: true,
};

export const useNoteTableStore = create<NoteTableState>()(
  persist(
    (set, get) => ({
      // Initial state
      allNotes: [],
      filteredNotes: [],
      displayedNotes: [],
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      pageCount: 0,
      sortBy: 'name',
      sortDirection: 'asc',
      searchQuery: '',
      statusFilter: 'all',
      categoryFilter: 'all',
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      isLoading: false,

      // Set search query and reset to page 1
      setSearchQuery: (query: string) => {
        set({ searchQuery: query, currentPage: 1 });
        get().refreshData();
      },

      // Set status filter and reset to page 1
      setStatusFilter: (status: Note['status'] | 'all') => {
        set({ statusFilter: status, currentPage: 1 });
        get().refreshData();
      },

      // Set category filter and reset to page 1
      setCategoryFilter: (category: Note['category'] | 'all') => {
        set({ categoryFilter: category, currentPage: 1 });
        get().refreshData();
      },

      // Set sorting
      setSorting: (field: NoteSortField, direction: SortDirection) => {
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
      toggleColumnVisibility: (column: keyof NoteColumnVisibility) => {
        set((state) => ({
          visibleColumns: {
            ...state.visibleColumns,
            [column]: !state.visibleColumns[column],
          },
        }));
      },

      // Refresh data (fetch, filter, sort, paginate)
      refreshData: () => {
        const { searchQuery, statusFilter, categoryFilter, sortBy, sortDirection, currentPage, pageSize } = get();

        // Fetch all notes (simulated)
        let notes = generateDummyNotes(35);

        // Apply status filter
        if (statusFilter !== 'all') {
          notes = notes.filter((note) => note.status === statusFilter);
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
          notes = notes.filter((note) => note.category === categoryFilter);
        }

        // Apply search filter
        notes = filterNotes(notes, searchQuery);

        // Apply sorting
        notes = sortNotes(notes, sortBy, sortDirection);

        // Calculate pagination
        const totalCount = notes.length;
        const pageCount = Math.ceil(totalCount / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const displayedNotes = notes.slice(startIndex, endIndex);

        set({
          allNotes: generateDummyNotes(35),
          filteredNotes: notes,
          displayedNotes,
          totalCount,
          pageCount,
        });
      },

      // Delete note (simulated)
      deleteNote: (id: string) => {
        // In real app, this would call API
        // For now, just refresh to simulate deletion
        console.log('Deleting note:', id);
        get().refreshData();
      },
    }),
    {
      name: 'note-table-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user preferences
        pageSize: state.pageSize,
        visibleColumns: state.visibleColumns,
      }),
    }
  )
);
