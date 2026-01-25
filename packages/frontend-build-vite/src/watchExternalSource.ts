import type { Plugin, ViteDevServer } from 'vite'

export interface WatchExternalSourceOptions {
  /**
   * Name to display in console logs (e.g., '@env-hopper/frontend-core')
   */
  name: string
  /**
   * Absolute path to the source directory to watch
   */
  srcPath: string
  /**
   * Polling interval in ms (default: 500)
   * Polling is required for cross-monorepo watching
   */
  interval?: number
}

/**
 * Creates a Vite plugin that watches an external source directory for changes
 * and triggers HMR updates or full reloads.
 *
 * This is useful when developing with linked packages from another monorepo
 * where Vite's default file watcher doesn't detect changes.
 *
 * @example
 * ```ts
 * // In vite.config.ts
 * import { watchExternalSource } from '@env-hopper/frontend-build-vite'
 * import path from 'node:path'
 *
 * export default defineConfig({
 *   plugins: [
 *     watchExternalSource({
 *       name: '@env-hopper/frontend-core',
 *       srcPath: path.resolve(__dirname, '../../../env-hopper/packages/frontend-core/src'),
 *     }),
 *   ],
 * })
 * ```
 */
export function watchExternalSource(
  options: WatchExternalSourceOptions,
): Plugin {
  const { name, srcPath, interval = 500 } = options
  let watcher: import('chokidar').FSWatcher | null = null // eslint-disable-line @typescript-eslint/consistent-type-imports

  return {
    name: `watch-external-source:${name}`,
    configureServer(server: ViteDevServer) {
       
      import('chokidar').then(({ watch }) => {
        watcher = watch(srcPath, {
          ignoreInitial: true,
          usePolling: true, // Required for cross-monorepo watching
          interval,
        })

        watcher.on('ready', () => {
          console.log(`[HMR] Watching ${name} for changes`)
        })

        watcher.on('change', async (file: string) => {
          const shortPath = file.replace(srcPath, `${name}/src`)
          console.log(`[HMR] ${shortPath} changed`)

          // Try multiple ways to find the module in Vite's graph
          let modules = server.moduleGraph.getModulesByFile(file)

          // If not found, try searching by URL patterns
          if (!modules || modules.size === 0) {
            const allModules = [...server.moduleGraph.idToModuleMap.values()]
            const fileName = file.split('/').pop() || ''
            const matchingModules = allModules.filter((mod) => {
              if (!mod.file) return false
              return (
                mod.file === file ||
                mod.file.endsWith(fileName) ||
                mod.url.includes(fileName)
              )
            })
            if (matchingModules.length > 0) {
              modules = new Set(matchingModules)
            }
          }

          if (modules && modules.size > 0) {
            // Module is tracked - try true HMR
            const updates: Array<{
              type: 'js-update' | 'css-update'
              path: string
              acceptedPath: string
              timestamp: number
            }> = []

            for (const mod of modules) {
              server.moduleGraph.invalidateModule(mod)
              const isCss = mod.file?.endsWith('.css')

              updates.push({
                type: isCss ? 'css-update' : 'js-update',
                path: mod.url,
                acceptedPath: mod.url,
                timestamp: Date.now(),
              })

              console.log(`[HMR] Sending update for: ${mod.url}`)
            }

            if (updates.length > 0) {
              server.ws.send({
                type: 'update',
                updates,
              })
              console.log(`[HMR] Sent ${updates.length} HMR update(s)`)
              return
            }
          }

          // Module not in graph - fall back to full reload
          console.log(`[HMR] Module not tracked, triggering full reload`)
          server.moduleGraph.invalidateAll()
          server.ws.send({
            type: 'full-reload',
            path: '*',
          })
        })

        watcher.on('error', (error: unknown) => {
          console.error(`[HMR] Watcher error for ${name}:`, error)
        })
      })
    },
    closeBundle() {
      if (watcher) {
        watcher.close()
      }
    },
  }
}

/**
 * Creates resolve aliases for pointing to source files instead of dist.
 * Use this with watchExternalSource for full HMR support.
 *
 * @example
 * ```ts
 * // In vite.config.ts
 * import { createSourceAliases } from '@env-hopper/frontend-build-vite'
 * import path from 'node:path'
 *
 * const frontendCoreSrc = path.resolve(__dirname, '../../../env-hopper/packages/frontend-core/src')
 *
 * export default defineConfig({
 *   resolve: {
 *     alias: createSourceAliases({
 *       '@env-hopper/frontend-core': `${frontendCoreSrc}/index.tsx`,
 *       '~': frontendCoreSrc, // Internal path alias used by frontend-core
 *     }),
 *   },
 * })
 * ```
 */
export function createSourceAliases(
  aliases: Record<string, string>,
): Record<string, string> {
  return aliases
}

/**
 * Creates fs.allow paths for serving files from external directories.
 *
 * @param paths - Array of absolute paths to allow
 */
export function createFsAllowPaths(paths: Array<string>): Array<string> {
  return paths
}
