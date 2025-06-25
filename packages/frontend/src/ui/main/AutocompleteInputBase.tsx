import React, { useMemo, useState } from 'react';
import { autocompleteData } from './autocompleteData';
import { Home, Folder, FileText, AlertCircle, Clock } from 'lucide-react';

export const AutocompleteInputBase: React.FC = () => {
  const [variant, setVariant] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('A');


  const apps = Array.from(new Set(autocompleteData.map(i => i.app)));
  const appVersions = useMemo(() => {
    const versions: Record<string, string> = {};
    apps.forEach(app => {
      const major = (Math.random() * 3 + 1).toFixed(1);
      const patch = Math.floor(Math.random() * 10);
      versions[app] = `v.${major}.${patch}`;
    });
    return versions;
  }, []);

  const appGroupsMap = apps.map(app => {
    const filtered = autocompleteData.filter(i => i.app === app);
    const grouped = Object.values(
      filtered.reduce((acc, item) => {
        const key = item.group || 'default';
        if (!acc[key]) acc[key] = { group: item.group, pages: [] };
        acc[key].pages.push(item);
        return acc;
      }, {} as Record<string, { group: string | null; pages: typeof autocompleteData }>)
    );
    return { app, groups: grouped };
  });

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="join">
        {['A', 'B', 'C', 'D', 'E', 'F'].map((v) => (
          <button
            key={v}
            className={`join-item btn ${variant === v ? 'btn-primary' : ''}`}
            onClick={() => setVariant(v as any)}
          >
            Variant {v}
          </button>
        ))}
      </div>
      <input type="text" className="input input-bordered w-full" placeholder="Search..." />

      {/* Variant A: Icons before each page, bold app */}
      {variant === 'A' && (
        <div className="space-y-6">
          {appGroupsMap.map(({ app, groups }) => (
            <div key={app}>
              <div className="text-lg font-bold text-primary mb-2 flex justify-between items-center">{app}<span className="text-sm text-gray-400">{appVersions[app]}</span></div>
              {groups.map(({ group, pages }) => (
                <div key={group || 'default'} className="mb-2">
                  {group && (
                    <div className="text-md font-semibold text-secondary mb-1 ml-2 flex items-center gap-2">
                      <Folder size={16} /> {group}
                    </div>
                  )}
                  <ul className="ml-6 space-y-1">
                    {pages.map((page, idx) => (
                      <li key={idx} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-base-200">
                        {page.title.toLowerCase().includes('home') ? <Home size={16} /> : <FileText size={16} />}
                        <span className="flex-1">{page.title}</span>
                        {page.title.includes('#') && <AlertCircle size={14} className="text-warning" title="Requires param" />}
                        {idx === 0 && <Clock size={14} className="text-info" title="Recently used" />}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {variant === 'B' && (
        <div className="space-y-6">
          {appGroupsMap.map(({ app, groups }) => (
            <div key={app} className="bg-base-200 p-4 rounded-xl shadow">
              <div className="text-2xl font-extrabold text-primary mb-4 flex justify-between items-center">{app}<span className="text-sm text-gray-400">v.{(Math.random()*3 + 1).toFixed(1)}.{Math.floor(Math.random()*10)}</span></div>
              <div className="grid grid-cols-2 gap-4">
                {groups.map(({ group, pages }) => (
                  <div key={group || 'default'} className="bg-base-100 p-3 rounded border border-base-300">
                    {group && (
                      <div className="text-lg font-semibold text-secondary mb-2 flex items-center gap-2">
                        <Folder size={18} /> {group}
                      </div>
                    )}
                    <ul className="space-y-1">
                      {pages.map((page, idx) => (
                        <li key={idx} className="flex justify-between items-center px-2 py-1 rounded hover:bg-base-300">
                          <span>{page.title}</span>
                          <div className="text-xs flex gap-1 items-center">
                            {page.title.includes('#') && <span className="badge badge-warning">param</span>}
                            {idx === 0 && <span className="badge badge-info">recent</span>}
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
      )}

      {variant === 'C' && (
        <div className="space-y-4 border-4 border-dashed border-accent p-4 rounded-xl bg-base-100">
          {appGroupsMap.map(({ app, groups }) => (
            <div key={app}>
              <div className="text-lg uppercase tracking-wide text-accent font-bold mb-2">{app}</div>
              {groups.map(({ group, pages }) => (
                <div key={group || 'default'} className="mb-3">
                  {group && <div className="ml-1 font-semibold text-base text-gray-700">{group}</div>}
                  <ul className="ml-4 mt-1 space-y-1">
                    {pages.map((page, idx) => (
                      <li key={idx} className="px-2 py-1 rounded bg-base-200 hover:bg-base-300 flex items-center justify-between">
                        <span className="text-sm font-medium">{page.title}</span>
                        {page.title.includes('#') && <span className="text-warning text-xs font-mono">#</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {variant === 'D' && (
        <div className="space-y-6">
          {appGroupsMap.map(({ app, groups }) => (
            <div key={app} className="bg-base-100 rounded-xl border border-primary p-4">
              <div className="text-lg font-bold text-primary mb-2">{app}</div>
              {groups.map(({ group, pages }) => (
                <div key={group || 'default'} className="mb-3">
                  {group && (
                    <div className="text-base font-semibold text-base-content bg-base-200 px-3 py-2 rounded flex items-center gap-2 hover:bg-primary hover:text-white cursor-pointer">
                      <Folder size={16} /> {group}
                    </div>
                  )}
                  <ul className="ml-4 mt-2 space-y-1">
                    {pages.map((page, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-base-200 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {page.title.toLowerCase().includes('home') ? <Home size={16} /> : <FileText size={16} />}
                          <span>{page.title}</span>
                        </span>
                        {page.title.includes('#') && (
                          <span
                            className="tooltip tooltip-left"
                            data-tip="This page needs extra input (like case ID)"
                          >
                            <AlertCircle className="text-warning" size={16} />
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ... other variants to be added next */}
    </div>
  );
};
