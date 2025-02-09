import React, { useEffect, useMemo, useState, useTransition } from 'react';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import { useQuery } from '@tanstack/react-query';
import { apiConfigServerPluginGetConfigs } from '../api/apiConfigServerPluginGetConfigs';
import { EhAppId, EhEnvId } from '@env-hopper/types';
import { formatAppTitleShort } from '../../../lib/format/formatAppTitleShort';
import { useEhContext } from '../../../context/EhContext';
import { getPreselectedBasedOnParams } from '../../../lib/utils';
import { useHeader } from '../../../context/HeaderContext';
import { Link } from '@tanstack/react-router';
import { LabelComboBox } from './LabelComboBox';
import { apiConfigServerPluginGetLabels } from '../api/apiConfigServerPluginGetLabels';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

export interface ConfigServerPluginProps {
  envId: EhEnvId;
  appId: EhAppId;
}

export function ConfigServerWindow({ appId, envId }: ConfigServerPluginProps) {

  const { config } = useEhContext();

  const { setBackButton } = useHeader();

  useEffect(() => {
    setBackButton(<Link className={'btn btn-outline'} to={'/env/$envId/app/$appId'} params={{ appId, envId }}
                        viewTransition>
      &larr;<span className={'hidden sm:block'}>Back to Env-Hopper</span>
    </Link>);

    return () => {
      setBackButton(undefined);
    };
  }, [envId, appId]);

  const { env, app } = useMemo(() => {
    return getPreselectedBasedOnParams({
      urlParams: {
        appId,
        envId
      },
      config
    });
  }, [appId, envId, config]);

  if (!app) {
    return <div>{appId} not found</div>;
  }

  if (!env) {
    return <div>{envId} not found</div>;
  }

  const { data: serverConfig, isPending: isPendingServerConfig } = useQuery({
    queryKey: ['plugin', 'config-server', app, env],
    queryFn: () => apiConfigServerPluginGetConfigs({
      appId: app.id,
      envId: env.id
    })
  });

  const { data: labels, isPending: isPendingLabels } = useQuery({
    queryKey: ['plugin', 'labels', app, env],
    queryFn: () => apiConfigServerPluginGetLabels({
      appId: app.id,
      envId: env.id
    })
  });

  const [label, setLabel] = useState('master');


  const data = useMemo(() => {
    return serverConfig?.split('\n');
  }, [serverConfig]);

  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState('');

  const filterSplit = useMemo(() => {
    return filter === '' ? [] : filter.split(/\s+/);
  }, [filter]);

  const listRef = React.useRef<HTMLDivElement | null>(null);


  const filtered = useMemo(() => {
    return data?.filter((line) => {
      if (!line) {
        return false;
      }
      const [key, value] = line.split(':', 2);
      if (value === undefined) {
        return false;
      }
      for (const filter of filterSplit) {
        if (filter.startsWith('^')) {
          if (!(key.startsWith(filter.slice(1)) || value.startsWith(filter.slice(1)))) {
            return false;
          }
        } else if (filter.startsWith('-')) {
          if (key.startsWith(filter.slice(1)) || value.startsWith(filter.slice(1))) {
            return false;
          }
        } else if (!(key.includes(filter) || value.includes(filter))) {
          return false;
        }
      }
      return true;
    });
  }, [data, filterSplit]);

  const virtualizer = useWindowVirtualizer({
    count: filtered?.length || 0,
    estimateSize: () => 30,
    overscan: 20,
    scrollMargin: listRef.current?.offsetTop ?? 0
  });

  return (
    <div className={'w-full sm:p-8'}>
      <div className={'flex items-center gap-4 m-4'}>
        <div>
          Config of <code>{formatAppTitleShort(app)}</code> on <code>{env.id}</code>
        </div>
        <div>
          <LabelComboBox initialLabels={labels || []} onLabelSelect={setLabel} selectedLabel={label} />
        </div>
      </div>
      <div className={"my-4"}>
        <input className={'input input-bordered w-full'}
               placeholder={'Filter by key/value...'}
               autoFocus
               onChange={(e) => {
                 startTransition(() => {
                   setFilter(e.target.value);
                 });
               }} />
      </div>
      {isPendingServerConfig && <div>Pending...</div>}
      {filtered && <div className={`relative w-full`} ref={listRef} style={{
        height: `${virtualizer.getTotalSize()}px`
      }}>
        {virtualizer.getVirtualItems().map((item) => {
          const string = filtered[item.index];
          if (!string) {
            debugger;
          }
          const [key, value] = string.split(':', 2);
          //
          // return <tr key={item.key}>
          //   <td>
          //     <RenderParts value={key} filter={filter} />
          //   </td>
          //   <td className={'overflow-auto'}>
          //     <RenderParts value={value} filter={filter} />
          //   </td>
          // </tr>;

          return (
            <div
              key={item.key}
              className={`absolute top-0 left-0 w-full flex hover:bg-base-200`}
              style={{
                height: `${item.size}px`,
                transform: `translateY(${
                  item.start - virtualizer.options.scrollMargin
                }px)`,
              }}
            >
              <div className={"basis-6/12 overflow-auto fg"}>
              <RenderParts value={key} filter={filter} />
              </div>
              <div className={"basis-6/12 overflow-auto"}>
              <RenderParts value={value} filter={filter} />
              </div>
            </div>
          );
        })}
      </div>}
    </div>);
}

export function RenderParts({ value, filter }: { value: string, filter: string }) {
  const filterCleared = filter.replace(/\B[-^]/g, '');
  const matches = match(value, filterCleared, { insideWords: true });
  const parts = parse(value, matches);
  return <>{parts.map((part, index) => (
    <span
      key={index}
      className={part.highlight ? 'underline font-bold' : ''}
    >
      {part.text}
    </span>
  ))}</>;
}
