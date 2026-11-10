---
'@env-hopper/mcp': patch
'@env-hopper/frontend-core': patch
---

MCP server instructions now say only when to use the server; how to call each tool and read its result moved into the tool descriptions. `createMcpHandler` takes `when` (env and object names for the instructions) and per-tool `examples` and `notes` maps, and an `onToolCall` hook that receives one event per tool call: the arguments sent, the slugs they resolved to, and an outcome summary with counts only, never credential content.
