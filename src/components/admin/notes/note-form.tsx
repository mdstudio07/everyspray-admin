'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useNoteFormStore } from '@/lib/stores/note-form';
import type { NoteCategory } from '@/lib/data/dummy-notes';
import { searchNotes } from '@/lib/data/dummy-notes';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

/**
 * Note Form Component
 *
 * Comprehensive form for creating/editing fragrance notes
 * Features: validation, auto-slug, scent profile tags, note pairing
 */

const noteFormSchema = z.object({
  name: z.string().min(2, 'Note name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().min(30, 'Description must be at least 30 characters'),
  category: z.enum(['top', 'middle', 'base', 'linear']),
  scentProfile: z.array(z.string()).min(1, 'Add at least one scent profile tag'),
  commonlyPairedWith: z.array(z.string()),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected']),
  verifiedData: z.boolean(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  mode: 'create' | 'edit';
  onSubmit: (data: NoteFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

// Common scent profile tags
const SCENT_PROFILE_OPTIONS = [
  'citrus',
  'fresh',
  'bright',
  'zesty',
  'sweet',
  'bitter',
  'aromatic',
  'herbal',
  'cool',
  'spicy',
  'warm',
  'vibrant',
  'fruity',
  'tropical',
  'floral',
  'romantic',
  'elegant',
  'rich',
  'exotic',
  'powdery',
  'soft',
  'green',
  'intense',
  'woody',
  'creamy',
  'smooth',
  'dry',
  'clean',
  'earthy',
  'smoky',
  'animalic',
  'sensual',
  'resinous',
  'marine',
  'coumarinic',
  'comforting',
];

export function NoteForm({ mode, onSubmit, isSubmitting = false }: NoteFormProps) {
  const router = useRouter();
  const { formData, setField, resetForm } = useNoteFormStore();

  const [scentProfileInput, setScentProfileInput] = React.useState('');
  const [noteSearchQuery, setNoteSearchQuery] = React.useState('');
  const [noteSearchResults, setNoteSearchResults] = React.useState<Array<{ id: string; name: string }>>([]);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      category: formData.category,
      scentProfile: formData.scentProfile,
      commonlyPairedWith: formData.commonlyPairedWith,
      status: formData.status,
      verifiedData: formData.verifiedData,
    },
  });

  // Auto-generate slug from name
  const watchName = form.watch('name');
  React.useEffect(() => {
    if (mode === 'create' && watchName) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      form.setValue('slug', slug);
      setField('slug', slug);
    }
  }, [watchName, mode, form, setField]);

  // Persist form data on change (debounced)
  const debouncedSave = React.useMemo(
    () => {
      let timeout: NodeJS.Timeout;
      return (data: Partial<NoteFormValues>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
              setField(key as keyof typeof formData, value as never);
            }
          });
        }, 500);
      };
    },
    [setField]
  );

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      debouncedSave(value as Partial<NoteFormValues>);
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  // Handle scent profile tag addition
  const handleAddScentProfile = (tag: string) => {
    const currentTags = form.getValues('scentProfile');
    if (!currentTags.includes(tag) && tag.trim()) {
      const newTags = [...currentTags, tag.trim().toLowerCase()];
      form.setValue('scentProfile', newTags);
      setScentProfileInput('');
    }
  };

  // Handle scent profile tag removal
  const handleRemoveScentProfile = (tag: string) => {
    const currentTags = form.getValues('scentProfile');
    form.setValue(
      'scentProfile',
      currentTags.filter((t) => t !== tag)
    );
  };

  // Search notes for pairing
  React.useEffect(() => {
    if (noteSearchQuery.trim()) {
      const results = searchNotes(noteSearchQuery);
      setNoteSearchResults(results.slice(0, 10).map((n) => ({ id: n.id, name: n.name })));
    } else {
      setNoteSearchResults([]);
    }
  }, [noteSearchQuery]);

  // Handle adding paired note
  const handleAddPairedNote = (noteName: string) => {
    const currentNotes = form.getValues('commonlyPairedWith');
    if (!currentNotes.includes(noteName)) {
      form.setValue('commonlyPairedWith', [...currentNotes, noteName]);
      setNoteSearchQuery('');
    }
  };

  // Handle removing paired note
  const handleRemovePairedNote = (noteName: string) => {
    const currentNotes = form.getValues('commonlyPairedWith');
    form.setValue(
      'commonlyPairedWith',
      currentNotes.filter((n) => n !== noteName)
    );
  };

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    if (data.scentProfile.length === 0) {
      toast.error('Please add at least one scent profile tag');
      return;
    }
    await onSubmit(data);
  });

  // Handle cancel
  const handleCancel = () => {
    if (confirm('Are you sure? Unsaved changes will be lost.')) {
      resetForm();
      router.push('/admin/notes');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Essential note details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Note Name */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Note Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Bergamot, Vanilla, Sandalwood"
                {...form.register('name')}
              />
              <div className="min-h-[20px]">
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., bergamot, vanilla, sandalwood"
                {...form.register('slug')}
                disabled={mode === 'edit'}
              />
              <div className="min-h-[20px]">
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(value) => form.setValue('category', value as NoteCategory)}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top Note (5-15 minutes)</SelectItem>
                  <SelectItem value="middle">Middle Note (20 minutes - 1 hour)</SelectItem>
                  <SelectItem value="base">Base Note (2+ hours)</SelectItem>
                  <SelectItem value="linear">Linear (All stages)</SelectItem>
                </SelectContent>
              </Select>
              <div className="min-h-[20px]">
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              placeholder="Describe the note's characteristics, origin, and typical usage in fragrances..."
              rows={5}
              {...form.register('description')}
              className={`flex w-full rounded-md border ${
                form.formState.errors.description ? 'border-destructive' : 'border-input'
              } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            />
            <div className="min-h-[20px]">
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scent Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Scent Profile</CardTitle>
          <CardDescription>Add tags that describe this note&apos;s characteristics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tag Input */}
          <div className="space-y-2">
            <Label>Add Tags *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type tag and press Enter (e.g., citrus, fresh, woody)"
                value={scentProfileInput}
                onChange={(e) => setScentProfileInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddScentProfile(scentProfileInput);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => handleAddScentProfile(scentProfileInput)}
                className="cursor-pointer"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Common Tags Quick Add */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Common Tags (Click to add)</Label>
            <div className="flex flex-wrap gap-2">
              {SCENT_PROFILE_OPTIONS.slice(0, 12).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleAddScentProfile(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Selected Tags */}
          <div className="space-y-2">
            <Label>Selected Tags ({form.watch('scentProfile').length})</Label>
            <div className="min-h-[60px] rounded-md border p-3 flex flex-wrap gap-2">
              {form.watch('scentProfile').length > 0 ? (
                form.watch('scentProfile').map((tag) => (
                  <Badge key={tag} variant="default" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveScentProfile(tag)}
                      className="ml-1 hover:text-destructive cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tags added yet</p>
              )}
            </div>
            <div className="min-h-[20px]">
              {form.formState.errors.scentProfile && (
                <p className="text-sm text-destructive">{form.formState.errors.scentProfile.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commonly Paired With */}
      <Card>
        <CardHeader>
          <CardTitle>Commonly Paired With</CardTitle>
          <CardDescription>Search and add notes that pair well with this note</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Note Search */}
          <div className="space-y-2">
            <Label>Search Notes</Label>
            <div className="relative">
              <Input
                placeholder="Search for notes to pair with..."
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
              />
              {noteSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-md border bg-popover shadow-lg">
                  {noteSearchResults.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => handleAddPairedNote(note.name)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent cursor-pointer"
                    >
                      {note.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Paired Notes */}
          <div className="space-y-2">
            <Label>Paired Notes ({form.watch('commonlyPairedWith').length})</Label>
            <div className="min-h-[60px] rounded-md border p-3 flex flex-wrap gap-2">
              {form.watch('commonlyPairedWith').length > 0 ? (
                form.watch('commonlyPairedWith').map((noteName) => (
                  <Badge key={noteName} variant="secondary" className="gap-1">
                    {noteName}
                    <button
                      type="button"
                      onClick={() => handleRemovePairedNote(noteName)}
                      className="ml-1 hover:text-destructive cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No paired notes added yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status & Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Settings</CardTitle>
          <CardDescription>Publication status and verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as NoteFormValues['status'])}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <div className="min-h-[20px]">
                {form.formState.errors.status && (
                  <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Verified Data */}
            <div className="space-y-2">
              <Label>Data Verification</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="verifiedData"
                  checked={form.watch('verifiedData')}
                  onCheckedChange={(checked) => form.setValue('verifiedData', checked as boolean)}
                />
                <Label htmlFor="verifiedData" className="text-sm font-normal cursor-pointer">
                  Mark as verified data
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Check if all information has been verified from official sources
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
          {isSubmitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Note'
              : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
