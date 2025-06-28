import React from "react";
import { CredentialsWidget } from "./CredentialsWidget";
import { VersionWidget } from "./VersionWidget";
import { AddWidgetCard } from "./AddWidgetCard";

interface WidgetGridProps {
  widgets: readonly string[];
  onAddWidget?: () => void;
}

export function WidgetGrid({ widgets, onAddWidget }: WidgetGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
      {widgets.includes("creds") && <CredentialsWidget />}
      {widgets.includes("version") && <VersionWidget />}
      <AddWidgetCard onClick={onAddWidget} />
    </div>
  );
} 