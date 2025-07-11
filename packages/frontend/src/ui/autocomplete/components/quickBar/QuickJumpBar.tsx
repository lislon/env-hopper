import React from "react";
import { useEhGlobalContextProps, useEhUserContext } from "~/contexts";
import { EhBackendAppInputIndexed } from "@env-hopper/backend-core";
import { Server, Package, Globe, Divide } from "lucide-react";
import { ActionCard } from "../ActionCard";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";


interface QuickJumpBarProps {
  className?: string;
}

// Environment color mapping
const getEnvironmentColor = (envSlug: string) => {
  if (envSlug.includes('cross')) return 'text-blue-600';
  if (envSlug.includes('preprod')) return 'text-orange-600';
  if (envSlug.includes('g64')) return 'text-violet-600';
  return 'text-gray-600';
};

// Environment icon mapping
const getEnvironmentIcon = (envSlug: string) => {
  if (envSlug.includes('cross')) return Package;
  if (envSlug.includes('prod')) return Globe;
  return Server;
};

// Helper function to get shortened page name
const getShortPageName = (app: EhBackendAppInputIndexed, page: { slug: string; title?: string; url: string }) => {
  return page.title || page.slug;
};

export function QuickJumpBar({ className }: QuickJumpBarProps) {
  const { indexData } = useEhGlobalContextProps();
  const { setCurrentEnv, setCurrentAppPage, currentEnv } = useEhUserContext();

  // Get first 6 pages from real data
  const getFirstSixPages = () => {
    const allPages = [];
    for (const app of Object.values(indexData.apps)) {
      if (app.ui?.groups) {
        for (const group of app.ui.groups) {
          for (const page of group.pages) {
            allPages.push({ app, page, group });
            if (allPages.length >= 6) break;
          }
          if (allPages.length >= 6) break;
        }
      }
      if (allPages.length >= 6) break;
    }
    return allPages;
  };

  const firstSixPages = getFirstSixPages();

  // Get first 3-4 real environments from context data
  const environments = Object.values(indexData.envs).slice(0, 4).map(env => ({
    id: env.slug,
    label: env.displayName || env.slug,
    icon: getEnvironmentIcon(env.slug),
    color: getEnvironmentColor(env.slug),
  }));

  const handleEnvironmentChange = (environment: string) => {
    setCurrentEnv(environment);
  };

  const handlePageSelect = (app: EhBackendAppInputIndexed, page: { slug: string; title?: string; url: string }) => {
    setCurrentAppPage(app.slug, page.slug);
    // Could navigate to page here in the future
    console.log(`Navigate to ${app.slug}/${page.slug}`);
  };

  return (
    <div className={`flex mb-6 gap-3 ${className}`}>
      {/* Left Column - Simplified Environment Switcher */}
      <div className="flex flex-col gap-1">
        {environments.map((env) => {
          const Icon = env.icon;
          const isActive = env.id === currentEnv?.slug;
          
          return (
            <Button
              key={env.id}
              variant={'ghost'}
              onClick={() => handleEnvironmentChange(env.id)}
              className={`justify-start
                ${isActive ? 'bg-accent text-accent-foreground font-medium' : ''}
              `}
            >
              <Icon className={`w-4 h-4 ${env.color} flex-shrink-0`} />
              {env.label}
            </Button>
          );
        })}
        
        <div className="mt-2"><Button className="w-full">Environment...</Button></div>
      </div>

      {/* Vertical Divider with padding */}
      <div>
        <Separator orientation="vertical" />
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