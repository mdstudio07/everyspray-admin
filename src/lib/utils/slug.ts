/**
 * Generate URL-friendly slug from text
 *
 * Converts text to lowercase, replaces spaces with hyphens,
 * removes special characters, and trims excess hyphens
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate array of years from start to end (in reverse order)
 *
 * @param startYear - Starting year (e.g., 1925)
 * @param endYear - Ending year (e.g., 2025)
 * @returns Array of years in descending order [2025, 2024, ..., 1925]
 */
export function generateYearOptions(startYear: number, endYear: number): number[] {
  const years: number[] = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push(year);
  }
  return years;
}

/**
 * Get launch year options for perfume form (1925-2025)
 */
export function getLaunchYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  return generateYearOptions(1925, currentYear);
}
