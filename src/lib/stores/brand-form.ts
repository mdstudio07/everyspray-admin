import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Brand } from '@/lib/data/dummy-brands';

/**
 * Brand Form Store
 *
 * Manages brand form state with sessionStorage persistence
 * Prevents data loss on accidental navigation
 * Clears on successful submission
 */

export interface BrandFormData {
  name: string;
  slug: string;
  description: string;
  foundedYear: number | '';
  country: string;
  founder: string;
  website: string;
  status: Brand['status'];
  verifiedData: boolean;
}

interface BrandFormState {
  formData: BrandFormData;
  isEditing: boolean;
  editingId: string | null;

  // Actions
  setFormData: (data: Partial<BrandFormData>) => void;
  setField: <K extends keyof BrandFormData>(field: K, value: BrandFormData[K]) => void;
  resetForm: () => void;
  loadBrand: (brand: Brand) => void;
  clearForm: () => void;
}

const INITIAL_FORM_DATA: BrandFormData = {
  name: '',
  slug: '',
  description: '',
  foundedYear: '',
  country: '',
  founder: '',
  website: '',
  status: 'draft',
  verifiedData: false,
};

export const useBrandFormStore = create<BrandFormState>()(
  persist(
    (set) => ({
      formData: INITIAL_FORM_DATA,
      isEditing: false,
      editingId: null,

      // Set multiple fields at once
      setFormData: (data: Partial<BrandFormData>) => {
        set((state) => ({
          formData: {
            ...state.formData,
            ...data,
          },
        }));
      },

      // Set a single field
      setField: <K extends keyof BrandFormData>(field: K, value: BrandFormData[K]) => {
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

      // Load existing brand for editing
      loadBrand: (brand: Brand) => {
        set({
          formData: {
            name: brand.name,
            slug: brand.slug,
            description: brand.description,
            foundedYear: brand.foundedYear,
            country: brand.country,
            founder: brand.founder,
            website: brand.website,
            status: brand.status,
            verifiedData: brand.verifiedData,
          },
          isEditing: true,
          editingId: brand.id,
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
      name: 'brand-form-storage',
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
