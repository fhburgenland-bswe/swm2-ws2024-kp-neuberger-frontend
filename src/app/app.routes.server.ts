import { RenderMode, ServerRoute } from '@angular/ssr';
import { getPrerenderParamsForUserId } from './prerender-params';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'users/:userId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: getPrerenderParamsForUserId
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
