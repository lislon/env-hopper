import React from "react";
import { Package, Star, ExternalLink, Expand } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useEhGlobalContextProps } from "~/contexts";
import { EhAppDto } from "@env-hopper/backend-core";
import { BaseDropdownContentProps } from "~/types/ehTypes";
import { ExploreAppDialog } from "~/ui/explore/apps/ExploreAppDialog";

interface AppDropdownContentProps extends BaseDropdownContentProps {}

export function AppDropdownContent({ 
  searchValue = "", 
  onSelect,
  getItemProps,
  highlightedIndex = -1,
  isUntouched
}: AppDropdownContentProps) {
  const { indexData } = useEhGlobalContextProps();
  const listApps = indexData.apps;

  // Filter apps based on search value
  const filteredApps = listApps.filter((app) =>
    {
      if (isUntouched) {
        return true;
      }
      return app.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
        app.slug.toLowerCase().includes(searchValue.toLowerCase());
    }
  );

  // Determine if app is featured/important
  const isFeaturedApp = (slug: string) => {
    const featuredApps = ["main-app", "core-service", "api-gateway"];
    return featuredApps.includes(slug);
  };

  const handleAppSelect = (app: EhAppDto) => {
    if (onSelect) {
      onSelect(app.slug);
    }
  };

  if (filteredApps.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No applications found for "{searchValue}"
      </div>
    );
  }

  return (
    <div>
      <div className="max-h-[300px] overflow-y-auto">
        {filteredApps.map((app, index) => {
          const isFeatured = isFeaturedApp(app.slug);
          const isHighlighted = highlightedIndex === index;
          
          return (
            <div
              key={app.slug}
              {...(getItemProps ? getItemProps({ 
                item: app.slug, 
                index,
                onClick: () => handleAppSelect(app)
              }) : {})}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                isHighlighted 
                  ? 'bg-accent text-accent-foreground' 
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">
                    {app.displayName}
                  </span>
                  {isFeatured && (
                    <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {app.slug}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Horizontal line and explore button */}
      <div className="border-t border-border mt-2">
        <div className="p-3">
          <ExploreAppDialog onAppSelect={(app) => handleAppSelect(app)}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            >
              <Expand className="h-4 w-4" />
              Explore all apps
            </Button>
          </ExploreAppDialog>
        </div>
      </div>
    </div>
  );
} 