'use client';

import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Pencil, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Perfume } from '@/lib/data/dummy-perfumes';

/**
 * Perfume Table Columns
 *
 * Defines all columns for the perfume data table with:
 * - Sortable columns
 * - Custom cell renderers
 * - Column visibility controls
 * - Row actions (View, Edit)
 */

// Status badge styling
const STATUS_STYLES: Record<
  Perfume['status'],
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
> = {
  draft: { variant: 'secondary', label: 'Draft' },
  pending_approval: { variant: 'outline', label: 'Pending' },
  approved: { variant: 'default', label: 'Approved' },
  rejected: { variant: 'destructive', label: 'Rejected' },
};

interface ColumnActions {
  onView: (perfume: Perfume) => void;
  onEdit: (perfume: Perfume) => void;
}

export function createPerfumeColumns(actions: ColumnActions): ColumnDef<Perfume>[] {
  return [
    // Select column (fixed, always visible)
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="cursor-pointer"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // Thumbnail column
    {
      accessorKey: 'thumbnail',
      id: 'thumbnail',
      header: 'Image',
      cell: ({ row }) => {
        const perfume = row.original;
        return (
          <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            <img
              src={perfume.thumbnail}
              alt={perfume.name}
              className="h-full w-full object-cover"
            />
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },

    // Name column (sortable, fixed)
    {
      accessorKey: 'name',
      id: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-auto p-2 hover:bg-accent"
          >
            <span className="font-semibold">Name</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const perfume = row.original;
        return (
          <div className="flex min-w-[200px] flex-col gap-1">
            <span className="font-medium">{perfume.name}</span>
            <span className="text-xs text-muted-foreground">{perfume.concentration}</span>
          </div>
        );
      },
      enableHiding: false,
    },

    // Brand column (sortable, fixed)
    {
      accessorKey: 'brandName',
      id: 'brandName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-auto p-2 hover:bg-accent"
          >
            <span className="font-semibold">Brand</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue('brandName')}</div>;
      },
      enableHiding: false,
    },

    // Launch Year (sortable, optional)
    {
      accessorKey: 'launchYear',
      id: 'launchYear',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-auto p-2 hover:bg-accent"
          >
            <span className="font-semibold">Year</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="text-center">{row.getValue('launchYear')}</div>;
      },
    },

    // Perfumer (sortable, optional)
    {
      accessorKey: 'perfumer',
      id: 'perfumer',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-auto p-2 hover:bg-accent"
          >
            <span className="font-semibold">Perfumer</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="min-w-[150px]">{row.getValue('perfumer')}</div>;
      },
    },

    // Concentration (sortable, optional)
    {
      accessorKey: 'concentration',
      id: 'concentration',
      header: 'Type',
      cell: ({ row }) => {
        return <Badge variant="outline">{row.getValue('concentration')}</Badge>;
      },
    },

    // Gender (sortable, optional)
    {
      accessorKey: 'gender',
      id: 'gender',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-auto p-2 hover:bg-accent"
          >
            <span className="font-semibold">Gender</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div>{row.getValue('gender')}</div>;
      },
    },

    // All Notes (optional, hidden by default - too wide)
    {
      accessorKey: 'allNotes',
      id: 'allNotes',
      header: 'Notes',
      cell: ({ row }) => {
        const notes = row.getValue('allNotes') as string;
        return (
          <div className="max-w-[300px] truncate text-sm text-muted-foreground" title={notes}>
            {notes}
          </div>
        );
      },
    },

    // Longevity (optional)
    {
      accessorKey: 'longevity',
      id: 'longevity',
      header: 'Longevity',
      cell: ({ row }) => {
        const longevity = row.getValue('longevity') as Perfume['longevity'];
        return (
          <Badge
            variant="secondary"
            className={cn(
              longevity === 'Very long lasting' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
              longevity === 'Long lasting' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            )}
          >
            {longevity}
          </Badge>
        );
      },
    },

    // Sillage (optional)
    {
      accessorKey: 'sillage',
      id: 'sillage',
      header: 'Sillage',
      cell: ({ row }) => {
        return <div className="text-sm">{row.getValue('sillage')}</div>;
      },
    },

    // Price Range (sortable, optional)
    {
      accessorKey: 'priceRange',
      id: 'priceRange',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-auto p-2 hover:bg-accent"
          >
            <span className="font-semibold">Price</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue('priceRange')}</div>;
      },
    },

    // Verified Data (optional)
    {
      accessorKey: 'verifiedData',
      id: 'verifiedData',
      header: 'Verified',
      cell: ({ row }) => {
        const verified = row.getValue('verifiedData') as boolean;
        return (
          <div className="flex items-center justify-center">
            {verified ? (
              <Badge variant="default" className="text-xs">
                ✓
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },

    // Created At (sortable, optional, hidden by default)
    {
      accessorKey: 'createdAt',
      id: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-auto p-2 hover:bg-accent"
          >
            <span className="font-semibold">Created</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return <div className="text-sm text-muted-foreground">{date.toLocaleDateString()}</div>;
      },
    },

    // Updated At (sortable, optional, hidden by default)
    {
      accessorKey: 'updatedAt',
      id: 'updatedAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-auto p-2 hover:bg-accent"
          >
            <span className="font-semibold">Updated</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('updatedAt'));
        return <div className="text-sm text-muted-foreground">{date.toLocaleDateString()}</div>;
      },
    },

    // Status column (sortable, fixed)
    {
      accessorKey: 'status',
      id: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-auto p-2 hover:bg-accent"
          >
            <span className="font-semibold">Status</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as Perfume['status'];
        const style = STATUS_STYLES[status];
        return <Badge variant={style.variant}>{style.label}</Badge>;
      },
      enableHiding: false,
    },

    // Actions column (fixed, always visible)
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const perfume = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.onView(perfume)}
              className="h-8 w-8 p-0"
              title="View perfume"
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.onEdit(perfume)}
              className="h-8 w-8 p-0"
              title="Edit perfume"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(perfume.id)}>
                  Copy perfume ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => actions.onView(perfume)}>
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onEdit(perfume)}>
                  Edit perfume
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Delete perfume</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
