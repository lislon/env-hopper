import { EhAppBackend, EhAppPageBackend } from './backend-types';
import { EhPageId } from '@env-hopper/types';

export function formatAppTitle(app: EhAppBackend, page: EhAppPageBackend, pageId: EhPageId) {
  const title = []
  if (app.abbr !== '') {
    title.push(app.abbr);
  }
  if (app.title) {
    title.push(app.title);
  }
  if (pageId !== '') {
    title.push(app.pages.find((p) => p.id === pageId)?.title);
  }
  return title.join(' :: ');
}
