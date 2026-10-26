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
        {cr.title ?? `!${cr.id}`}
      </a>
    </span>
  )
}
