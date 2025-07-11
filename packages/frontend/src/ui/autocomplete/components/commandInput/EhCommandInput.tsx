import React, { useState, useRef, useEffect } from "react";
import { Input } from "~/components/ui/input";
import { EhCommandPalette } from "./EhCommandPalette";
import { SearchResultItem } from "./searchFunctions";
import { CommandDialog, CommandInput } from "~/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

interface EhCommandInputProps {
  onCommand?: (command: string) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EhCommandInput({ 
  onCommand, 
  onInputChange, 
  placeholder = "Type environment or app",
  className = ""
}: EhCommandInputProps) {
  const [open, setOpen] = React.useState(false)
  const [command, setCommand] = React.useState('')
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])


  return (
    <div className={cn(`relative max-w-4xl flex`, className)}>
      <div className="relative group">
        <Input 
          placeholder={placeholder}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="w-full h-16 px-6 text-lg bg-background border-2 rounded-xl transition-all duration-200 hover:border-accent-foreground/20 hover:shadow-lg focus:border-primary focus:shadow-xl"
          onFocus={() => setOpen(true)}
        />
        
        {/* Hotkey decoration
        <div className="absolute inset-y-0 right-4 flex items-center gap-1 text-muted-foreground pointer-events-none select-none">
          <span className="text-sm font-medium hidden sm:inline">Press</span>
          <kbd className="hidden sm:flex h-6 items-center justify-center gap-1 rounded border bg-muted px-2 font-mono text-[0.7rem] font-medium">
            Ctrl
          </kbd>
          <span className="hidden sm:inline text-muted-foreground">+</span>
          <kbd className="hidden sm:flex h-6 w-6 items-center justify-center rounded border bg-muted font-mono text-[0.7rem] font-medium">
            J
          </kbd>
        </div> */}
      </div>
     
      <EhCommandPalette open={open} setOpen={setOpen} /> 
    </div>
  );
} 