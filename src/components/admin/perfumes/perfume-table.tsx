'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePerfumeTableStore } from '@/lib/stores/perfume-table';
import { createPerfumeColumns } from './perfume-table-columns';
import type { Perfume } from '@/lib/data/dummy-perfumes';

/**
 * PerfumeTable Component
 *
 * Feature-rich data table for managing perfumes with:
 * - Sorting
 * - Pagination
 * - Filtering (search + status)
 * - Column visibility controls
 * - Row selection
 * - Responsive design
 * - Dark/light mode support
 */

interface PerfumeTableProps {
  onView?: (perfume: Perfume) => void;
  onEdit?: (perfume: Perfume) => void;
}

export function PerfumeTable({ onView, onEdit }: PerfumeTableProps) {
  const {
    displayedPerfumes,
    isLoading,
    isInitialized,
    currentPage,
    pageSize,
    pageCount,
    totalCount,
    searchQuery,
    statusFilter,
    selectedRows,
    visibleColumns,
    initialize,
    setPage,
    setPageSize,
    setSearch,
    setStatusFilter,
    toggleColumn,
    clearSelection,
  } = usePerfumeTableStore();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery);

  // Initialize store on mount
  React.useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync column visibility with store
  React.useEffect(() => {
    setColumnVisibility(visibleColumns);
  }, [visibleColumns]);

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(localSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, setSearch]);

  // Handle row actions
  const handleView = React.useCallback(
    (perfume: Perfume) => {
      if (onView) {
        onView(perfume);
      } else {
        console.log('View perfume:', perfume.id);
        // Default: Navigate to view page
        window.location.href = `/admin/perfumes/${perfume.id}`;
      }
    },
    [onView]
  );

  const handleEdit = React.useCallback(
    (perfume: Perfume) => {
      if (onEdit) {
        onEdit(perfume);
      } else {
        console.log('Edit perfume:', perfume.id);
        // Default: Navigate to edit page
        window.location.href = `/admin/perfumes/${perfume.id}/edit`;
      }
    },
    [onEdit]
  );

  // Create columns with actions
  const columns = React.useMemo(
    () =>
      createPerfumeColumns({
        onView: handleView,
        onEdit: handleEdit,
      }),
    [handleView, handleEdit]
  );

  // Create table instance
  const table = useReactTable({
    data: displayedPerfumes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === 'function' ? updater(columnVisibility) : updater;
      setColumnVisibility(newVisibility);

      // Sync with store (only for togglable columns)
      Object.entries(newVisibility).forEach(([columnId]) => {
        // Skip fixed columns
        if (!['select', 'thumbnail', 'name', 'brandName', 'status', 'actions'].includes(columnId)) {
          toggleColumn(columnId);
        }
      });
    },
    state: {
      sorting,
      columnVisibility,
      rowSelection: Array.from(selectedRows).reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {} as Record<string, boolean>),
    },
    manualPagination: true, // We handle pagination in Zustand store
    pageCount,
  });

  // Loading skeleton
  if (!isInitialized || isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  const selectedCount = selectedRows.size;
  const showingStart = (currentPage - 1) * pageSize + 1;
  const showingEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="w-full space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Search perfumes by name, brand, notes..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full"
            />
            {localSearchQuery && (
              <button
                type="button"
                onClick={() => setLocalSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter and Column Visibility */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_approval">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace(/([A-Z])/g, ' $1').trim()}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Selection Info */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-accent/50 p-3">
          <div className="flex items-center gap-2">
            <Badge variant="default">{selectedCount}</Badge>
            <span className="text-sm text-muted-foreground">
              {selectedCount === 1 ? 'perfume' : 'perfumes'} selected
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer hover:bg-accent/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">No perfumes found.</p>
                    {(searchQuery || statusFilter !== 'all') && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setLocalSearchQuery('');
                          setStatusFilter('all');
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Results info */}
        <div className="text-sm text-muted-foreground">
          Showing {showingStart}-{showingEnd} of {totalCount} perfumes
        </div>

        {/* Page size selector and pagination */}
        <div className="flex items-center gap-4">
          {/* Page size */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === pageCount}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pageCount)}
              disabled={currentPage === pageCount}
            >
              Last
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
