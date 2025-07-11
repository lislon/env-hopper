import React, { useState } from "react";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "~/components/ui/command";
import { useCommandState } from "cmdk";
import { EhBackendAppInputIndexed } from "@env-hopper/backend-core";
import { Package, FileText, ExternalLink, ArrowLeft } from "lucide-react";
import { AppIcon } from "./AppIcon";

interface AppSelectorCommandProps {
  apps: EhBackendAppInputIndexed[];
  onSelect?: (app: EhBackendAppInputIndexed, page?: { slug: string; title?: string; url: string }) => void;
  placeholder?: string;
  className?: string;
}

interface AppSelectorCommandDialogProps extends AppSelectorCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}



// SubItem component that only shows when there's a search term
interface SubItemProps {
  app: EhBackendAppInputIndexed;
  page: { slug: string; title?: string; url: string };
  groupName: string;
  onSelect: () => void;
}

function SubItem({ app, page, groupName, onSelect }: SubItemProps) {
  const search = useCommandState((state) => state.search);
  if (!search) return null;
  
  return (
    <CommandItem
      key={`${app.slug}-${page.slug}`}
      value={`${page.slug} ${page.title || page.slug} ${groupName} ${app.displayName}`}
      onSelect={onSelect}
      className="pl-8"
    >
      <FileText className="w-4 h-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="font-medium">{page.title || page.slug}</span>
        <span className="text-xs text-muted-foreground">
          {app.displayName} • {groupName}
        </span>
      </div>
      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-60 ml-auto" />
    </CommandItem>
  );
}

function AppItem({
  children,
  value,
  subtitle,
  onSelect,
}: {
  children: React.ReactNode;
  value: string;
  subtitle: string;
  onSelect: () => void;
}) {
  return (
    <CommandItem value={value} onSelect={onSelect}>
      <div className="app-item-icon-wrapper flex items-center gap-2 w-full">
        {children}
      </div>
    </CommandItem>
  );
}

function AppPagesPanel({
  app,
  onPageSelect,
}: {
  app: EhBackendAppInputIndexed;
  onPageSelect: (app: EhBackendAppInputIndexed, page: { slug: string; title?: string; url: string }) => void;
}) {
  return (
    <div className="p-4">

      {!app.ui?.groups || app.ui.groups.length === 0 || !app.ui.groups.some(group => group.pages.length > 0) ? (
        <div className="text-center py-8">
          <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No pages available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {app.ui.groups.map((group) =>
            group.pages.length > 0 ? (
              <div key={group.slug}>
                <h4 className="font-medium text-sm mb-2 text-muted-foreground">{group.displayName}</h4>
                <div className="space-y-1">
                  {group.pages.map((page) => (
                    <button
                      key={page.slug}
                      onClick={() => onPageSelect(app, page)}
                      className="w-full p-2 text-left hover:bg-accent rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{page.title || page.slug}</span>
                          {page.url && (
                            <span className="text-xs text-muted-foreground">{page.url}</span>
                          )}
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-60 ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

export function AppSelectorCommand({
  apps,
  onSelect,
  placeholder = "Find applications and pages...",
  className,
}: AppSelectorCommandProps) {
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");

  // Find the selected app
  const selectedApp = apps.find(app => value === app.slug);

  const handleAppSelect = (app: EhBackendAppInputIndexed) => {
    setValue(app.slug);
    // If app has no pages, select it directly
    if (!app.ui?.groups || app.ui.groups.length === 0 || !app.ui.groups.some(group => group.pages.length > 0)) {
      onSelect?.(app);
    }
  };

  const handlePageSelect = (app: EhBackendAppInputIndexed, page: { slug: string; title?: string; url: string }) => {
    onSelect?.(app, page);
  };

  return (
    <div className={`app-selector ${className}`}>
      <Command value={value} onValueChange={setValue}>
        <div className="app-selector-header border-b p-3">
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            className="border-0 outline-none bg-transparent text-sm"
          />
        </div>
        <CommandList>
          <div className="flex h-[400px]">
            <div className="flex-1/3 border-r overflow-y-auto">
              <CommandEmpty>No applications found.</CommandEmpty>
              <CommandGroup heading="Applications" className="p-2">
                {apps.map((app) => {
                  // Get first 3 pages across all groups for SubItems
                  const firstPages = (app.ui?.groups || [])
                    .flatMap(group => 
                      group.pages.map(page => ({ ...page, groupName: group.displayName }))
                    )
                    .slice(0, 3);

                  return (
                    <React.Fragment key={app.slug}>
                      <AppItem
                        value={app.slug}
                        subtitle={app.abbr || ''}
                        onSelect={() => handleAppSelect(app)}
                      >
                        <AppIcon app={app} className="w-5 h-5" />
                        <div className="flex flex-col">
                          <span className="font-medium">{app.displayName}</span>
                          <span className="text-xs text-muted-foreground">{app.abbr}</span>
                        </div>
                        {app.ui?.groups && app.ui.groups.length > 0 && app.ui.groups.some(group => group.pages.length > 0) && (
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-60 ml-auto" />
                        )}
                      </AppItem>
                      
                      {/* SubItems - first 3 pages, only shown when searching */}
                      {firstPages.map((page) => (
                        <SubItem
                          key={`${app.slug}-${page.slug}`}
                          app={app}
                          page={page}
                          groupName={page.groupName}
                          onSelect={() => handlePageSelect(app, page)}
                        />
                      ))}
                    </React.Fragment>
                  );
                })}
              </CommandGroup>
            </div>
            <div className="w-px bg-border"></div>
            <div className="flex-2/3 overflow-y-auto">
              {selectedApp ? (
                <AppPagesPanel app={selectedApp} onPageSelect={handlePageSelect} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center p-6">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Select an application to see pages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CommandList>
      </Command>
    </div>
  );
}

export function AppSelectorCommandDialog({
  open,
  onOpenChange,
  title = "Select Application",
  description = "Choose an application and page to navigate to",
  apps,
  onSelect,
  placeholder = "Find applications and pages...",
}: AppSelectorCommandDialogProps) {
  const [search, setSearch] = useState("");
  const [pages, setPages] = useState<string[]>([]);
  const page = pages[pages.length - 1];

  // Find the current app if we're on an app page
  const currentApp = page ? apps.find(app => app.slug === page) : null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Escape goes to previous page
    // Backspace goes to previous page when search is empty
    if (e.key === 'Escape' || (e.key === 'Backspace' && !search)) {
      e.preventDefault();
      setPages((pages) => pages.slice(0, -1));
    }
  };

  const handleAppSelect = (app: EhBackendAppInputIndexed) => {
    // If app has pages, navigate to app pages, otherwise select the app directly
    if (app.ui?.groups && app.ui.groups.length > 0 && app.ui.groups.some(group => group.pages.length > 0)) {
      setPages([...pages, app.slug]);
    } else {
      onSelect?.(app);
      onOpenChange(false);
    }
  };

  const handlePageSelect = (app: EhBackendAppInputIndexed, page: { slug: string; title?: string; url: string }) => {
    onSelect?.(app, page);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset pages when closing
      setPages([]);
      setSearch("");
    }
    onOpenChange(newOpen);
  };

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={handleOpenChange}
      className="max-w-4xl w-full h-[600px]"
    >
      <Command onKeyDown={handleKeyDown} className="h-full flex flex-col">
        <CommandInput
          placeholder={placeholder}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="flex-1 overflow-y-auto">
          <CommandEmpty>No results found.</CommandEmpty>
          
          {/* Root level - show applications */}
          {!page && (
            <CommandGroup heading="Applications">
              {apps.map((app) => {
                // Get first 3 pages across all groups for this app
                const firstPages = (app.ui?.groups || [])
                  .flatMap(group => 
                    group.pages.map(page => ({ ...page, groupName: group.displayName }))
                  )
                  .slice(0, 3);

                return (
                  <React.Fragment key={app.slug}>
                    <CommandItem
                      value={`${app.slug} ${app.displayName} ${app.abbr}`}
                      onSelect={() => handleAppSelect(app)}
                    >
                      <AppIcon app={app} />
                      <div className="flex flex-col">
                        <span className="font-medium">{app.displayName}</span>
                        <span className="text-xs text-muted-foreground">{app.abbr}</span>
                      </div>
                      {app.ui?.groups && app.ui.groups.length > 0 && app.ui.groups.some(group => group.pages.length > 0) && (
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-60 ml-auto" />
                      )}
                    </CommandItem>
                    
                    {/* SubItems - first 3 pages, only shown when searching */}
                    {firstPages.map((page) => (
                      <SubItem
                        key={`${app.slug}-${page.slug}`}
                        app={app}
                        page={page}
                        groupName={page.groupName}
                        onSelect={() => handlePageSelect(app, page)}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </CommandGroup>
          )}

          {/* App level - show pages for selected app */}
          {page && currentApp && (
            <>
              <CommandItem
                value="back"
                onSelect={() => setPages((pages) => pages.slice(0, -1))}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to applications</span>
              </CommandItem>
              
              <CommandGroup heading={`${currentApp.displayName} - Pages`}>
                {(currentApp.ui?.groups || []).map((group) =>
                  group.pages.map((page) => (
                    <CommandItem
                      key={`${group.slug}-${page.slug}`}
                      value={`${page.slug} ${page.title || page.slug} ${group.displayName}`}
                      onSelect={() => handlePageSelect(currentApp, page)}
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{page.title || page.slug}</span>
                        <span className="text-xs text-muted-foreground">
                          {group.displayName}
                          {page.url && ` • ${page.url}`}
                        </span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-60 ml-auto" />
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
} 