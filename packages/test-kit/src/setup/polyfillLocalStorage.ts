/**
 * Replace `localStorage` when the one in scope is incomplete.
 *
 * Recent node ships its own `localStorage` global, which wins over jsdom's and
 * is a stub unless the process was started with a valid `--localstorage-file`.
 * The app calls `removeItem` while clearing a session, so a stub means every
 * scenario dies in an unhandled rejection far from the actual cause.
 */
if (
  typeof globalThis.localStorage === 'undefined' ||
  typeof globalThis.localStorage.clear !== 'function' ||
  typeof globalThis.localStorage.removeItem !== 'function'
) {
  const store = new Map<string, string>()
  const storage: Storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    get length() {
      return store.size
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    writable: true,
    configurable: true,
  })
}
