import { useMemo, useRef } from 'react'
import cn from 'classnames'
import K8SLogoIcon from './k8s-logo.svg?react'
import SettingsIcon from './settings.svg?react'
import { ReadonlyCopyField } from '../../ReadonlyCopyField'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import {
  LOCAL_STORAGE_KEY_UI_K8S_CLIENT_STYLE,
  LOCAL_STORAGE_KEY_UI_K8S_TABS_POSITIONS,
} from '../../../lib/local-storage-constants'
import { useMainAppFormContext } from '../../../context/MainFormContextProvider'
import { interpolateWidgetStr } from '../../../lib/utils'
import { WidgetLeftBorder } from '../WidgetLeftBorder'
import type { K8SClientStyle } from './SettingsModal'
import { SettingsModal } from './SettingsModal'

/**
 * Ready-to-paste kubernetes commands for the selected environment.
 *
 * This one is driven by the environment, not by the app, so it is shown whenever
 * an environment is selected. The context and namespace come from the
 * environment's own parameters (`env.meta.k8sCtx`, `env.meta.k8sNs`); an
 * environment that declares no namespace falls back to `--all-namespaces`.
 */
export function K8sCliWidget() {
  const { app, env } = useMainAppFormContext()

  const [tabNo, setTabNo] = useLocalStorage<number>(
    LOCAL_STORAGE_KEY_UI_K8S_TABS_POSITIONS,
    () => 0,
  )

  const [k8sClientStyleRaw, setK8sClientStyle] = useLocalStorage<
    K8SClientStyle | undefined
  >(LOCAL_STORAGE_KEY_UI_K8S_CLIENT_STYLE, () => undefined)
  const k8sClientStyle = k8sClientStyleRaw ?? 'kubectl'

  const tabs = useMemo(() => {
    const ctx = interpolateWidgetStr('{{env.meta.k8sCtx}}', env, app)
    const ns = interpolateWidgetStr(
      '{{env.meta.k8sNs ?? --all-namespaces}}',
      env,
      app,
    )
    const kubectlNs =
      ns === '--all-namespaces' ? '--all-namespaces' : `-n ${ns}`
    const k9sNs = ns === '--all-namespaces' ? '' : `-n ${ns}`
    const definitions = [
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
    ]
    return definitions.map((v) => ({
      ...v,
      cmd: typeof v.cmd === 'string' ? v.cmd : v.cmd[k8sClientStyle] || '-',
    }))
  }, [env, app, k8sClientStyle])

  const settingsDialog = useRef<HTMLDialogElement>(null)
  const openSettingsDialog = () => settingsDialog.current?.showModal()

  const tabContent = tabs[tabNo]
  const previewTab = tabs[0]

  if (!tabContent || !previewTab) {
    return null
  }

  return (
    <div
      className={cn('flex tooltip tooltip-left items-stretch relative')}
      data-tip={[env?.id, tabContent.help].filter(Boolean).join(': ')}
    >
      <WidgetLeftBorder className={'group h-10'}>
        <button
          type="button"
          aria-label="Kubernetes client settings"
          className="w-4 h-4 hover:cursor-pointer"
          onClick={openSettingsDialog}
        >
          <K8SLogoIcon />
        </button>

        <button
          type="button"
          aria-label="Kubernetes client settings"
          className="w-4 h-4 hover:cursor-pointer opacity-0 group-hover:opacity-100"
          onClick={openSettingsDialog}
        >
          <SettingsIcon className={'fill-neutral-400 hover:fill-accent'} />
        </button>
      </WidgetLeftBorder>
      <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2 w-full">
        <ul role="tablist" className="tabs tabs-lifted tabs-xs p-1 ">
          {tabs.map(({ label }, i) => (
            <li
              key={label}
              role="tab"
              aria-selected={tabNo === i}
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
        ref={settingsDialog}
        k8sStyle={k8sClientStyle}
        onChangeK8sStyle={setK8sClientStyle}
        preview={previewTab.cmd}
      />
    </div>
  )
}
