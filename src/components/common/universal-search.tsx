'use client';

import * as React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * UniversalSearch Component
 *
 * A feature-rich search component that searches across perfumes, brands, and notes.
 * Can be reused across dashboard, perfumes page, and other locations.
 *
 * Features:
 * - Real-time search with debouncing (500ms)
 * - Search across multiple entities (perfumes, brands, notes)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Loading states and empty states
 * - Accessible (ARIA labels, keyboard support)
 * - Responsive design
 * - Dark/light mode support
 */

export interface SearchResult {
  id: string;
  type: 'perfume' | 'brand' | 'note';
  name: string;
  description?: string;
  thumbnail?: string;
  metadata?: {
    brandName?: string; // For perfumes
    perfumeCount?: number; // For brands
    category?: string; // For notes
  };
}

export interface UniversalSearchProps {
  /**
   * Placeholder text for the search input
   */
  placeholder?: string;

  /**
   * Callback when a search result is selected
   */
  onSelect?: (result: SearchResult) => void;

  /**
   * Custom search function (for future Supabase integration)
   * If not provided, uses local dummy data
   */
  onSearch?: (query: string) => Promise<SearchResult[]>;

  /**
   * Debounce delay in milliseconds
   */
  debounceMs?: number;

  /**
   * Maximum number of results to display
   */
  maxResults?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show search icon
   */
  showIcon?: boolean;

  /**
   * Auto-focus on mount
   */
  autoFocus?: boolean;
}

export function UniversalSearch({
  placeholder = 'Search perfumes, brands, notes...',
  onSelect,
  onSearch,
  debounceMs = 500,
  maxResults = 10,
  className,
  showIcon = true,
  autoFocus = false,
}: UniversalSearchProps) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  const searchRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Dummy search function for frontend testing
  const dummySearch = React.useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!searchQuery.trim()) return [];

    const dummyData: SearchResult[] = [
      // Perfumes
      {
        id: '1',
        type: 'perfume',
        name: 'Bleu de Chanel',
        description: 'Eau de Parfum',
        thumbnail: 'https://via.placeholder.com/40',
        metadata: { brandName: 'Chanel' },
      },
      {
        id: '2',
        type: 'perfume',
        name: 'Sauvage Elixir',
        description: 'Parfum',
        thumbnail: 'https://via.placeholder.com/40',
        metadata: { brandName: 'Dior' },
      },
      {
        id: '3',
        type: 'perfume',
        name: 'Aventus',
        description: 'Eau de Parfum',
        thumbnail: 'https://via.placeholder.com/40',
        metadata: { brandName: 'Creed' },
      },
      // Brands
      {
        id: '4',
        type: 'brand',
        name: 'Chanel',
        description: 'French luxury brand',
        thumbnail: 'https://via.placeholder.com/40',
        metadata: { perfumeCount: 150 },
      },
      {
        id: '5',
        type: 'brand',
        name: 'Dior',
        description: 'French fashion house',
        thumbnail: 'https://via.placeholder.com/40',
        metadata: { perfumeCount: 120 },
      },
      // Notes
      {
        id: '6',
        type: 'note',
        name: 'Bergamot',
        description: 'Fresh citrus note',
        metadata: { category: 'Citrus' },
      },
      {
        id: '7',
        type: 'note',
        name: 'Vanilla',
        description: 'Sweet warm note',
        metadata: { category: 'Gourmand' },
      },
      {
        id: '8',
        type: 'note',
        name: 'Sandalwood',
        description: 'Woody note',
        metadata: { category: 'Woody' },
      },
    ];

    // Filter based on query
    const filtered = dummyData.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.slice(0, maxResults);
  }, [maxResults]);

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const searchFn = onSearch || dummySearch;
        const searchResults = await searchFn(query);
        setResults(searchResults);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch, dummySearch, debounceMs]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect?.(result);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getTypeBadgeVariant = (type: SearchResult['type']) => {
    switch (type) {
      case 'perfume':
        return 'default';
      case 'brand':
        return 'secondary';
      case 'note':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div ref={searchRef} className={cn('relative w-full', className)}>
      {/* Search Input */}
      <div className="relative">
        {showIcon && (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn('w-full', showIcon && 'pl-10', query && 'pr-10')}
          autoFocus={autoFocus}
          aria-label="Universal search"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card
          id="search-results"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto shadow-lg"
          role="listbox"
        >
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'flex w-full cursor-pointer items-start gap-3 rounded-md p-3 text-left transition-colors',
                    'hover:bg-accent focus:bg-accent focus:outline-none',
                    selectedIndex === index && 'bg-accent'
                  )}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  {/* Thumbnail */}
                  {result.thumbnail && (
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={result.thumbnail}
                        alt={result.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.name}</span>
                      <Badge variant={getTypeBadgeVariant(result.type)} className="text-xs">
                        {result.type}
                      </Badge>
                    </div>
                    {result.description && (
                      <p className="text-sm text-muted-foreground">{result.description}</p>
                    )}
                    {/* Metadata */}
                    {result.metadata && (
                      <div className="text-xs text-muted-foreground">
                        {result.metadata.brandName && (
                          <span>Brand: {result.metadata.brandName}</span>
                        )}
                        {result.metadata.perfumeCount !== undefined && (
                          <span>{result.metadata.perfumeCount} perfumes</span>
                        )}
                        {result.metadata.category && (
                          <span>Category: {result.metadata.category}</span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
