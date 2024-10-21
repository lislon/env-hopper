/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_ABOUT_ENABLED: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
