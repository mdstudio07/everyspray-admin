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
import type { Note } from '@/lib/data/dummy-notes';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

/**
 * Note Table Columns
 *
 * Defines sortable, filterable columns for the note table
 * Following the same pattern as brand table columns
 */

interface ActionsColumnProps {
  note: Note;
  onDelete: (id: string) => void;
}

function ActionsColumn({ note, onDelete }: ActionsColumnProps) {
  const router = useRouter();

  const handleView = () => {
    router.push(`/admin/notes/${note.id}`);
  };

  const handleEdit = () => {
    router.push(`/admin/notes/${note.id}`);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${note.name}?`)) {
      onDelete(note.id);
      toast.success(`${note.name} deleted successfully`);
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
          Edit Note
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

export function createNoteColumns(onDelete: (id: string) => void): ColumnDef<Note>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="cursor-pointer h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Note Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const note = row.original;
        return (
          <div className="flex flex-col justify-center">
            <span className="font-medium">{note.name}</span>
            <span className="text-xs text-muted-foreground">{note.slug}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="cursor-pointer h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Category
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const category = row.getValue('category') as Note['category'];
        const categoryConfig = {
          top: { label: 'Top', variant: 'default' as const },
          middle: { label: 'Middle', variant: 'secondary' as const },
          base: { label: 'Base', variant: 'outline' as const },
          linear: { label: 'Linear', variant: 'default' as const },
        };

        const config = categoryConfig[category];
        return (
          <div className="flex items-center">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'scentProfile',
      header: () => <div className="flex items-center">Scent Profile</div>,
      cell: ({ row }) => {
        const profile = row.getValue('scentProfile') as string[];
        return (
          <div className="flex items-center">
            <div className="flex flex-wrap gap-1">
              {profile.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {profile.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.length - 3}
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'usageCount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="cursor-pointer h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Usage Count
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const count = row.getValue('usageCount') as number;
        return (
          <div className="flex items-center">
            <span className="font-medium">{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: () => <div className="flex items-center">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue('status') as Note['status'];
        const statusConfig = {
          draft: { label: 'Draft', variant: 'secondary' as const },
          pending_approval: { label: 'Pending', variant: 'default' as const },
          approved: { label: 'Approved', variant: 'default' as const },
          rejected: { label: 'Rejected', variant: 'destructive' as const },
        };

        const config = statusConfig[status];
        return (
          <div className="flex items-center">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        );
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
        return (
          <div className="flex items-center">
            <span className="text-sm">{date.toLocaleDateString()}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="flex items-center">Actions</div>,
      cell: ({ row }) => {
        const note = row.original;
        return (
          <div className="flex items-center">
            <ActionsColumn note={note} onDelete={onDelete} />
          </div>
        );
      },
    },
  ];
}
