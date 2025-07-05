import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Package, Search } from "lucide-react";
import { useEhGlobalContextProps } from "~/contexts";
import { EhAppDto } from "@env-hopper/backend-core";
import { EhBackendTagDescriptionDataIndexed, EhBackendTagFixedTagValue } from "@env-hopper/backend-core";

interface ExploreAppDialogProps {
  children: React.ReactNode;
  onAppSelect?: (app: EhAppDto) => void;
}

interface AppGroup {
  tagDisplayName: string;
  apps: EhAppDto[];
}

export function ExploreAppDialog({ children, onAppSelect }: ExploreAppDialogProps) {
  const { indexData } = useEhGlobalContextProps();
  const listApps = indexData.apps;
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Get the first tag description that has fixedTagValues
  const desc = indexData.appsMeta.tags.descriptions;
  const groupingTag = useMemo(() => {
    return desc.find((desc: EhBackendTagDescriptionDataIndexed) =>
      desc.fixedTagValues && desc.fixedTagValues.length > 0
    );
  }, [desc]);

  // Helper function to get all tags from an app (app-level, group-level, page-level)
  const getAllAppTags = (app: EhAppDto): string[] => {
    const allTags = new Set<string>();

    // App-level tags
    if (app.tags) {
      app.tags.forEach(tag => allTags.add(tag));
    }

    // Group-level and page-level tags
    if (app.ui?.groups) {
      app.ui.groups.forEach(group => {
        if (group.tags) {
          group.tags.forEach(tag => allTags.add(tag));
        }

        if (group.pages) {
          group.pages.forEach(page => {
            if (page.tags) {
              page.tags.forEach(tag => allTags.add(tag));
            }
          });
        }
      });
    }

    return Array.from(allTags);
  };

  // Group apps by tag values
  const groupedApps = useMemo(() => {
    if (!groupingTag || !groupingTag.fixedTagValues) {
      // If no grouping tag, put all apps in a single "All Applications" group
      return [{
        tagDisplayName: "All Applications",
        apps: listApps
      }];
    }

    const groups: AppGroup[] = [];
    const processedApps = new Set<string>();

    // Create groups for each fixed tag value
    groupingTag.fixedTagValues.forEach((fixedValue: EhBackendTagFixedTagValue) => {
      // Construct the full tag string as "key:value"
      const fullTagString = `${groupingTag.tagKey}:${fixedValue.tagValue}`;

      const appsInGroup = listApps.filter(app => {
        const appTags = getAllAppTags(app);
        return appTags.includes(fullTagString);
      });

      if (appsInGroup.length > 0) {
        groups.push({
          tagDisplayName: fixedValue.displayName,
          apps: appsInGroup
        });

        // Track which apps we've processed
        appsInGroup.forEach(app => processedApps.add(app.slug));
      }
    });

    // Add remaining apps to "Other" group
    const otherApps = listApps.filter(app => !processedApps.has(app.slug));
    if (otherApps.length > 0) {
      groups.push({
        tagDisplayName: "Other",
        apps: otherApps
      });
    }

    return groups;
  }, [listApps, groupingTag]);

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchValue.trim()) {
      return groupedApps;
    }

    const searchLower = searchValue.toLowerCase();
    return groupedApps.map(group => ({
      ...group,
      apps: group.apps.filter(app =>
        app.displayName.toLowerCase().includes(searchLower) ||
        app.slug.toLowerCase().includes(searchLower)
      )
    })).filter(group => group.apps.length > 0);
  }, [groupedApps, searchValue]);

  // Get secondary text for an app (list of groups if more than 1)
  const getAppSecondaryText = (app: EhAppDto): string | null => {
    if (!app.ui?.groups || app.ui.groups.length <= 1) {
      return null;
    }

    return app.ui.groups.map(group => group.displayName).join(", ");
  };

  const handleAppSelect = (app: EhAppDto) => {
    if (onAppSelect) {
      onAppSelect(app);
    }
    setIsOpen(false);
  };

  const totalAppsCount = filteredGroups.reduce((sum, group) => sum + group.apps.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-none h-[90vh] max-h-none flex flex-col">
        <DialogHeader>
          <DialogTitle>Explore All Applications</DialogTitle>
          <DialogDescription>
            Browse and select from all available applications ({listApps.length} total)
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Apps catalog */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {totalAppsCount === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No applications found for "{searchValue}"</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredGroups.map((group) => (
                  <div key={group.tagDisplayName}>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">
                      {group.tagDisplayName} ({group.apps.length})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {group.apps.map((app) => {
                        const secondaryText = getAppSecondaryText(app);

                        return (
                          <Card
                            key={app.slug}
                            className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                            onClick={() => handleAppSelect(app)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start gap-3">
                                <Package className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="text-base font-semibold truncate">
                                    {app.displayName}
                                  </CardTitle>
                                  {secondaryText && (
                                    <CardDescription className="text-sm mt-1">
                                      {secondaryText}
                                    </CardDescription>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="text-xs text-muted-foreground truncate">
                                {app.slug}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with count */}
        <div className="text-sm text-muted-foreground text-center pt-2 border-t">
          Showing {totalAppsCount} of {listApps.length} applications
        </div>
      </DialogContent>
    </Dialog>
  );
}
