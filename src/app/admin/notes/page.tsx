'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteTable } from '@/components/admin/notes/note-table';

/**
 * Notes Listing Page
 *
 * Main page for managing fragrance notes
 * Features: search, filter, sort, pagination, create, edit, delete
 */

export default function NotesPage() {
  const router = useRouter();

  const handleCreateNote = () => {
    router.push('/admin/notes/create');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b bg-background">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Fragrance Notes</h1>
              <p className="text-sm text-muted-foreground">
                Manage fragrance notes, categorize them, and approve submissions
              </p>
            </div>
            <Button onClick={handleCreateNote} className="cursor-pointer w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Note
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <NoteTable />
      </div>
    </div>
  );
}