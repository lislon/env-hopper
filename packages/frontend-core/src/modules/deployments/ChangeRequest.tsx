import { useQuery } from '@tanstack/react-query'
import type { ChangeRequestRef } from '@env-hopper/backend-core'
import { changeRequestDetailsQuery } from '~/modules/pairDetails/pairDetails'

/**
 * A build's change request: `!id` linking to it (after "merged via" when the
 * build is of the branch it merged into), its Work Items, its title, and,
 * once `open`, its description.
 */
export function ChangeRequestCell({
  appSlug,
  componentSlug,
  changeRequest: cr,
  open,
}: {
  appSlug: string
  componentSlug: string
  changeRequest: ChangeRequestRef
  /** Its dialog is open: the description is asked for then, not before. */
  open: boolean
}) {
  const details = useQuery({
    ...changeRequestDetailsQuery(appSlug, componentSlug, cr.id),
    enabled: open,
  })
  return (
    <div className="eh-deployed-cr">
      {!cr.direct && <span className="eh-deployed-muted">merged via </span>}
      <a
        className="eh-deployed-mono"
        href={cr.url}
        target="_blank"
        rel="noreferrer"
      >
        !{cr.id}
      </a>
      {cr.workItems?.map((w) => (
        <span key={w} className="eh-deployed-mono eh-deployed-muted">
          {' '}
          {w}
        </span>
      ))}
      {cr.title && <div className="eh-deployed-cr-title"> {cr.title}</div>}
      {open &&
        (details.isPending ? (
          <div className="eh-deployed-cr-loading" role="status">
            loading description…
          </div>
        ) : details.isError ? (
          <div className="eh-deployed-muted"> description unavailable</div>
        ) : (
          details.data.description && (
            <div className="eh-deployed-cr-desc">
              {' '}
              {details.data.description}
            </div>
          )
        ))}
    </div>
  )
}
