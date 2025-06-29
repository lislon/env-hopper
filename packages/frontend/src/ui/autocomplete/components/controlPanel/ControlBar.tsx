import React from "react";
import { InteractiveBreadcrumbs } from "./InteractiveBreadcrumbs";
import { ActionButton } from "./ActionButton";

interface ControlBarProps {
  onJump?: () => void;
}

export function ControlBar({ onJump }: ControlBarProps) {
  return (
    <div className="bg-primary/10 border-primary/20 border-y py-6 -mx-6 px-6">
      <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-8">
        <div className="flex gap-2 items-center w-full">
          <InteractiveBreadcrumbs />
          <ActionButton onJump={onJump} />
        </div>
      </div>
    </div>
  );
} 