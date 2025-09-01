import { EhApp } from '@env-hopper/types';

export function formatAppTitleShort(app: EhApp | undefined) {
  if (app === undefined) {
    return '';
  }
  const components = [
    app.abbr ? app.abbr : app.appTitle,
    app.pageTitle === 'Home' ? null : app.pageTitle,
  ].filter(Boolean);
  if (components.length === 0) {
    return app.id;
  }
  return components.join(' :: ');
}
