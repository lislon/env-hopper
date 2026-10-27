---
'@env-hopper/frontend-core': minor
---

- The deployed-version slot under the jump card is always one line high and
  never empty: a pale placeholder while loading, "⚠ version unavailable" with
  the failed call, its message and the retry count on hover or focus, and
  "no version info" for an App with no catalog Components. It shows as soon
  as an App and an Environment are picked, before the URL is complete.
- A `pair` load whose facet has not arrived within 10 s fails; a failed pair
  facet is retried every 30 s and on window focus. A loaded one is not
  refetched on focus.
- The line shows the Version with its aliases and how long ago it was
  deployed; the details show the build pipeline and deploy job by id, and
  "n/a" where a value is unknown.
- The jump card sits right under the Application field however tall the side
  panel is.
