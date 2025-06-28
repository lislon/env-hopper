import React, { useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Badge } from '~/components/ui/badge';
import { Palette, Sun, Moon } from 'lucide-react';
import { applyTheme, themes, type ThemeName, type ThemeMode } from '~/lib/themes';

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [currentMode, setCurrentMode] = useState<ThemeMode>('light');

  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    applyTheme(theme, currentMode);
  };

  const handleModeChange = (mode: ThemeMode) => {
    setCurrentMode(mode);
    applyTheme(currentTheme, mode);
  };

  const themeDescriptions: Record<ThemeName, string> = {
    default: 'Classic blue theme',
    rose: 'Warm pink/red theme',
    green: 'Nature-inspired green',
    orange: 'Energetic orange',
    violet: 'Modern purple/violet',
    slate: 'Professional neutral'
  };

  return (
    <div className="flex items-center gap-2">
      {/* Theme Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="capitalize">{currentTheme}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(themeDescriptions).map(([theme, description]) => (
            <DropdownMenuItem
              key={theme}
              onClick={() => handleThemeChange(theme as ThemeName)}
              className="flex justify-between items-center"
            >
              <div>
                <div className="font-medium capitalize">{theme}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
              {currentTheme === theme && (
                <Badge variant="secondary" className="ml-2">Active</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Light/Dark Mode Toggle */}
      <div className="flex border rounded-md">
        <Button
          variant={currentMode === 'light' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleModeChange('light')}
          className="rounded-r-none border-r-0"
        >
          <Sun className="h-4 w-4" />
        </Button>
        <Button
          variant={currentMode === 'dark' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleModeChange('dark')}
          className="rounded-l-none"
        >
          <Moon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 