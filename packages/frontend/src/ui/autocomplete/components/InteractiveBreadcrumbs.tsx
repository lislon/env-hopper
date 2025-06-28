import React, { useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from "~/components/ui";
import { ChevronDown } from "lucide-react";
import { useEhGlobalContextProps, useEhUserContext } from "~/contexts";
import { EhEnvDto, EhAppDto } from "~/types/ehTypes";

function EnvDropdownSelector() {
  const { listEnvs } = useEhGlobalContextProps();
  const { env, setEnv } = useEhUserContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2 font-normal">
          {env?.displayName || "Select Env"} <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {listEnvs.map((envItem) => (
          <DropdownMenuItem key={envItem.slug} onClick={() => setEnv(envItem)}>
            {envItem.displayName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppDropdownSelector() {
  const { listApps } = useEhGlobalContextProps();
  const { app, setApp } = useEhUserContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2 font-normal">
          {app?.displayName || "Select App"} <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {listApps.map((appItem) => (
          <DropdownMenuItem key={appItem.slug} onClick={() => setApp(appItem)}>
            {appItem.displayName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function InteractiveBreadcrumbs() {
  const [path, setPath] = useState("");

  return (
    <div className="flex gap-2 items-center w-full">
      {/* Environment Selector */}
      <EnvDropdownSelector />
      
      {/* App Selector */}
      <AppDropdownSelector />

      {/* Page/Parameter Input */}
      <Input
        className="flex-1"
        placeholder="/page / orderId …"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
    </div>
  );
} 