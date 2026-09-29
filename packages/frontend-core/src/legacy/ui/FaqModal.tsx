import { Link } from '@tanstack/react-router'
import { useLegacyConfig, useLegacyCustomization } from '../adapter/legacyApi'
import { formatAppTitle, getJumpUrlEvenNotComplete } from '../lib/utils'
import { BaseModal } from './Dialog/BaseModal'
import type { BaseDialogProps } from './Dialog/BaseModal'
import type { EhApp, EhEnv } from '../types'
import { getEhToOptions } from '~/util/route-utils'

export interface SlideShared {
  sampleEnv: EhEnv | undefined
  sampleApp: EhApp | undefined
  url: string | undefined
  appWithFeatures: EhApp | undefined
}

function Slide1() {
  return (
    <>
      <h3>What is for?</h3>
      <article>
        <p>
          This is browser bookmark tool for test/staging environments. It allows
          to quickly find an URL for a specific application on a specific
          environment.
        </p>
        <p>
          This saves time, because you don't need to typing and remembering long
          URLs
        </p>
        <p className="text-end">
          Press{' '}
          <a href={hrefToSlide(2)} className="btn btn-circle btn-xs">
            ❯
          </a>{' '}
          to learn how to use it
        </p>
      </article>
    </>
  )
}

function Slide2(props: SlideShared) {
  if (!props.sampleEnv || !props.sampleApp || !props.url) {
    return null
  }
  return (
    <>
      <h3>How to Use?</h3>
      <article>
        <ol>
          <li>
            Choose <strong>Environment</strong> in autocomplete box, i.e.{' '}
            <code>{props.sampleEnv.id}</code>
          </li>
          <li>
            Choose <strong>Application</strong>, i.e.{' '}
            <code>{formatAppTitle(props.sampleApp)}</code>
          </li>
          <li>
            The link will be generated to {formatAppTitle(props.sampleApp)} on{' '}
            {props.sampleEnv.id} environment:{' '}
            {/* INTENTIONAL DIFF: a plain anchor. This is a fully resolved,
                off-site jump url; the original handed it to the router's `Link`,
                which exists to build in-app locations and does not type-check
                against an absolute url. */}
            <a
              href={props.url}
              className={'text-xs tooltip'}
              data-tip={
                'Note: Example link can be not functional if this app is not exists on given env'
              }
            >
              {props.url}
            </a>
          </li>
          <li>
            Hit{' '}
            <strong
              className={
                'bg-primary text-primary-content rounded-xl p-1 tooltip tooltip-right'
              }
              data-tip="This is not real jump button, but just an example of how it looks like in real app ;)"
            >
              Jump
            </strong>{' '}
            to follow generated URL
          </li>
        </ol>
        <p className="text-end">
          Press{' '}
          <a href={hrefToSlide(3)} className="btn btn-circle btn-xs">
            ❯
          </a>{' '}
          to see features
        </p>
      </article>
    </>
  )
}

/**
 * INTENTIONAL DIFF: the original had a fourth bullet about sharable urls, built
 * from a `sharableUrl` that was hardcoded `undefined` behind a `TODO: Fix me` —
 * so the bullet has never rendered for a user. Restoring it means turning the
 * router's location object into an absolute href; that is a feature to add, not a
 * port to keep, so it is left out rather than ported dead.
 */
function Slide3({ appWithFeatures, sampleEnv }: SlideShared) {
  return (
    <>
      <h3>What else can it do?</h3>
      <article>
        <ul>
          <li>
            <span role={'img'} aria-hidden>
              🔍
            </span>{' '}
            The autocomplete is fuzzy: to find <code>my-environment-01</code>,
            you can just type <code>my1</code>.
          </li>
          <li>
            <span role={'img'} aria-hidden>
              ⭐
            </span>{' '}
            You can favorite environment or application by pressing the star
            icon in the selection dialog.
          </li>
          {appWithFeatures && (
            <li>
              <span role={'img'} aria-hidden>
                🔐
              </span>{' '}
              Some apps, like{' '}
              <Link
                {...getEhToOptions({
                  envId: sampleEnv?.id,
                  appId: appWithFeatures.id,
                })}
              >
                {formatAppTitle(appWithFeatures)}
              </Link>
              , also show user/password for UI well as for service database.
            </li>
          )}
        </ul>
      </article>
    </>
  )
}

function SlideRawHtml({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function hrefToSlide(slideIndex: number) {
  return (
    window.location.pathname + window.location.search + `#about-${slideIndex}`
  )
}

/**
 * The credentials bullet needs an app that shows both UI and DB credentials.
 * `EhApp.widgets` is the field that says so and it arrives with the widgets work,
 * so this is read structurally: the bullet starts appearing the moment the field
 * lands, with no edit here. Until then no app matches and the bullet is hidden —
 * the same outcome as a deployment whose apps carry no widgets.
 */
function hasCredentialWidgets(app: EhApp): boolean {
  const widgets = (app as { widgets?: { ui?: unknown; db?: unknown } }).widgets
  return Boolean(widgets?.ui && widgets.db)
}

/**
 * The about dialog: a carousel of slides, navigated by `#about-N` fragment links
 * so the browser's own scroll-snap does the paging.
 *
 * The first three slides are this package's. A downstream app can append its own
 * through `slidesHtml` on the customization seam.
 *
 * INTENTIONAL DIFF: the sample env and app come from the config hook, not from
 * `EhContext`. The original could use the context because its provider sat at the
 * route root, above the layout; here the provider is per page, below this dialog's
 * mount point. Nothing is lost — the context's `listEnvs`/`listApps` ARE the
 * config's `envs`/`apps`, and this dialog reads no user state.
 */
export function FaqModal(props: BaseDialogProps) {
  const { data: config } = useLegacyConfig()
  const { slidesHtml } = useLegacyCustomization()

  const listEnvs = config?.envs ?? []
  const listApps = config?.apps ?? []
  const sampleEnv = listEnvs[0]
  const sampleApp = listApps[0]

  const url =
    sampleEnv &&
    sampleApp &&
    getJumpUrlEvenNotComplete({ app: sampleApp, env: sampleEnv })

  const slideProps: SlideShared = {
    sampleEnv,
    sampleApp,
    url,
    appWithFeatures: listApps.find(hasCredentialWidgets),
  }

  // Positional keys: the list is fixed at render and never reordered or filtered.
  const slides = [
    <Slide1 key="what-for" />,
    <Slide2 key="how-to-use" {...slideProps} />,
    <Slide3 key="what-else" {...slideProps} />,
    ...(slidesHtml?.map((html, i) => (
      <SlideRawHtml key={`custom-${i}`} html={html} />
    )) ?? []),
  ]

  return (
    <BaseModal {...props} className={'prose max-w-[800px]'}>
      <div className="carousel w-full transition">
        {slides.map((childrenSlide, slideIndex) => {
          slideIndex++
          return (
            <div
              key={slideIndex}
              id={`about-${slideIndex}`}
              className="carousel-item relative w-full"
            >
              <div className="mx-32">{childrenSlide}</div>
              <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
                {slideIndex - 1 > 0 ? (
                  <a
                    href={hrefToSlide(slideIndex - 1)}
                    className="btn btn-circle"
                  >
                    ❮
                  </a>
                ) : (
                  <div />
                )}
                {slideIndex < slides.length ? (
                  <a
                    href={hrefToSlide(slideIndex + 1)}
                    className="btn btn-circle"
                  >
                    ❯
                  </a>
                ) : (
                  <div />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </BaseModal>
  )
}
