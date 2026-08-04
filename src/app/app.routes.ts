import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Shell } from './layout/shell';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register').then((m) => m.Register),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'accounts', pathMatch: 'full' },
      {
        path: 'accounts',
        loadComponent: () => import('./features/accounts/accounts').then((m) => m.Accounts),
      },
      {
        path: 'posting',
        loadComponent: () => import('./features/posting/posting').then((m) => m.Posting),
      },
      {
        path: 'pricing',
        loadComponent: () => import('./features/pricing/pricing').then((m) => m.Pricing),
      },
      {
        path: 'diagnostics',
        loadComponent: () =>
          import('./features/diagnostics/diagnostics').then((m) => m.Diagnostics),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
