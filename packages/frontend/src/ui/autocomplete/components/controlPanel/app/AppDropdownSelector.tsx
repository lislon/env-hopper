import React from "react";
import { useEhGlobalContextProps, useEhUserContext } from "~/contexts";
import { BaseDropdownSelector } from "../BaseDropdownSelector";
import { AppDropdownContent } from "./AppDropdownContent";

export function AppDropdownSelector() {
  const { indexData } = useEhGlobalContextProps();
  const listApps = Object.values(indexData.apps);
  const { currentApp, setCurrentAppPage } = useEhUserContext();

  const handleSelect = (appSlug: string) => {
    setCurrentAppPage(appSlug, undefined);
  };

  return (
    <BaseDropdownSelector
      value={currentApp?.displayName}
      placeholder="Select App"
      onSelect={handleSelect}
    >
      {(props) => (
        <AppDropdownContent {...props} />
      )}
    </BaseDropdownSelector>
  );
} 