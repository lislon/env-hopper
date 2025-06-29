import React from "react";
import { Button } from "~/components/ui/button";
import { useEhGlobalContextProps, useEhUserContext } from "~/contexts";
import { EhEnvDto, EhAppDto } from "~/types/ehTypes";

interface QuickJumpItem {
  env: string;
  app: string;
}

interface QuickJumpBarProps {
  favorites: QuickJumpItem[];
}

export function QuickJumpBar({ favorites }: QuickJumpBarProps) {
  const { listEnvs, listApps } = useEhGlobalContextProps();
  const { setEnv, setApp } = useEhUserContext();

  const envColor = (e: string) =>
    e.startsWith("cross")
      ? "text-blue-600"
      : e.startsWith("preprod")
      ? "text-orange-600"
      : "text-violet-600";

  const handleSelect = (envSlug: string, appSlug: string) => {
    if (appSlug === "More") return;
    
    const selectedEnv = listEnvs.find(env => env.slug === envSlug);
    const selectedApp = listApps.find(app => app.slug === appSlug);
    
    if (selectedEnv) setEnv(selectedEnv);
    if (selectedApp) setApp(selectedApp);
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      {favorites.map(({ env: ev, app: ap }) => (
        <Button
          key={`${ev}-${ap}`}
          variant="outline"
          className="h-20 flex-col"
          onClick={() => handleSelect(ev, ap)}
        >
          <span className={`font-medium ${envColor(ev)}`}>{ev}</span>
          <span className="text-green-700 text-xs mt-1">{ap}</span>
        </Button>
      ))}
    </div>
  );
} 