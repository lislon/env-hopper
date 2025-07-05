import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { 
  AppSelectorCommand, 
  AppSelectorCommandDialog 
} from "./AppSelectorCommand";
import { EhAppDto } from "@env-hopper/backend-core";
import { useEhGlobalContextProps } from "~/contexts";

// Sample data for testing (can be removed in production)
const sampleApps: EhAppDto[] = [
  {
    slug: "user-management",
    displayName: "User Management",
    abbr: "UM",
    ui: {
      groups: [
        {
          slug: "admin",
          displayName: "Administration",
          pages: [
            {
              slug: "users",
              title: "User List",
              url: "/admin/users",
              tags: ["admin", "users"]
            },
            {
              slug: "roles",
              title: "Role Management",
              url: "/admin/roles",
              tags: ["admin", "roles"]
            }
          ]
        },
        {
          slug: "profile",
          displayName: "Profile",
          pages: [
            {
              slug: "settings",
              title: "User Settings",
              url: "/profile/settings",
              tags: ["profile", "settings"]
            }
          ]
        }
      ]
    },
    tags: ["users", "admin"]
  },
  {
    slug: "analytics",
    displayName: "Analytics Dashboard",
    abbr: "AD",
    ui: {
      groups: [
        {
          slug: "reports",
          displayName: "Reports",
          pages: [
            {
              slug: "overview",
              title: "Overview Dashboard",
              url: "/analytics/overview",
              tags: ["dashboard", "analytics"]
            },
            {
              slug: "metrics",
              title: "Metrics",
              url: "/analytics/metrics",
              tags: ["metrics", "charts"]
            }
          ]
        }
      ]
    },
    tags: ["analytics", "dashboard"]
  }
];

export function AppSelectorDemo() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<EhAppDto | null>(null);
  const [selectedPage, setSelectedPage] = useState<{ slug: string; title?: string; url: string } | null>(null);

  // Try to use real data from context, fallback to sample data
  const { indexData } = useEhGlobalContextProps();
  const apps = indexData?.apps || sampleApps;

  const handleSelect = (app: EhAppDto, page?: { slug: string; title?: string; url: string }) => {
    setSelectedApp(app);
    setSelectedPage(page || null);
    console.log("Selected:", { app: app.displayName, page: page?.title || page?.slug });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        
        {/* Current Selection Display */}
        {selectedApp && (
          <div className="p-4 bg-accent/50 rounded-lg">
            <h3 className="font-medium">Current Selection:</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                <span className="font-medium">App:</span> {selectedApp.displayName} ({selectedApp.abbr})
              </p>
              {selectedPage && (
                <p className="text-sm">
                  <span className="font-medium">Page:</span> {selectedPage.title || selectedPage.slug}
                  {selectedPage.url && (
                    <span className="text-muted-foreground"> - {selectedPage.url}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inline Version */}
      <div className="space-y-2">
        <div className="border rounded-lg">
          <AppSelectorCommand
            apps={apps}
            onSelect={handleSelect}
            placeholder="Search applications and pages..."
          />
        </div>
      </div>

      {/* Dialog */}
      <AppSelectorCommandDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        apps={apps}
        onSelect={handleSelect}
        title="Select Application & Page"
        description="Choose an application and optionally a specific page to navigate to"
      />
    </div>
  );
} 