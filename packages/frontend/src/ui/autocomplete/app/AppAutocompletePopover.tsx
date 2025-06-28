import { AppsForAutoComplete } from '~/data/appsAutocompleteMockedData';
import type {
  UseComboboxPropGetters,
  GetPropsCommonOptions,
} from 'downshift';
import { Folder } from 'lucide-react';

export interface AppAutocompletePopoverProps {
  /** Items that should be rendered inside the popover */
  items: AppsForAutoComplete[];
  /** Downshift helper that needs to be spread on the menu container */
  getMenuProps: UseComboboxPropGetters<AppsForAutoComplete>['getMenuProps'];
  /** Downshift helper that needs to be spread on each item */
  getItemProps: UseComboboxPropGetters<AppsForAutoComplete>['getItemProps'];
  /** The index currently highlighted by Downshift */
  highlightedIndex: number | null;
}

export function AppAutocompletePopover({
  items,
  getMenuProps,
  getItemProps,
  highlightedIndex,
}: AppAutocompletePopoverProps) {
  // Group items by app
  const appGroups = items.reduce((acc, item, index) => {
    if (!acc[item.app]) {
      acc[item.app] = [];
    }
    acc[item.app].push({ ...item, originalIndex: index });
    return acc;
  }, {} as Record<string, Array<AppsForAutoComplete & { originalIndex: number }>>);

  // Further group by group within each app
  const appGroupsMap = Object.entries(appGroups).map(([app, appItems]) => {
    const groups = appItems.reduce((acc, item) => {
      const key = item.group || 'default';
      if (!acc[key]) {
        acc[key] = { group: item.group, pages: [] };
      }
      acc[key].pages.push(item);
      return acc;
    }, {} as Record<string, { group: string | null; pages: Array<AppsForAutoComplete & { originalIndex: number }> }>);
    
    return { app, groups: Object.values(groups) };
  });

  return (
    <div
      {...getMenuProps({
        className:
          'mt-2 shadow-lg bg-base-100 rounded-box border border-base-300 h-[80vh] overflow-auto p-4 space-y-4',
      })}
    >
      {items.length === 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 select-none">No results</div>
      )}
      {appGroupsMap.map(({ app, groups }) => (
        <div key={app} className="bg-base-200 p-4 rounded-xl shadow">
          <div className="flex justify-between items-center text-xl font-extrabold text-primary mb-3">
            {app}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {groups.map(({ group, pages }) => (
              <div key={group || 'default'} className="bg-base-100 p-3 rounded border border-base-300">
                {group && (
                  <div className="flex items-center text-sm font-semibold text-secondary mb-2 gap-2">
                    <Folder size={16} /> {group}
                  </div>
                )}
                <ul className="space-y-1">
                  {pages.map((page) => (
                    <li
                      key={`${page.app}-${page.group ?? 'nogroup'}-${page.title}-${page.originalIndex}`}
                      {...getItemProps({ item: page, index: page.originalIndex })}
                      className={`flex justify-between items-center px-2 py-1 rounded cursor-pointer ${
                        highlightedIndex === page.originalIndex ? 'bg-primary text-primary-content' : 'hover:bg-base-300'
                      }`}
                    >
                      <span className="text-sm">{page.title}</span>
                      <div className="flex gap-1 items-center text-xs">
                        {page.title.includes('#') && <span className="badge badge-warning badge-xs">param</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
