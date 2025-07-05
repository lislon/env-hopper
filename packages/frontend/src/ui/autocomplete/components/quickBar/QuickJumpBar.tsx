import React from "react";
import { useEhGlobalContextProps, useEhUserContext } from "~/contexts";
import { EhBackendAppInputIndexed } from "@env-hopper/backend-core";
import { Server, Package, Globe } from "lucide-react";
import { ActionCard } from "../ActionCard";

interface QuickJumpBarProps {
  className?: string;
}

// Utility function to create short page names
function getShortPageName(app: EhBackendAppInputIndexed, page: { slug: string; title?: string }) {
  const appName = app.abbr || app.displayName;
  const pageName = page.title || page.slug;
  return `${appName} - ${pageName}`;
}

// Environment icon mapping
const getEnvironmentIcon = (envSlug: string) => {
  if (envSlug.includes('cross')) return Package;
  if (envSlug.includes('prod')) return Globe;
  return Server;
};

// Environment color mapping
const getEnvironmentColor = (envSlug: string) => {
  if (envSlug.includes('cross')) return "text-blue-600";
  if (envSlug.includes('prod')) return "text-red-600";
  return "text-violet-600";
};

export function QuickJumpBar({ className }: QuickJumpBarProps) {
  const { indexData } = useEhGlobalContextProps();
  const { setEnv, setApp, env: currentEnv } = useEhUserContext();

  // Get first 6 pages from real data
  const getFirstSixPages = () => {
    const allPages = [];
    for (const app of indexData.apps) {
      for (const group of app.ui.groups) {
        for (const page of group.pages) {
          allPages.push({ app, page, group });
          if (allPages.length >= 6) break;
        }
        if (allPages.length >= 6) break;
      }
      if (allPages.length >= 6) break;
    }
    return allPages;
  };

  const firstSixPages = getFirstSixPages();

  // Get first 3-4 real environments from context data
  const environments = indexData.envs.slice(0, 4).map(env => ({
    id: env.slug,
    label: env.displayName || env.slug,
    icon: getEnvironmentIcon(env.slug),
    color: getEnvironmentColor(env.slug),
  }));

  const handleEnvironmentChange = (environment: string) => {
    const selectedEnv = indexData.envs.find(env => env.slug === environment);
    
    if (selectedEnv) {
    
      
      setEnv(selectedEnv);
    }
  };

  const handlePageSelect = (app: EhBackendAppInputIndexed, page: { slug: string; title?: string; url: string }) => {
    setApp(app);
    // Could navigate to page here in the future
    console.log(`Navigate to ${app.slug}/${page.slug}`);
  };

  return (
    <div className={`flex mb-6 ${className}`}>
      {/* Left Column - Simplified Environment Switcher */}
      <div className="flex flex-col gap-1 p-4 flex-grow-0">
        {environments.map((env) => {
          const Icon = env.icon;
          const isActive = env.id === currentEnv?.slug;
          
          return (
            <button
              key={env.id}
              onClick={() => handleEnvironmentChange(env.id)}
              className={`
                flex items-center gap-2 text-left px-3 py-2 rounded-md transition-colors text-sm text-nowrap
                hover:bg-accent/50
                ${isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'}
              `}
            >
              <Icon className={`w-4 h-4 ${env.color} flex-shrink-0`} />
              {env.label}
            </button>
          );
        })}
      </div>

      {/* Vertical Divider with padding */}
      <div className="flex items-center py-8">
        <div className="w-px bg-border h-full"></div>
      </div>

      {/* Right Column - 2x3 Grid of Pages */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3">
          {firstSixPages.map(({ app, page, group }, index) => (
            <ActionCard
              key={`${app.slug}-${page.slug}-${index}`}
              app={app}
              actionName={getShortPageName(app, page)}
              onClick={() => handlePageSelect(app, page)}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 