---
'@env-hopper/frontend-build-vite': patch
---

The service worker no longer answers navigations under `/api/` with the cached app shell, so an API URL opened in the browser (such as the MCP endpoint) reaches the server.
