/**
 * Dummy Note Data Generator
 *
 * Generates realistic fragrance note data for frontend testing.
 * This will be replaced with Supabase queries later.
 */

export type NoteCategory = 'top' | 'middle' | 'base' | 'linear';

export interface Note {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: NoteCategory;
  scentProfile: string[]; // Tags like 'floral', 'citrus', 'woody', etc.
  commonlyPairedWith: string[]; // Other note names
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  verifiedData: boolean;
  usageCount: number; // How many perfumes use this note
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

const NOTE_DATA = [
  // Top Notes (First Impression - 5-15 minutes)
  { name: 'Bergamot', category: 'top' as const, profile: ['citrus', 'fresh', 'bright'], usageCount: 342 },
  { name: 'Lemon', category: 'top' as const, profile: ['citrus', 'fresh', 'zesty'], usageCount: 298 },
  { name: 'Orange', category: 'top' as const, profile: ['citrus', 'sweet', 'fresh'], usageCount: 265 },
  { name: 'Grapefruit', category: 'top' as const, profile: ['citrus', 'bitter', 'fresh'], usageCount: 187 },
  { name: 'Lavender', category: 'top' as const, profile: ['aromatic', 'herbal', 'fresh'], usageCount: 412 },
  { name: 'Mint', category: 'top' as const, profile: ['aromatic', 'fresh', 'cool'], usageCount: 156 },
  { name: 'Pink Pepper', category: 'top' as const, profile: ['spicy', 'fresh', 'vibrant'], usageCount: 223 },
  { name: 'Cardamom', category: 'top' as const, profile: ['spicy', 'aromatic', 'warm'], usageCount: 198 },
  { name: 'Apple', category: 'top' as const, profile: ['fruity', 'fresh', 'sweet'], usageCount: 145 },
  { name: 'Pineapple', category: 'top' as const, profile: ['fruity', 'tropical', 'sweet'], usageCount: 132 },

  // Middle Notes (Heart - 20 minutes to 1 hour)
  { name: 'Rose', category: 'middle' as const, profile: ['floral', 'romantic', 'elegant'], usageCount: 521 },
  { name: 'Jasmine', category: 'middle' as const, profile: ['floral', 'sweet', 'rich'], usageCount: 487 },
  { name: 'Ylang-Ylang', category: 'middle' as const, profile: ['floral', 'exotic', 'sweet'], usageCount: 298 },
  { name: 'Iris', category: 'middle' as const, profile: ['floral', 'powdery', 'elegant'], usageCount: 342 },
  { name: 'Violet', category: 'middle' as const, profile: ['floral', 'powdery', 'soft'], usageCount: 265 },
  { name: 'Geranium', category: 'middle' as const, profile: ['floral', 'green', 'fresh'], usageCount: 198 },
  { name: 'Cinnamon', category: 'middle' as const, profile: ['spicy', 'warm', 'sweet'], usageCount: 187 },
  { name: 'Nutmeg', category: 'middle' as const, profile: ['spicy', 'warm', 'aromatic'], usageCount: 156 },
  { name: 'Clove', category: 'middle' as const, profile: ['spicy', 'warm', 'intense'], usageCount: 143 },
  { name: 'Orris', category: 'middle' as const, profile: ['floral', 'powdery', 'elegant'], usageCount: 234 },

  // Base Notes (Foundation - 2+ hours)
  { name: 'Vanilla', category: 'base' as const, profile: ['sweet', 'warm', 'comforting'], usageCount: 612 },
  { name: 'Sandalwood', category: 'base' as const, profile: ['woody', 'creamy', 'smooth'], usageCount: 543 },
  { name: 'Cedar', category: 'base' as const, profile: ['woody', 'dry', 'clean'], usageCount: 487 },
  { name: 'Vetiver', category: 'base' as const, profile: ['woody', 'earthy', 'smoky'], usageCount: 456 },
  { name: 'Patchouli', category: 'base' as const, profile: ['earthy', 'woody', 'intense'], usageCount: 398 },
  { name: 'Amber', category: 'base' as const, profile: ['warm', 'sweet', 'resinous'], usageCount: 521 },
  { name: 'Musk', category: 'base' as const, profile: ['animalic', 'warm', 'sensual'], usageCount: 587 },
  { name: 'Tonka Bean', category: 'base' as const, profile: ['sweet', 'warm', 'coumarinic'], usageCount: 432 },
  { name: 'Oakmoss', category: 'base' as const, profile: ['earthy', 'woody', 'green'], usageCount: 321 },
  { name: 'Leather', category: 'base' as const, profile: ['animalic', 'smoky', 'intense'], usageCount: 289 },

  // Linear Notes (All Stages)
  { name: 'Ambergris', category: 'linear' as const, profile: ['marine', 'sweet', 'animalic'], usageCount: 234 },
  { name: 'Oud', category: 'linear' as const, profile: ['woody', 'intense', 'exotic'], usageCount: 312 },
  { name: 'Incense', category: 'linear' as const, profile: ['resinous', 'smoky', 'spiritual'], usageCount: 198 },
  { name: 'White Musk', category: 'linear' as const, profile: ['clean', 'soft', 'powdery'], usageCount: 267 },
  { name: 'Cashmere Wood', category: 'linear' as const, profile: ['woody', 'soft', 'warm'], usageCount: 189 },
];

const STATUSES: Note['status'][] = ['draft', 'pending_approval', 'approved', 'rejected'];

/**
 * Get random item from array
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random items from array
 */
function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate random date in the past
 */
function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

/**
 * Generate a single dummy note
 */
function generateNote(index: number): Note {
  const noteData = NOTE_DATA[index];
  const slug = noteData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const status = randomItem(STATUSES);
  const createdAt = randomDate(365);
  const isApproved = status === 'approved';

  // Get other notes for pairing suggestions
  const otherNotes = NOTE_DATA.filter((_, i) => i !== index).map((n) => n.name);
  const pairedWith = randomItems(otherNotes, Math.floor(Math.random() * 4) + 2);

  return {
    id: `note-${index + 1}`,
    name: noteData.name,
    slug,
    description: `${noteData.name} is a ${noteData.category} note known for its ${noteData.profile.join(', ')} characteristics. Widely used in ${noteData.category === 'top' ? 'opening accords' : noteData.category === 'middle' ? 'heart compositions' : noteData.category === 'base' ? 'base foundations' : 'linear fragrances'}, it adds ${noteData.profile[0]} qualities to perfume compositions.`,
    category: noteData.category,
    scentProfile: noteData.profile,
    commonlyPairedWith: pairedWith,
    status,
    verifiedData: Math.random() > 0.2,
    usageCount: noteData.usageCount,
    createdBy: 'user-team-member-1',
    createdAt,
    updatedAt: createdAt,
    ...(isApproved && {
      approvedBy: 'user-super-admin-1',
      approvedAt: randomDate(300),
    }),
  };
}

/**
 * Generate array of dummy notes
 */
export function generateDummyNotes(count: number = 35): Note[] {
  return Array.from({ length: Math.min(count, NOTE_DATA.length) }, (_, index) => generateNote(index));
}

/**
 * Get paginated notes
 */
export function getPaginatedNotes(
  notes: Note[],
  page: number,
  pageSize: number
): {
  data: Note[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
} {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = notes.slice(startIndex, endIndex);

  return {
    data,
    totalCount: notes.length,
    pageCount: Math.ceil(notes.length / pageSize),
    currentPage: page,
    pageSize,
  };
}

/**
 * Filter notes by search query
 */
export function filterNotes(notes: Note[], query: string): Note[] {
  if (!query.trim()) return notes;

  const lowerQuery = query.toLowerCase();
  return notes.filter(
    (note) =>
      note.name.toLowerCase().includes(lowerQuery) ||
      note.category.toLowerCase().includes(lowerQuery) ||
      note.scentProfile.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Sort notes
 */
export function sortNotes(notes: Note[], sortBy: keyof Note, direction: 'asc' | 'desc'): Note[] {
  return [...notes].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === undefined || bValue === undefined) return 0;
    if (aValue === bValue) return 0;

    const comparison = aValue > bValue ? 1 : -1;
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Get note by ID
 */
export function getNoteById(id: string): Note | null {
  const allNotes = generateDummyNotes(35);
  return allNotes.find((n) => n.id === id) || null;
}

/**
 * Get approved notes only (for selection dropdowns)
 */
export function getApprovedNotes(): Note[] {
  return generateDummyNotes(35).filter((note) => note.status === 'approved');
}

/**
 * Search notes by name (fuzzy search)
 */
export function searchNotes(query: string): Note[] {
  if (!query.trim()) {
    return getApprovedNotes();
  }

  const lowerQuery = query.toLowerCase();
  return getApprovedNotes().filter((note) => note.name.toLowerCase().includes(lowerQuery));
}

/**
 * Get note by slug
 */
export function getNoteBySlug(slug: string): Note | undefined {
  const allNotes = generateDummyNotes(35);
  return allNotes.find((note) => note.slug === slug);
}

/**
 * Get notes by category
 */
export function getNotesByCategory(category: NoteCategory): Note[] {
  return generateDummyNotes(35).filter((note) => note.category === category);
}
