import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Note, NoteCategory } from '@/lib/data/dummy-notes';

/**
 * Note Form Store
 *
 * Manages note form state with sessionStorage persistence
 * Prevents data loss on accidental navigation
 * Clears on successful submission
 */

export interface NoteFormData {
  name: string;
  slug: string;
  description: string;
  category: NoteCategory;
  scentProfile: string[];
  commonlyPairedWith: string[];
  status: Note['status'];
  verifiedData: boolean;
}

interface NoteFormState {
  formData: NoteFormData;
  isEditing: boolean;
  editingId: string | null;

  // Actions
  setFormData: (data: Partial<NoteFormData>) => void;
  setField: <K extends keyof NoteFormData>(field: K, value: NoteFormData[K]) => void;
  resetForm: () => void;
  loadNote: (note: Note) => void;
  clearForm: () => void;
}

const INITIAL_FORM_DATA: NoteFormData = {
  name: '',
  slug: '',
  description: '',
  category: 'top',
  scentProfile: [],
  commonlyPairedWith: [],
  status: 'draft',
  verifiedData: false,
};

export const useNoteFormStore = create<NoteFormState>()(
  persist(
    (set) => ({
      formData: INITIAL_FORM_DATA,
      isEditing: false,
      editingId: null,

      // Set multiple fields at once
      setFormData: (data: Partial<NoteFormData>) => {
        set((state) => ({
          formData: {
            ...state.formData,
            ...data,
          },
        }));
      },

      // Set a single field
      setField: <K extends keyof NoteFormData>(field: K, value: NoteFormData[K]) => {
        set((state) => ({
          formData: {
            ...state.formData,
            [field]: value,
          },
        }));
      },

      // Reset to initial state
      resetForm: () => {
        set({
          formData: INITIAL_FORM_DATA,
          isEditing: false,
          editingId: null,
        });
      },

      // Load existing note for editing
      loadNote: (note: Note) => {
        set({
          formData: {
            name: note.name,
            slug: note.slug,
            description: note.description,
            category: note.category,
            scentProfile: note.scentProfile,
            commonlyPairedWith: note.commonlyPairedWith,
            status: note.status,
            verifiedData: note.verifiedData,
          },
          isEditing: true,
          editingId: note.id,
        });
      },

      // Clear form (on successful submission)
      clearForm: () => {
        set({
          formData: INITIAL_FORM_DATA,
          isEditing: false,
          editingId: null,
        });
      },
    }),
    {
      name: 'note-form-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Persist all form state
      partialize: (state) => ({
        formData: state.formData,
        isEditing: state.isEditing,
        editingId: state.editingId,
      }),
    }
  )
);
