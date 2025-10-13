'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { searchBrands, getApprovedBrands } from '@/lib/data/dummy-brands';
import type { Brand } from '@/lib/data/dummy-brands';

interface BrandComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function BrandCombobox({ value, onValueChange, disabled }: BrandComboboxProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [brands, setBrands] = React.useState<Brand[]>(getApprovedBrands());

  const selectedBrand = brands.find((brand) => brand.id === value);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setBrands(searchBrands(query));
  };

  // Handle brand selection
  const handleSelect = (brandId: string) => {
    onValueChange(brandId === value ? '' : brandId);
    setOpen(false);
  };

  // Handle "Suggest New Brand" button
  const handleSuggestBrand = () => {
    setOpen(false);
    router.push('/admin/brands/create');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between cursor-pointer"
          disabled={disabled}
        >
          {selectedBrand ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{selectedBrand.name}</span>
              <span className="text-xs text-muted-foreground">
                ({selectedBrand.perfumeCount} perfumes)
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select brand...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search brands..."
            value={searchQuery}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>No brand found.</CommandEmpty>
            <CommandGroup>
              {brands.map((brand) => (
                <CommandItem
                  key={brand.id}
                  value={brand.id}
                  onSelect={() => handleSelect(brand.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === brand.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <span className="font-medium">{brand.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {brand.perfumeCount} perfumes
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={handleSuggestBrand}
                className="cursor-pointer text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Suggest new brand
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
