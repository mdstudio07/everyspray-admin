'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteForm } from '@/components/admin/notes/note-form';
import { useNoteFormStore } from '@/lib/stores/note-form';
import { toast } from 'react-hot-toast';

/**
 * Create Note Page
 *
 * Page for creating a new fragrance note
 */

export default function CreateNotePage() {
  const router = useRouter();
  const { clearForm } = useNoteFormStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: unknown) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Creating note:', data);

      // Clear form data from session storage
      clearForm();

      toast.success('Note created successfully!');
      router.push('/admin/notes');
    } catch (error) {
      toast.error('Failed to create note');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/admin/notes');
  };

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
              <h1 className="text-3xl font-bold tracking-tight">Create New Note</h1>
              <p className="text-sm text-muted-foreground">Add a new fragrance note to the catalog</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
        <NoteForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
