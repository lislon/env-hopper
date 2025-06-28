import React from "react";
import { Button } from "~/components/ui";
import { ThemeSwitcher } from "~/components/ThemeSwitcher";

export function PlaygroundHeader() {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* Left side: Logo + Mode */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold">Env‑Hopper</h1>
        <span className="text-xs text-muted-foreground">Jump</span>
      </div>
      
      {/* Right side: Theme switcher + Login */}
      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        <Button size="sm">Login</Button>
      </div>
    </div>
  );
} 