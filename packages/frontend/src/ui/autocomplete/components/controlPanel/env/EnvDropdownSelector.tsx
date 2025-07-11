import React from "react";
import { useEhGlobalContextProps, useEhUserContext } from "~/contexts";
import { BaseDropdownSelector } from "../BaseDropdownSelector";
import { EnvDropdownContent } from "./EnvDropdownContent";

export function EnvDropdownSelector() {
  const { indexData } = useEhGlobalContextProps();
  const listEnvs = Object.values(indexData.envs);
  const { currentEnv, setCurrentEnv } = useEhUserContext();

  const handleSelect = (envSlug: string) => {
    setCurrentEnv(envSlug);
  };

  return (
    <BaseDropdownSelector
      value={currentEnv?.displayName}
      placeholder="Select Env"
      onSelect={handleSelect}
    >
      {(props) => (
        <EnvDropdownContent {...props} />
      )}
    </BaseDropdownSelector>
  );
} 