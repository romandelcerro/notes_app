import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { hasDataGuard, noDataGuard } from './core/guards/data.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/components/shell/shell').then(m => m.Shell),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [noDataGuard],
        loadComponent: () => import('./core/components/home/home').then(m => m.Home)
      },
      {
        path: 'list',
        canActivate: [hasDataGuard],
        loadComponent: () => import('./domains/notes/note-list/note-list').then(m => m.NoteListComponent)
      },
      {
        path: 'list/:section',
        canActivate: [hasDataGuard],
        loadComponent: () => import('./domains/notes/note-list/note-list').then(m => m.NoteListComponent)
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./core/components/login-card/login-card').then(m => m.LoginCard),
    canActivate: [guestGuard]
  },
  { path: '**', redirectTo: '' }
];
