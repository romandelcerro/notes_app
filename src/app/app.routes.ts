import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { hasDataGuard } from './core/guards/has-data.guard';
import { noDataGuard } from './core/guards/no-data.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./domains/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [noDataGuard],
        loadComponent: () =>
          import('./domains/empty-state/empty-state.component').then((m) => m.EmptyStateComponent),
      },
      {
        path: 'list',
        canActivate: [hasDataGuard],
        loadComponent: () =>
          import('./domains/notes/note-list/note-list.component').then((m) => m.NoteListComponent),
      },
      {
        path: 'list/:section',
        canActivate: [hasDataGuard],
        loadComponent: () =>
          import('./domains/notes/note-list/note-list.component').then((m) => m.NoteListComponent),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./domains/auth/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  { path: '**', redirectTo: '' },
];


