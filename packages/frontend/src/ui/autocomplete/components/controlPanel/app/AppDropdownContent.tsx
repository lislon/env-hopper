import React from "react";
import { Package, Star } from "lucide-react";
import { useEhGlobalContextProps } from "~/contexts";
import { EhAppDto } from "~/types/ehTypes";

interface AppDropdownContentProps {
  searchValue?: string;
  onSelect?: (value: string) => void;
  getMenuProps?: () => any;
  getItemProps?: (options: any) => any;
  highlightedIndex?: number;
  isOpen?: boolean;
}

export function AppDropdownContent({ 
  searchValue = "", 
  onSelect,
  getItemProps,
  highlightedIndex = -1,
}: AppDropdownContentProps) {
  const { listApps } = useEhGlobalContextProps();

  // Filter apps based on search value
  const filteredApps = listApps.filter((app) =>
    app.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
    app.slug.toLowerCase().includes(searchValue.toLowerCase())
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
  );
} 