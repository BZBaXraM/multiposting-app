import { RenderMode, ServerRoute } from '@angular/ssr';

// This app is an interactive API test console — every route depends on client-side
// auth state and user-triggered requests, so nothing is prerendered or SSR-fetched.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
