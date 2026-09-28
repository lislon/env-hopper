import cn from 'classnames'
import type { ReactNode } from 'react'
import type { EhIconSvg, EhVersionRow } from '@env-hopper/backend-core'
import { BaseModal } from './BaseModal'
import type { ModalController } from '../../hooks/useModal'

export interface VersionDialogProps extends ModalController {
  /** The installed core version, or undefined when nothing reported one. */
  version: string | undefined
  releaseHref: string
  /** Deployment-supplied rows: which pipeline and commit built it, who to ask. */
  rows?: Array<EhVersionRow>
  icons?: Array<EhIconSvg>
  credit?: string
  builtAt?: string
}

/** The npm and GitHub marks, for the two rows the core contributes itself. */
const NPM_PATH =
  'M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z'
const GITHUB_PATH =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'

const PROJECT_URL = 'https://github.com/lislon/env-hopper'

function BrandIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="w-4 h-4 mt-0.5 fill-current text-gray-400"
    >
      <path d={path} />
    </svg>
  )
}

function Row({
  icon,
  row,
}: {
  icon?: ReactNode
  row: Omit<EhVersionRow, 'iconId'>
}) {
  return (
    <>
      {icon ?? <span className="w-4 h-4" />}
      <div>
        <div className="text-sm">
          {row.label ? `${row.label} ` : null}
          {row.href ? (
            <a
              className={cn('link', row.mono && 'font-mono text-xs')}
              href={row.href}
              target="_blank"
              rel="noreferrer"
            >
              {row.value}
            </a>
          ) : (
            <span className={cn(row.mono && 'font-mono text-xs')}>
              {row.value}
            </span>
          )}
        </div>
        {row.description && (
          <div className="text-xs text-gray-500">{row.description}</div>
        )}
      </div>
    </>
  )
}

/**
 * What the header's version label opens. The core contributes the two rows that
 * are true of every deployment — the package it runs on and the project it comes
 * from — and the deployment adds its own (pipeline, commit, where to ask), so a
 * company build never has to know the dialog's markup.
 *
 * INTENTIONAL DIFF: the previous seam was a `versionHtml` blob rendered through
 * `dangerouslySetInnerHTML`, which made the backend own this layout and put
 * server-built markup on the page. Rows are data; the markup lives here.
 */
export function VersionDialog({
  version,
  releaseHref,
  rows,
  icons,
  credit,
  builtAt,
  ...modal
}: VersionDialogProps) {
  const iconFor = (iconId?: string) => {
    const svg = icons?.find((icon) => icon.iconId === iconId)?.svg
    return svg ? (
      <div
        className="w-4 h-4 mt-0.5 text-gray-400"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    ) : undefined
  }

  return (
    <BaseModal {...modal}>
      <h3 className="font-bold text-lg">Env hopper</h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">
        Open any app in any environment: pick the two, and Env hopper builds the
        URL and hands you the credentials for it.
      </p>
      <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">
        This build
      </div>
      <div className="grid grid-cols-[1rem_1fr] gap-x-2.5 gap-y-3 items-start">
        <Row
          icon={<BrandIcon path={NPM_PATH} />}
          row={{
            label: 'Core',
            value: version ? `v${version}` : 'unknown',
            href: releaseHref,
            description: 'Open-source package this build runs on',
            mono: true,
          }}
        />
        {rows?.map((row, index) => (
          <Row key={index} icon={iconFor(row.iconId)} row={row} />
        ))}
        <Row
          icon={<BrandIcon path={GITHUB_PATH} />}
          row={{
            value: 'lislon/env-hopper',
            href: PROJECT_URL,
            description: 'Project home: source, issues, releases',
          }}
        />
      </div>
      {(credit || builtAt) && (
        // `eh-version-divider` is a plain rule in index.css, not a utility: a
        // class introduced in published source is never compiled downstream.
        <div className="mt-4 pt-3 eh-version-divider flex justify-between text-xs text-gray-500">
          <span>{credit}</span>
          <span>{formatBuiltAt(builtAt)}</span>
        </div>
      )}
    </BaseModal>
  )
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * A build stamp is only ever read as "how old is this" — the day answers that,
 * and an ISO string with a clock and a zone in it does not.
 *
 * Spelled out rather than `toLocaleDateString`, whose month abbreviations move
 * with the runtime's ICU data (`en-GB` says "Sept" on current Node) and would
 * make the rendered string depend on where the bundle happens to run.
 */
export function formatBuiltAt(builtAt: string | undefined): string {
  if (!builtAt) {
    return ''
  }
  const date = new Date(builtAt)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return `Built ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}
