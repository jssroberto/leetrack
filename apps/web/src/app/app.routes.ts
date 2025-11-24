import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth/auth').then((m) => m.Auth),
    canActivate: [publicGuard],
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
    loadComponent: () => import('./main/main').then((m) => m.Main),
    canActivate: [authGuard],
    children: [
      // Si ya tiene grupo te redirige a dashboard, a ver como se mete la condición aquí
      {
        path: 'index',
        loadComponent: () => import('./main/index').then((m) => m.Index)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./main/operations/dashboard/dashboard').then((m) => m.Dashboard)
      },
      {
        path: 'polling',
        loadComponent: () => import('./main/operations/polling/polling').then((m) => m.Polling)
      },
      {
        path: 'log',
        loadComponent: () => import('./main/operations/log/log').then((m) => m.Log)
      },
      {
        path: '**',
        redirectTo: 'index',
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];