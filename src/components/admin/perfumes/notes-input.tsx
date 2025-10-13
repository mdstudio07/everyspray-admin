'use client';

import * as React from 'react';
import { X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { searchNotes } from '@/lib/data/dummy-notes';
import type { Note } from '@/lib/data/dummy-notes';

interface NotesInputProps {
  selectedNotes: string[]; // Array of note IDs
  onNotesChange: (noteIds: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function NotesInput({
  selectedNotes = [],
  onNotesChange,
  disabled,
  placeholder = 'Select notes...',
}: NotesInputProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [notes, setNotes] = React.useState<Note[]>([]);

  // Search notes
  React.useEffect(() => {
    setNotes(searchNotes(searchQuery));
  }, [searchQuery]);

  // Get selected note objects - using all notes to ensure chips display
  const selectedNoteObjects = React.useMemo(() => {
    const allNotes = searchNotes(''); // Get all notes
    return allNotes.filter((note) => selectedNotes.includes(note.id));
  }, [selectedNotes]);

  // Add note
  const handleSelect = (noteId: string) => {
    if (selectedNotes.includes(noteId)) {
      // Remove note
      onNotesChange(selectedNotes.filter((id) => id !== noteId));
    } else {
      // Add note
      onNotesChange([...selectedNotes, noteId]);
    }
  };

  // Remove note chip
  const handleRemove = (noteId: string) => {
    onNotesChange(selectedNotes.filter((id) => id !== noteId));
  };

  return (
    <div className="space-y-2">
      {/* Dropdown Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between cursor-pointer"
            disabled={disabled}
          >
            <span className="text-muted-foreground">{placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search notes..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No note found.</CommandEmpty>
              <CommandGroup>
                {notes.map((note) => {
                  const isSelected = selectedNotes.includes(note.id);
                  return (
                    <CommandItem
                      key={note.id}
                      value={note.id}
                      onSelect={() => handleSelect(note.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <span className="font-medium">{note.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {note.category}
                        </Badge>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Notes (Chips) - Displayed Below */}
      {selectedNoteObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {selectedNoteObjects.map((note) => (
            <Badge
              key={note.id}
              variant="secondary"
              className="gap-1 pr-1 text-sm"
            >
              <span>{note.name}</span>
              <button
                type="button"
                onClick={() => !disabled && handleRemove(note.id)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 cursor-pointer disabled:cursor-not-allowed"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
