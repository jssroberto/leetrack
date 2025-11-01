import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth/auth').then((m) => m.Auth),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./auth/register/register').then((m) => m.Register),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'main',
    loadComponent: () => import('./main/main').then((m) => m.Main)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
