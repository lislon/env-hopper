export type EhMode = 'hopper' | 'catalog'

declare global {
  interface ImportMetaEnv {
    readonly VITE_EH_MODE?: EhMode
  }
}

export {}
