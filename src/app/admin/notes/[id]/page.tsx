'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteForm } from '@/components/admin/notes/note-form';
import { useNoteFormStore } from '@/lib/stores/note-form';
import { getNoteById } from '@/lib/data/dummy-notes';
import { toast } from 'react-hot-toast';

/**
 * Edit Note Page
 *
 * Page for editing an existing fragrance note
 */

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const { loadNote, clearForm } = useNoteFormStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load note data on mount
  React.useEffect(() => {
    const noteId = params.id as string;
    const note = getNoteById(noteId);

    if (!note) {
      toast.error('Note not found');
      router.push('/admin/notes');
      return;
    }

    loadNote(note);
    setIsLoading(false);
  }, [params.id, loadNote, router]);

  const handleSubmit = async (data: unknown) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Updating note:', data);

      // Clear form data from session storage
      clearForm();

      toast.success('Note updated successfully!');
      router.push('/admin/notes');
    } catch (error) {
      toast.error('Failed to update note');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/admin/notes');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading note...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="cursor-pointer">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Edit Note</h1>
              <p className="text-sm text-muted-foreground">Update fragrance note information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
        <NoteForm mode="edit" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
