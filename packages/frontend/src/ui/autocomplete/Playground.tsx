import React, { useState } from "react";
import { PlaygroundHeader } from "./components/header/PlaygroundHeader";

import { EnvironmentTabs } from "./components/environmentTabs/EnvironmentTabs";
import { QuickJumpBar } from "./components/quickBar/QuickJumpBar";
import { ControlBar } from "./components/controlPanel/ControlBar";
import { WidgetGrid } from "./components/widgetPanel/WidgetGrid";
import { Footer } from "./components/footer/Footer";
import { LeftPanel } from "./components/leftPanel/LeftPanel";
import { EhConfigProvider, EhUserProvider, EhUserBehaviourMemoryProvider, useEhUserContext, EhSearchIndexProvider } from "~/contexts";
import { ThemeProvider } from "~/components/theme-provider";
import { useQueryWithPersistence } from '~/api/data/useQueryWithPersistence';
import { AppSelectorDemo } from "./components/AppSelectorDemo";
import { EhCommandInput } from "./components/commandInput/EhCommandInput";

/**
 * Jump‑only prototype (shadcn/ui version)
 * – Quick‑Jump tiles (square 2×3)
 * – One‑liner control bar with split Jump / Tools
 * – Widget grid (Creds, Version, Add)
 */
function PlaygroundContent() {
  const { currentEnv, currentApp } = useEhUserContext();
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
    console.log(`Jumping to ${currentEnv?.slug}/${currentApp?.slug}`);
  };

  const handleCommand = (command: string) => {
    console.log(`Command executed: ${command}`);
  };

  const handleAddWidget = () => {
    console.log("Add widget clicked");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex">
        {/* Left panel */}
        <LeftPanel className="h-screen" />

        {/* Main content area */}
        <main className="flex-1 w-full flex justify-center font-sans p-6">
          <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl space-y-6">
            <PlaygroundHeader />

            {/* <ControlBar onJump={handleJump} /> */}
            <div className="flex gap-4 flex-row">
              <EhCommandInput onCommand={handleCommand} className="w-2/12" />
              <EhCommandInput onCommand={handleCommand} className="w-10/12" />
            </div>
            <QuickJumpBar />

            {/* <AppSelectorDemo /> */}


            {/* AppDropdownContent for testing - make it larger
            <div className="border border-border rounded-lg p-6 bg-card">
              <h2 className="text-lg font-semibold mb-4">AppDropdownContent Preview</h2>
              <div className="w-full max-w-2xl">
                <AppDropdownContent
                  searchValue=""
                  onSelect={(value) => console.log("Selected:", value)}
                  getItemProps={(options) => options}
                  highlightedIndex={-1}
                  isUntouched={true}
                />
              </div>
            </div> */}

            <WidgetGrid
              widgets={widgets}
              onAddWidget={handleAddWidget}
            />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export function Playground() {
  const { data, isPending } = useQueryWithPersistence();

  if (isPending || !data) {
    return 'Loading...';
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <EhConfigProvider indexData={data}>
        <EhUserBehaviourMemoryProvider>
          <EhUserProvider
            initialEnvSlug={Object.values(data.envs)[0]?.slug}
            initialAppSlug={Object.values(data.apps)[0]?.slug}
          >
            <EhSearchIndexProvider>
              <PlaygroundContent />
            </EhSearchIndexProvider>
          </EhUserProvider>
        </EhUserBehaviourMemoryProvider>
      </EhConfigProvider>
    </ThemeProvider>
  );
}

