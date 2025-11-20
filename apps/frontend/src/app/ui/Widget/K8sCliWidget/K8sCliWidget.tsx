import { ReadonlyCopyField } from '../../ReadonlyCopyField';
import React, { useMemo } from 'react';
import K8SLogoIcon from './k8s-logo.svg?react';
import SettingsIcon from './settings.svg?react';
import cn from 'classnames';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import {
  LOCAL_STORAGE_KEY_UI_K8S_CLIENT_STYLE,
  LOCAL_STORAGE_KEY_UI_K8S_TABS_POSITIONS,
} from '../../../lib/local-storage-constants';
import { useMainAppFormContext } from '../../../context/MainFormContextProvider';
import { interpolateWidgetStr } from '../../../lib/utils';
import { useModal } from '../../../hooks/useModal';
import { K8SClientStyle, SettingsModal } from './SettingsModal';
import { WidgetLeftBorder } from '../WidgetLeftBorder';

export function K8sCliWidget() {
  const { app, env } = useMainAppFormContext();

  const [tabNo, setTabNo] = useLocalStorage<number>(
    LOCAL_STORAGE_KEY_UI_K8S_TABS_POSITIONS,
    () => 0,
  );

  const [k8sClientStyleRaw, setK8sClientStyle] = useLocalStorage<
    K8SClientStyle | undefined
  >(LOCAL_STORAGE_KEY_UI_K8S_CLIENT_STYLE, () => undefined);
  const k8sClientStyle = k8sClientStyleRaw ?? 'kubectl';

  const tabs = useMemo(() => {
    const ctx = interpolateWidgetStr('{{env.meta.k8sCtx}}', env, app);
    const ns = interpolateWidgetStr(
      '{{env.meta.k8sNs ?? --all-namespaces}}',
      env,
      app,
    );
    const kubectlNs =
      ns === '--all-namespaces' ? '--all-namespaces' : `-n ${ns}`;
    const k9sNs = ns === '--all-namespaces' ? '' : `-n ${ns}`;
    const newVar = [
      {
        label: 'pods',
        cmd: {
          kubectl: `kubectl get pods -o wide --context ${ctx} ${kubectlNs}`,
          k9s: `k9s --context ${ctx} -c pods ${k9sNs} `,
        },
        help: 'kubernetes pods',
      },
      {
        label: 'deployments',
        cmd: {
          kubectl: `kubectl get deployments -o wide --context ${ctx} ${kubectlNs}`,
          k9s: `k9s --context ${ctx} -c deployments ${k9sNs}`,
        },
        help: 'kubernetes deployments',
      },
      { label: 'ns', cmd: `${ns}`, help: 'kubernetes namespace' },
    ];
    return newVar.map((v) => ({
      ...v,
      cmd: typeof v.cmd === 'string' ? v.cmd : v.cmd[k8sClientStyle] || '-',
    }));
  }, [env, app, k8sClientStyle]);

  const tabContent = tabs[tabNo];

  const [openSettingsDialog, dialogProps] = useModal();

  return tabContent ? (
    <div
      className={cn('flex tooltip tooltip-left items-stretch relative')}
      data-tip={
        `${env?.id}` + `${tabContent.help ? `: ${tabContent.help}` : ''}`
      }
    >
      <WidgetLeftBorder className={'group h-10'}>
        <div className="w-4 h-4 hover:cursor-pointer">
          <K8SLogoIcon onClick={openSettingsDialog} />
        </div>

        <div className="w-4 h-4 hover:cursor-pointer opacity-0 group-hover:opacity-100">
          <SettingsIcon
            className={'fill-neutral-400 hover:fill-accent'}
            onClick={openSettingsDialog}
          />
        </div>
      </WidgetLeftBorder>
      <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2 w-full">
        <ul role="tablist" className="tabs tabs-lifted tabs-xs p-1 ">
          {tabs.map(({ label }, i) => (
            <li
              key={i}
              role="tab"
              className={cn('tab', [{ 'tab-active': tabNo === i }])}
              onClick={() => setTabNo(i)}
            >
              {label || `# ${i + 1}`}
            </li>
          ))}
        </ul>

        <div className="grid text-sm gap-1 items-center">
          <div>
            <ReadonlyCopyField value={tabContent.cmd} />
          </div>
        </div>
      </div>
      <SettingsModal
        {...dialogProps}
        k8sStyle={k8sClientStyle}
        onChangeK8sStyle={setK8sClientStyle}
        preview={tabs[0].cmd}
      />
    </div>
  ) : null;
}
