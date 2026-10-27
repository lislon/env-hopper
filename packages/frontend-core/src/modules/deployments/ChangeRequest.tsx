import type { ChangeRequestRef } from '@env-hopper/backend-core'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'

/**
 * A change request as one line: its Work Items, each linked to its page when
 * the deployment says where Work Items live, then its title, linked to the
 * change request. Without a title, its number stands in.
 */
export function ChangeRequestCell({
  changeRequest: cr,
}: {
  changeRequest: ChangeRequestRef
}) {
  const workItemUrl = useBootstrapConfig().ui?.workItemUrl
  // A title that starts with its Work Items (`SHOP-1 Fix x`) says them once.
  let title = cr.title
  for (const w of cr.workItems ?? []) {
    if (title?.startsWith(w))
      title = title.slice(w.length).replace(/^[\s:\-–]+/, '')
  }
  return (
    <span className="eh-deployed-cr">
      {!cr.direct && <span className="eh-deployed-muted">merged via </span>}
      {cr.workItems?.map((w) => (
        <span key={w}>
          {workItemUrl ? (
            <a
              className="eh-deployed-mono"
              href={workItemUrl.replace('{{key}}', w)}
              target="_blank"
              rel="noreferrer"
            >
              {w}
            </a>
          ) : (
            <span className="eh-deployed-mono">{w}</span>
          )}{' '}
        </span>
      ))}
      <a href={cr.url} target="_blank" rel="noreferrer">
        {title || `!${cr.id}`}
      </a>
    </span>
  )
}
