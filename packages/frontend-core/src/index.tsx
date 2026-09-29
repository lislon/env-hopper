export { appPropsFactory } from './appPropsFactory.js'
export { App } from './App'
export type { AppProps } from './App'

// The skin seam. `legacy` is the default; a downstream app can flip a device to
// `modern` and fills the footer through the customization provider, which wraps
// `<App/>` from outside.
export { getUiSkin, setUiSkin } from './ui/skin/EhShell'
export type { EhSkin } from './ui/skin/EhShell'
export { LegacyCustomizationProvider } from './legacy/adapter/legacyApi'
export type { LegacyCustomization } from './legacy/adapter/legacyApi'

export { useUiSettings } from './modules/uiSettings/UiSettingsContext'
export { useEhTemplate } from './modules/uiSettings/useEhTemplate'
export type {
  EhAboutPage,
  EhAppLink,
  EhLinkContext,
  EhUiSettings,
} from './types/uiSettings'
