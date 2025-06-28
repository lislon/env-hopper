import React, { useState } from "react";
import {
  PlaygroundHeader,
  QuickJumpBar,
  ControlBar,
  WidgetGrid,
} from "./components";
import { EhConfigProvider, EhUserProvider, useEhUserContext } from "~/contexts";
import { EhEnvDto, EhAppDto } from "~/types/ehTypes";

/**
 * Jump‑only prototype (shadcn/ui version)
 * – Quick‑Jump tiles (square 2×3)
 * – One‑liner control bar with split Jump / Tools
 * – Widget grid (Creds, Version, Add)
 */
function PlaygroundContent() {
  const { env, app } = useEhUserContext();
  const [widgets] = useState(["creds", "version"] as const);

  const favorites: { env: string; app: string }[] = [
    { env: "cross-04", app: "Prod-LIMS" },
    { env: "preprod-04", app: "Prod-LIMS" },
    { env: "g64-int-01", app: "Prod-LIMS" },
    { env: "cross-04", app: "Kafka-UI" },
    { env: "cross-04", app: "LIMS-API" },
    { env: "⋯", app: "More" },
  ];

  const handleJump = () => {
    console.log(`Jumping to ${env?.slug}/${app?.slug}`);
  };

  const handleAddWidget = () => {
    console.log("Add widget clicked");
  };

  return (
    <main className="w-full flex justify-center font-sans p-6">
      <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl space-y-6">
        <PlaygroundHeader />
        
        <QuickJumpBar favorites={favorites} />
        
        <ControlBar onJump={handleJump} />
        
        <WidgetGrid 
          widgets={widgets} 
          onAddWidget={handleAddWidget}
        />
      </div>
    </main>
  );
}

export function Playground() {
  /* demo data */
  const listEnvs: EhEnvDto[] = [
    { slug: "cross-04", displayName: "Cross-04" },
    { slug: "preprod-04", displayName: "Preprod-04" },
    { slug: "g64-int-01", displayName: "G64-Int-01" },
  ];

  const listApps: EhAppDto[] = [
    { slug: "Prod-LIMS", displayName: "Prod-LIMS" },
    { slug: "Kafka-UI", displayName: "Kafka-UI" },
    { slug: "LIMS-API", displayName: "LIMS-API" },
  ];

  return (
    <EhConfigProvider listEnvs={listEnvs} listApps={listApps}>
      <EhUserProvider 
        initialEnv={listEnvs[0]} 
        initialApp={listApps[0]}
      >
        <PlaygroundContent />
      </EhUserProvider>
    </EhConfigProvider>
  );
}


