import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Perfume Form State Store
 *
 * Persists ALL form data to session storage
 * Prevents data loss on page reload
 * Clears on successful submission or tab close
 */

export interface PerfumeFormState {
  // Form data
  formData: {
    name: string;
    slug: string;
    brandId: string;
    description: string;
    launchYear: number;
    perfumer: string;
    concentration: 'Parfum' | 'EDP' | 'EDT' | 'EDC';
    gender: 'Masculine' | 'Feminine' | 'Unisex';
    longevity: 'Weak' | 'Moderate' | 'Long lasting' | 'Very long lasting';
    sillage: 'Intimate' | 'Moderate' | 'Heavy';
    priceRange: '$0-$50' | '$50-$100' | '$100-$200' | '$200-$500' | '$500+';
    notesMode: 'pyramid' | 'linear';
    topNoteIds: string[];
    middleNoteIds: string[];
    baseNoteIds: string[];
    linearNoteIds: string[];
    season: string[];
    occasion: string[];
    verifiedData: boolean;
  } | null;

  // Actions
  setFormData: (data: PerfumeFormState['formData']) => void;
  updateField: <K extends keyof NonNullable<PerfumeFormState['formData']>>(
    field: K,
    value: NonNullable<PerfumeFormState['formData']>[K]
  ) => void;
  clearFormData: () => void;
}

export const usePerfumeFormStateStore = create<PerfumeFormState>()(
  persist(
    (set) => ({
      formData: null,

      setFormData: (data) => {
        set({ formData: data });
      },

      updateField: (field, value) => {
        set((state) => ({
          formData: state.formData
            ? { ...state.formData, [field]: value }
            : null,
        }));
      },

      clearFormData: () => {
        set({ formData: null });
      },
    }),
    {
      name: 'perfume-form-state-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
