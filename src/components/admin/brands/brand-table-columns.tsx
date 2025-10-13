'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Brand } from '@/lib/data/dummy-brands';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

/**
 * Brand Table Columns
 *
 * Defines sortable, filterable columns for the brand table
 * Following the same pattern as perfume table columns
 */

interface ActionsColumnProps {
  brand: Brand;
  onDelete: (id: string) => void;
}

function ActionsColumn({ brand, onDelete }: ActionsColumnProps) {
  const router = useRouter();

  const handleView = () => {
    router.push(`/admin/brands/${brand.id}`);
  };

  const handleEdit = () => {
    router.push(`/admin/brands/${brand.id}`);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${brand.name}?`)) {
      onDelete(brand.id);
      toast.success(`${brand.name} deleted successfully`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleView} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Brand
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function createBrandColumns(onDelete: (id: string) => void): ColumnDef<Brand>[] {
  return [
    {
      accessorKey: 'logo',
      header: () => <div className="flex items-center">Logo</div>,
      cell: ({ row }) => {
        const brand = row.original;
        return (
          <div className="flex items-center">
            <img
              src={brand.logo}
              alt={`${brand.name} logo`}
              className="h-10 w-10 rounded-md border object-cover"
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="cursor-pointer h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Brand Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const brand = row.original;
        return (
          <div className="flex flex-col justify-center">
            <span className="font-medium">{brand.name}</span>
            <span className="text-xs text-muted-foreground">{brand.slug}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'country',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="cursor-pointer h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Country
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="flex items-center"><span>{row.getValue('country')}</span></div>;
      },
    },
    {
      accessorKey: 'founder',
      header: () => <div className="flex items-center">Founder</div>,
      cell: ({ row }) => {
        return <div className="flex items-center"><span>{row.getValue('founder')}</span></div>;
      },
    },
    {
      accessorKey: 'foundedYear',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="cursor-pointer h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Founded
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="flex items-center"><span>{row.getValue('foundedYear')}</span></div>;
      },
    },
    {
      accessorKey: 'perfumeCount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="cursor-pointer h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Perfumes
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const count = row.getValue('perfumeCount') as number;
        return <div className="flex items-center"><span className="font-medium">{count}</span></div>;
      },
    },
    {
      accessorKey: 'status',
      header: () => <div className="flex items-center">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue('status') as Brand['status'];
        const statusConfig = {
          draft: { label: 'Draft', variant: 'secondary' as const },
          pending_approval: { label: 'Pending', variant: 'default' as const },
          approved: { label: 'Approved', variant: 'default' as const },
          rejected: { label: 'Rejected', variant: 'destructive' as const },
        };

        const config = statusConfig[status];
        return <div className="flex items-center"><Badge variant={config.variant}>{config.label}</Badge></div>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="cursor-pointer h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return <div className="flex items-center"><span className="text-sm">{date.toLocaleDateString()}</span></div>;
      },
    },
    {
      id: 'actions',
      header: () => <div className="flex items-center">Actions</div>,
      cell: ({ row }) => {
        const brand = row.original;
        return <div className="flex items-center"><ActionsColumn brand={brand} onDelete={onDelete} /></div>;
      },
    },
  ];
}
