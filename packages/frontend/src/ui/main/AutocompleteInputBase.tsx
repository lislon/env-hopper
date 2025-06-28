import React, { useState, useMemo } from 'react';
import { appsAutocompleteMockedData } from '../../data/appsAutocompleteMockedData';
import { Home, Folder, FileText, AlertCircle, Clock, ExternalLink } from 'lucide-react';

// Highlight helper (if needed)
const highlightMatch = (text: string, query: string) => <>{text}</>;

export const AutocompleteInputBase: React.FC = () => {
  const [variant, setVariant] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const apps = useMemo(() => Array.from(new Set(appsAutocompleteMockedData.map(i => i.app))), []);
  const appVersions = useMemo(() => {
    const versions: Record<string,string> = {};
    apps.forEach(app => { versions[app] = `v.${(Math.random()*2+1).toFixed(1)}.${Math.floor(Math.random()*10)}`; });
    return versions;
  }, [apps]);

  const appGroupsMap = useMemo(() =>
      apps.map(app => {
        const filtered = appsAutocompleteMockedData.filter(i => i.app === app);
        const groups = Object.values(
          filtered.reduce((acc, item) => {
            const key = item.group || 'default';
            if (!acc[key]) acc[key] = { group: item.group, pages: [] as typeof appsAutocompleteMockedData };
            acc[key].pages.push(item);
            return acc;
          }, {} as Record<string,{group:string|null;pages:typeof appsAutocompleteMockedData}>)
        );
        return { app, groups };
      })
    , [apps]);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-4">
      {/* Variant Selector */}
      <div className="join">
        {['A','B','C','D'].map(v => (
          <button
            key={v}
            className={`join-item btn ${variant===v?'btn-primary':''}`}
            onClick={()=>setVariant(v as any)}
          >Variant {v}</button>
        ))}
      </div>

      {/* Base Search Input */}
      <input type="text" className="input input-bordered w-full" placeholder="Search..." />

      {/* Variant A */}
      {variant==='A' && (
        <div className="space-y-6">
          {appGroupsMap.map(({app,groups}) => (
            <div key={app}>
              <div className="flex justify-between items-center text-lg font-bold text-primary mb-2">
                {app} <span className="text-sm text-gray-400">{appVersions[app]}</span>
              </div>
              {groups.map(({group,pages})=>(
                <div key={group||'default'} className="mb-2">
                  {group && (
                    <div className="flex items-center text-md font-semibold text-secondary mb-1 gap-2">
                      <Folder size={16}/> {group}
                    </div>
                  )}
                  <ul className="ml-6 space-y-1">
                    {pages.map((page,idx)=>(
                      <li key={idx} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-base-200">
                        {page.title.toLowerCase().includes('home')?<Home size={16}/>:<FileText size={16}/>}
                        <span className="flex-1">{page.title}</span>
                        {page.title.includes('#') && <AlertCircle size={14} className="text-warning" />}
                        {idx===0 && <Clock size={14} className="text-info" />}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Variant B */}
      {variant==='B' && (
        <div className="space-y-6">
          {appGroupsMap.map(({app,groups})=>(
            <div key={app} className="bg-base-200 p-4 rounded-xl shadow">
              <div className="flex justify-between items-center text-2xl font-extrabold text-primary mb-4">
                {app} <span className="text-sm text-gray-400">{appVersions[app]}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {groups.map(({group,pages})=>(
                  <div key={group||'default'} className="bg-base-100 p-3 rounded border border-base-300">
                    {group && (
                      <div className="flex items-center text-lg font-semibold text-secondary mb-2 gap-2">
                        <Folder size={18}/> {group}
                      </div>
                    )}
                    <ul className="space-y-1">
                      {pages.map((page,idx)=>(
                        <li key={idx} className="flex justify-between items-center px-2 py-1 rounded hover:bg-base-300">
                          <span>{page.title}</span>
                          <div className="flex gap-1 items-center text-xs">
                            {page.title.includes('#')&&<span className="badge badge-warning">param</span>}
                            {idx===0 &&<span className="badge badge-info">recent</span>}
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

      {/* Variant C */}
      {variant==='C' && (
        <div className="space-y-6">
          {appGroupsMap.map(({app,groups})=>(
            <div key={app} className="bg-base-200 p-4 rounded-lg shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Home size={24} className="text-purple-600" />
                  <h2 className="text-2xl font-bold text-purple-700">{app}</h2>
                </div>
                <span className="text-sm font-mono text-gray-500">{appVersions[app]}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {groups.map(({group,pages})=>(
                  <div key={group||'default'} className="bg-white p-3 rounded-md border-l-4 border-purple-600">
                    {group && (
                      <div className="flex items-center mb-2">
                        <Folder size={18} className="text-purple-600 mr-1"/>
                        <h3 className="text-lg font-semibold text-gray-700">{group}</h3>
                      </div>
                    )}
                    <ul className="space-y-1">
                      {pages.map((page,idx)=>(
                        <li key={idx} className="flex justify-between items-center p-2 hover:bg-base-100 rounded">
                          <div className="flex items-center gap-2">
                            {page.title.toLowerCase().includes('home')?<Home size={16}/>:<FileText size={16}/>}
                            <span className="text-sm text-gray-800">{page.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {page.title.includes('#')&&<AlertCircle size={14} className="text-yellow-500" />}
                            <Clock size={14} className="text-blue-500" />
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

      {/* Variant D */}
      {variant==='D' && (
        <div className="space-y-6">
          {appGroupsMap.map(({app,groups})=>(
            <div key={app} className="bg-white p-4 rounded-lg shadow-inner border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Folder size={24} className="text-green-600" />
                  <h2 className="text-xl font-semibold text-green-700">{app}</h2>
                </div>
                <span className="text-sm text-gray-500">{appVersions[app]}</span>
              </div>
              {groups.map(({group,pages})=>(
                <div key={group||'default'} className="mb-3">
                  {group && (
                    <div className="bg-green-50 px-3 py-1 rounded-full inline-block mb-2">
                      <h3 className="text-sm font-medium text-green-800">{group}</h3>
                    </div>
                  )}
                  <ul className="grid grid-cols-3 gap-2">
                    {pages.map((page,idx)=>(
                      <li key={idx} className="flex items-center gap-1 p-2 bg-gray-50 rounded hover:bg-gray-100">
                        <FileText size={14} className="text-gray-600" />
                        <span className="text-xs text-gray-800">{page.title}</span>
                        {page.title.includes('#')&&<AlertCircle size={12} className="text-red-500 ml-auto" />}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
