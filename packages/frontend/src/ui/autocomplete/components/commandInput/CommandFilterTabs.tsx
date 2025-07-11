import React, { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface CommandFilterTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const FILTER_OPTIONS = [
  { value: "filter-all", label: "All" },
  { value: "filter-envs", label: "Envs" },
  { value: "filter-apps", label: "Apps" },
];

export function CommandFilterTabs({ 
  value,
  onValueChange,
  className = "px-2 py-1 border-t-1 w-full"
}: CommandFilterTabsProps) {

  // Keyboard navigation with Alt+left/right
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        
        const currentIndex = FILTER_OPTIONS.findIndex(option => option.value === value);
        let nextIndex;
        
        if (e.key === 'ArrowLeft') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : FILTER_OPTIONS.length - 1;
        } else {
          nextIndex = currentIndex < FILTER_OPTIONS.length - 1 ? currentIndex + 1 : 0;
        }
        
        onValueChange(FILTER_OPTIONS[nextIndex]?.value || "filter-all");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [value, onValueChange]);

  return (
    <div className="flex items-center justify-between px-2 py-1 border-t-1 w-full bg-muted/40">
      <Tabs value={value} onValueChange={onValueChange} className="">
        <TabsList>
          {FILTER_OPTIONS.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="flex items-center gap-1 text-sm text-muted-foreground/60">
        
        <kbd className="h-5 px-1 bg-background/50 border border-muted rounded  font-mono">Alt</kbd>
        <span>+</span>
        <kbd className="h-5 px-1 bg-background/50 border border-muted rounded  font-mono">←</kbd>
        <span>/</span>
        <kbd className="h-5 px-1 bg-background/50 border border-muted rounded  font-mono">→</kbd>
      </div>
    </div>
  );
}