import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Server,
  Globe,
  FileText,
  ChevronRight,
  User,
  Calculator,
  Calendar,
  Smile,
} from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '~/components/ui/command';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import {
  SearchResultItem,
  searchAll,
  initializeSearchIndexes,
  useEhCommandSearch,
} from './searchFunctions';
import { useEhGlobalContextProps, useEhUserContext } from '~/contexts';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { CommandFilterTabs } from './CommandFilterTabs';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// Icon mapping
const iconMap = {
  Package: Package,
  Server: Server,
  Globe: Globe,
  FileText: FileText,
};

export function EhCommandPalette({ open, setOpen }: CommandPaletteProps) {
  const [filter, setFilter] = useState('filter-all');

  const [search, setSearch] = React.useState('')

  const { searchEnvs } = useEhCommandSearch();
  const [results, setResults] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    if (search) {
      const results = searchEnvs(search);
      setResults(results);
    }
  }, [search]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      className="top-[25vh] translate-y-0"
      commandProps={{
        shouldFilter: false
      }}
    >
      {/* <div className="relative"> */}

      <CommandInput placeholder="Type a command or search..." value={search} onValueChange={setSearch} />

      <CommandList>
        <CommandEmpty>No results found for '{search}'.</CommandEmpty>
        <CommandGroup heading="Environments">
        {results.map((result) => (
          <CommandItem key={result.id}>
            <Calendar />
            <span>{result.title}</span>
          </CommandItem>
        ))}
        </CommandGroup>
        {/* <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <Smile />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem>
            <Calculator />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Environments">
          <CommandItem>
            <User />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup> */}
      </CommandList>

      <CommandFilterTabs value={filter} onValueChange={setFilter} />
    </CommandDialog>
  );
}
