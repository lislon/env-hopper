import React from "react";
import { useEhGlobalContextProps, useEhUserContext } from "~/contexts";
import { BaseDropdownSelector } from "../BaseDropdownSelector";
import { AppDropdownContent } from "./AppDropdownContent";

export function AppDropdownSelector() {
  const { listApps } = useEhGlobalContextProps();
  const { app, setApp } = useEhUserContext();

  const handleSelect = (appSlug: string) => {
    const selectedApp = listApps.find(a => a.slug === appSlug);
    if (selectedApp) {
      setApp(selectedApp);
    }
  };

  return (
    <BaseDropdownSelector
      value={app?.displayName}
      placeholder="Select App"
      onSelect={handleSelect}
    >
      {({ searchValue, onSelect, getMenuProps, getItemProps, highlightedIndex, isOpen }) => (
        <AppDropdownContent 
          searchValue={searchValue} 
          onSelect={onSelect}
          getMenuProps={getMenuProps}
          getItemProps={getItemProps}
          highlightedIndex={highlightedIndex}
          isOpen={isOpen}
        />
      )}
    </BaseDropdownSelector>
  );
} 