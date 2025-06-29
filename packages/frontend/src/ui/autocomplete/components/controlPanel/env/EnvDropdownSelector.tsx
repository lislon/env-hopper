import React from "react";
import { useEhGlobalContextProps, useEhUserContext } from "~/contexts";
import { BaseDropdownSelector } from "../BaseDropdownSelector";
import { EnvDropdownContent } from "./EnvDropdownContent";

export function EnvDropdownSelector() {
  const { listEnvs } = useEhGlobalContextProps();
  const { env, setEnv } = useEhUserContext();

  const handleSelect = (envSlug: string) => {
    const selectedEnv = listEnvs.find(e => e.slug === envSlug);
    if (selectedEnv) {
      setEnv(selectedEnv);
    }
  };

  return (
    <BaseDropdownSelector
      value={env?.displayName}
      placeholder="Select Env"
      onSelect={handleSelect}
    >
      {({ searchValue, onSelect, getMenuProps, getItemProps, highlightedIndex, isOpen }) => (
        <EnvDropdownContent 
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