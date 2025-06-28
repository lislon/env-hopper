import React from "react";
import { InteractiveBreadcrumbs } from "./InteractiveBreadcrumbs";
import { ActionButton } from "./ActionButton";

interface ControlBarProps {
  onJump?: () => void;
}

export function ControlBar({ onJump }: ControlBarProps) {
  return (
    <div className="flex gap-2 items-center w-full">
      <InteractiveBreadcrumbs />
      <ActionButton onJump={onJump} />
    </div>
  );
} 