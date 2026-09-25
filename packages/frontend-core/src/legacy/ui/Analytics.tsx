import { useEffect } from 'react'
import { useLegacyCustomization } from '../adapter/legacyApi'

const SCRIPT_ID = 'analytics-script'

function InsertJs({ js }: { js: string }) {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID) === null) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.async = true
      script.innerHTML = js
      document.body.appendChild(script)
    }
  }, [js])
  return null
}

/**
 * Injects the downstream app's analytics snippet, once per document.
 *
 * The snippet is not an API response any more — it comes off the customization
 * seam the consuming app fills in (see `adapter/legacyApi`). Open source ships
 * none, which is why nothing is injected in this package's own dev server.
 *
 * `{{APP_VERSION}}` is substituted so the snippet can tag events with the build.
 * KNOWN GAP: `VITE_APP_VERSION` is not defined by any build in this repo, so the
 * placeholder currently resolves to an empty string. Same missing define as the
 * header's version chip and the error page's skew check.
 *
 * INTENTIONAL DIFF: an empty snippet injects nothing. The original appended an
 * empty `<script>` element on every load of a deployment that had not configured
 * analytics.
 */
export function Analytics() {
  const { analyticsScript } = useLegacyCustomization()

  if (!analyticsScript) {
    return null
  }

  return (
    <InsertJs
      js={analyticsScript.replace(
        '{{APP_VERSION}}',
        import.meta.env.VITE_APP_VERSION ?? '',
      )}
    />
  )
}
