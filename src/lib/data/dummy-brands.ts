/**
 * Dummy Brand Data Generator
 *
 * Generates realistic brand data for frontend testing.
 * This will be replaced with Supabase queries later.
 */

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  foundedYear: number;
  country: string;
  founder: string;
  website: string;
  logo: string; // Brand logo image URL
  bannerImage: string; // Hero/banner image
  perfumeCount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  verifiedData: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

const BRAND_DATA = [
  { name: 'Chanel', country: 'France', founder: 'Coco Chanel', year: 1910, perfumeCount: 127 },
  { name: 'Dior', country: 'France', founder: 'Christian Dior', year: 1946, perfumeCount: 98 },
  { name: 'Creed', country: 'France', founder: 'James Henry Creed', year: 1760, perfumeCount: 54 },
  { name: 'Tom Ford', country: 'United States', founder: 'Tom Ford', year: 2005, perfumeCount: 89 },
  { name: 'Givenchy', country: 'France', founder: 'Hubert de Givenchy', year: 1952, perfumeCount: 76 },
  { name: 'Yves Saint Laurent', country: 'France', founder: 'Yves Saint Laurent', year: 1961, perfumeCount: 112 },
  { name: 'Hermès', country: 'France', founder: 'Thierry Hermès', year: 1837, perfumeCount: 43 },
  { name: 'Gucci', country: 'Italy', founder: 'Guccio Gucci', year: 1921, perfumeCount: 67 },
  { name: 'Prada', country: 'Italy', founder: 'Mario Prada', year: 1913, perfumeCount: 51 },
  { name: 'Versace', country: 'Italy', founder: 'Gianni Versace', year: 1978, perfumeCount: 84 },
  { name: 'Giorgio Armani', country: 'Italy', founder: 'Giorgio Armani', year: 1975, perfumeCount: 95 },
  { name: 'Dolce & Gabbana', country: 'Italy', founder: 'Domenico Dolce', year: 1985, perfumeCount: 78 },
  { name: 'Burberry', country: 'United Kingdom', founder: 'Thomas Burberry', year: 1856, perfumeCount: 62 },
  { name: 'Jo Malone', country: 'United Kingdom', founder: 'Jo Malone', year: 1994, perfumeCount: 45 },
  { name: 'Bvlgari', country: 'Italy', founder: 'Sotirios Voulgaris', year: 1884, perfumeCount: 71 },
  { name: 'Montblanc', country: 'Germany', founder: 'Claus-Johannes Voss', year: 1906, perfumeCount: 38 },
  { name: 'Thierry Mugler', country: 'France', founder: 'Thierry Mugler', year: 1973, perfumeCount: 29 },
  { name: 'Jean Paul Gaultier', country: 'France', founder: 'Jean Paul Gaultier', year: 1976, perfumeCount: 41 },
  { name: 'Carolina Herrera', country: 'United States', founder: 'Carolina Herrera', year: 1980, perfumeCount: 56 },
  { name: 'Calvin Klein', country: 'United States', founder: 'Calvin Klein', year: 1968, perfumeCount: 92 },
  { name: 'Hugo Boss', country: 'Germany', founder: 'Hugo Boss', year: 1924, perfumeCount: 83 },
  { name: 'Lancôme', country: 'France', founder: 'Armand Petitjean', year: 1935, perfumeCount: 74 },
  { name: 'Acqua di Parma', country: 'Italy', founder: 'Carlo Magnani', year: 1916, perfumeCount: 32 },
  { name: 'Maison Francis Kurkdjian', country: 'France', founder: 'Francis Kurkdjian', year: 2009, perfumeCount: 27 },
  { name: 'Le Labo', country: 'United States', founder: 'Eddie Roschi', year: 2006, perfumeCount: 19 },
  { name: 'Byredo', country: 'Sweden', founder: 'Ben Gorham', year: 2006, perfumeCount: 24 },
  { name: 'Diptyque', country: 'France', founder: 'Desmond Knox-Leet', year: 1961, perfumeCount: 38 },
  { name: 'Amouage', country: 'Oman', founder: 'Sultan Qaboos bin Said', year: 1983, perfumeCount: 52 },
  { name: 'Roja Parfums', country: 'United Kingdom', founder: 'Roja Dove', year: 2011, perfumeCount: 31 },
  { name: 'Xerjoff', country: 'Italy', founder: 'Sergio Momo', year: 2003, perfumeCount: 45 },
];

const STATUSES: Brand['status'][] = ['draft', 'pending_approval', 'approved', 'rejected'];

/**
 * Get random item from array
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
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
 * Generate a single dummy brand
 */
function generateBrand(index: number): Brand {
  const brandData = BRAND_DATA[index];
  const slug = brandData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const status = randomItem(STATUSES);
  const createdAt = randomDate(365);
  const isApproved = status === 'approved';

  return {
    id: `brand-${index + 1}`,
    name: brandData.name,
    slug,
    description: `${brandData.name} is a luxury fragrance house established in ${brandData.year} by ${brandData.founder}. Known for exceptional craftsmanship and timeless elegance, ${brandData.name} offers a distinguished collection of ${brandData.perfumeCount} exquisite fragrances that embody sophistication and refinement.`,
    foundedYear: brandData.year,
    country: brandData.country,
    founder: brandData.founder,
    website: `https://www.${slug}.com`,
    logo: `https://via.placeholder.com/120x120/E5E7EB/1F2937?text=${encodeURIComponent(brandData.name.substring(0, 2))}`,
    bannerImage: `https://via.placeholder.com/1200x400/F3F4F6/1F2937?text=${encodeURIComponent(brandData.name)}`,
    perfumeCount: brandData.perfumeCount,
    status,
    verifiedData: Math.random() > 0.2,
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
 * Generate array of dummy brands
 */
export function generateDummyBrands(count: number = 30): Brand[] {
  return Array.from({ length: Math.min(count, BRAND_DATA.length) }, (_, index) => generateBrand(index));
}

/**
 * Get paginated brands
 */
export function getPaginatedBrands(
  brands: Brand[],
  page: number,
  pageSize: number
): {
  data: Brand[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
} {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = brands.slice(startIndex, endIndex);

  return {
    data,
    totalCount: brands.length,
    pageCount: Math.ceil(brands.length / pageSize),
    currentPage: page,
    pageSize,
  };
}

/**
 * Filter brands by search query
 */
export function filterBrands(brands: Brand[], query: string): Brand[] {
  if (!query.trim()) return brands;

  const lowerQuery = query.toLowerCase();
  return brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(lowerQuery) ||
      brand.country.toLowerCase().includes(lowerQuery) ||
      brand.founder.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort brands
 */
export function sortBrands(
  brands: Brand[],
  sortBy: keyof Brand,
  direction: 'asc' | 'desc'
): Brand[] {
  return [...brands].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === undefined || bValue === undefined) return 0;
    if (aValue === bValue) return 0;

    const comparison = aValue > bValue ? 1 : -1;
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Get brand by ID
 * Generates all brands and finds the one with matching ID
 */
export function getBrandById(id: string): Brand | null {
  const allBrands = generateDummyBrands(30);
  return allBrands.find(b => b.id === id) || null;
}

/**
 * Get approved brands only (for selection dropdowns)
 */
export function getApprovedBrands(): Brand[] {
  return generateDummyBrands(30).filter((brand) => brand.status === 'approved');
}

/**
 * Search brands by name (fuzzy search)
 */
export function searchBrands(query: string): Brand[] {
  if (!query.trim()) {
    return getApprovedBrands();
  }

  const lowerQuery = query.toLowerCase();
  return getApprovedBrands().filter((brand) =>
    brand.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get brand by slug
 */
export function getBrandBySlug(slug: string): Brand | undefined {
  const allBrands = generateDummyBrands(30);
  return allBrands.find((brand) => brand.slug === slug);
}
