import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './guards/auth.guard';
// Importa tus nuevos guards
import { requireGroupGuard, alreadyHasGroupGuard } from './guards/group.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth/auth').then((m) => m.Auth),
    canActivate: [publicGuard],
    children: [
      { path: 'login', loadComponent: () => import('./auth/login/login').then((m) => m.Login) },
      { path: 'register', loadComponent: () => import('./auth/register/register').then((m) => m.Register) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'main',
    loadComponent: () => import('./main/main').then((m) => m.Main),
    canActivate: [authGuard],
    children: [
      {
        path: 'index',
        loadComponent: () => import('./main/index').then((m) => m.Index),
        canActivate: [alreadyHasGroupGuard]
      },
      {
        path: 'group',
        loadComponent: () => import('./main/operations/group/group').then((m) => m.Group),
      },
      {
        path: 'leaderboard',
        loadComponent: () => import('./main/operations/leaderboard/leaderboard').then((m) => m.Leaderboard),
        canActivate: [requireGroupGuard]
      },
      {
        path: 'group-content',
        loadComponent: () => import('./main/operations/group-content/group-content').then((m) => m.GroupContent),
        canActivate: [requireGroupGuard],
      },
      {
        path: 'settings',
        loadComponent: () => import('./main/operations/settings/settings').then((m) => m.Settings),
        canActivate: [requireGroupGuard],
      },
      {
        path: 'polling',
        loadComponent: () => import('./main/operations/polling/polling').then((m) => m.Polling),
        canActivate: [requireGroupGuard]
      },
      {
        path: 'log',
        loadComponent: () => import('./main/operations/log/log').then((m) => m.Log),
        canActivate: [requireGroupGuard]
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