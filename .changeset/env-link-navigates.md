---
'@env-hopper/frontend-core': patch
'@env-hopper/test-kit': patch
---

A link inside the app to another environment or application (an environment in a release train's card, the FAQ's example, Back and Forward) now moves the form there. The form used to push its own selection back into the URL whenever the two differed, which undid every such link.
