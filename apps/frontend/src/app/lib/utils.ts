
// export function isAppHasVars(app: EhApp, urlVars: EhUrlVar[]) {


import { EhApp, EhSubstitution } from '@env-hopper/types';

export function findSubstitutionInApp(app: EhApp | null, appContexts: EhSubstitution[]): EhSubstitution | null {
    if (app) {

        const urlPattern = app.url.replace("{env}", "");

        const match = urlPattern.match(/{(.+)}/);
        if (match) {
            return appContexts.find(v => v.name === match[1]) || null;
        }
    }
    return null;
}
