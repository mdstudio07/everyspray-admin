/**
 * Dummy Perfume Data Generator
 *
 * Generates realistic mock perfume data for frontend testing.
 * This will be replaced with Supabase queries later.
 */

export interface Perfume {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  brandId: string;
  description: string;
  launchYear: number;
  perfumer: string;
  concentration: 'Parfum' | 'EDP' | 'EDT' | 'EDC';
  thumbnail: string;
  mainImage: string;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  allNotes: string; // Comma-separated for display
  longevity: 'Weak' | 'Moderate' | 'Long lasting' | 'Very long lasting';
  sillage: 'Intimate' | 'Moderate' | 'Heavy';
  gender: 'Masculine' | 'Feminine' | 'Unisex';
  priceRange: '$0-$50' | '$50-$100' | '$100-$200' | '$200-$500' | '$500+';
  season: Array<'Spring' | 'Summer' | 'Fall' | 'Winter'>;
  occasion: Array<'Casual' | 'Office' | 'Evening' | 'Sport' | 'Formal'>;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  verifiedData: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

const BRANDS = [
  { id: 'brand-1', name: 'Chanel' },
  { id: 'brand-2', name: 'Dior' },
  { id: 'brand-3', name: 'Creed' },
  { id: 'brand-4', name: 'Tom Ford' },
  { id: 'brand-5', name: 'Guerlain' },
  { id: 'brand-6', name: 'Hermès' },
  { id: 'brand-7', name: 'Yves Saint Laurent' },
  { id: 'brand-8', name: 'Armani' },
  { id: 'brand-9', name: 'Burberry' },
  { id: 'brand-10', name: 'Givenchy' },
];

const PERFUMERS = [
  'Jacques Polge',
  'Olivier Polge',
  'François Demachy',
  'Olivier Cresp',
  'Francis Kurkdjian',
  'Alberto Morillas',
  'Jean-Claude Ellena',
  'Christine Nagel',
  'Dominique Ropion',
  'Annick Menardo',
];

const TOP_NOTES = [
  'Bergamot',
  'Lemon',
  'Grapefruit',
  'Orange',
  'Mandarin',
  'Lavender',
  'Pink Pepper',
  'Cardamom',
  'Ginger',
  'Mint',
];

const MIDDLE_NOTES = [
  'Rose',
  'Jasmine',
  'Iris',
  'Violet',
  'Geranium',
  'Lavender',
  'Nutmeg',
  'Cinnamon',
  'Pepper',
  'Patchouli',
];

const BASE_NOTES = [
  'Cedarwood',
  'Sandalwood',
  'Vetiver',
  'Ambroxan',
  'Vanilla',
  'Tonka Bean',
  'Musk',
  'Amber',
  'Leather',
  'Oud',
];

const STATUSES: Perfume['status'][] = ['draft', 'pending_approval', 'approved', 'rejected'];
const CONCENTRATIONS: Perfume['concentration'][] = ['Parfum', 'EDP', 'EDT', 'EDC'];
const LONGEVITIES: Perfume['longevity'][] = [
  'Weak',
  'Moderate',
  'Long lasting',
  'Very long lasting',
];
const SILLAGES: Perfume['sillage'][] = ['Intimate', 'Moderate', 'Heavy'];
const GENDERS: Perfume['gender'][] = ['Masculine', 'Feminine', 'Unisex'];
const PRICE_RANGES: Perfume['priceRange'][] = [
  '$0-$50',
  '$50-$100',
  '$100-$200',
  '$200-$500',
  '$500+',
];
const SEASONS: Array<'Spring' | 'Summer' | 'Fall' | 'Winter'> = ['Spring', 'Summer', 'Fall', 'Winter'];
const OCCASIONS: Array<'Casual' | 'Office' | 'Evening' | 'Sport' | 'Formal'> = ['Casual', 'Office', 'Evening', 'Sport', 'Formal'];

/**
 * Get random item from array
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random items from array (unique)
 */
function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
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
 * Generate a single dummy perfume
 */
function generatePerfume(index: number): Perfume {
  const brand = randomItem(BRANDS);
  const name = `${brand.name} No. ${index + 1}`;
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const topNotes = randomItems(TOP_NOTES, 3);
  const middleNotes = randomItems(MIDDLE_NOTES, 3);
  const baseNotes = randomItems(BASE_NOTES, 3);
  const allNotes = [...topNotes, ...middleNotes, ...baseNotes].join(', ');
  const status = randomItem(STATUSES);
  const createdAt = randomDate(365);
  const isApproved = status === 'approved';

  return {
    id: `perfume-${index + 1}`,
    name,
    slug,
    brandName: brand.name,
    brandId: brand.id,
    description: `${name} is a sophisticated ${randomItem(GENDERS).toLowerCase()} fragrance with ${topNotes[0].toLowerCase()} and ${baseNotes[0].toLowerCase()} notes. Perfect for ${randomItems(SEASONS, 2).join(' and ').toLowerCase()} wear.`,
    launchYear: 2020 + Math.floor(Math.random() * 5),
    perfumer: randomItem(PERFUMERS),
    concentration: randomItem(CONCENTRATIONS),
    thumbnail: `https://via.placeholder.com/80x120/CBD5E0/1A202C?text=${encodeURIComponent(name.substring(0, 10))}`,
    mainImage: `https://via.placeholder.com/400x600/CBD5E0/1A202C?text=${encodeURIComponent(name)}`,
    topNotes,
    middleNotes,
    baseNotes,
    allNotes,
    longevity: randomItem(LONGEVITIES),
    sillage: randomItem(SILLAGES),
    gender: randomItem(GENDERS),
    priceRange: randomItem(PRICE_RANGES),
    season: randomItems(SEASONS.slice(), Math.floor(Math.random() * 3) + 1),
    occasion: randomItems(OCCASIONS.slice(), Math.floor(Math.random() * 3) + 1),
    status,
    verifiedData: Math.random() > 0.3,
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
 * Generate array of dummy perfumes
 */
export function generateDummyPerfumes(count: number = 50): Perfume[] {
  return Array.from({ length: count }, (_, index) => generatePerfume(index));
}

/**
 * Get paginated perfumes
 */
export function getPaginatedPerfumes(
  perfumes: Perfume[],
  page: number,
  pageSize: number
): {
  data: Perfume[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
} {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = perfumes.slice(startIndex, endIndex);

  return {
    data,
    totalCount: perfumes.length,
    pageCount: Math.ceil(perfumes.length / pageSize),
    currentPage: page,
    pageSize,
  };
}

/**
 * Filter perfumes by search query
 */
export function filterPerfumes(perfumes: Perfume[], query: string): Perfume[] {
  if (!query.trim()) return perfumes;

  const lowerQuery = query.toLowerCase();
  return perfumes.filter(
    (perfume) =>
      perfume.name.toLowerCase().includes(lowerQuery) ||
      perfume.brandName.toLowerCase().includes(lowerQuery) ||
      perfume.allNotes.toLowerCase().includes(lowerQuery) ||
      perfume.perfumer.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort perfumes
 */
export function sortPerfumes(
  perfumes: Perfume[],
  sortBy: keyof Perfume,
  direction: 'asc' | 'desc'
): Perfume[] {
  return [...perfumes].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === undefined || bValue === undefined) return 0;
    if (aValue === bValue) return 0;

    const comparison = aValue > bValue ? 1 : -1;
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Get perfume by ID
 * Generates all perfumes and finds the one with matching ID
 */
export function getPerfumeById(id: string): Perfume | null {
  const allPerfumes = generateDummyPerfumes(50);
  return allPerfumes.find(p => p.id === id) || null;
}
