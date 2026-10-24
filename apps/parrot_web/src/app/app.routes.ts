import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'feed' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/onboarding/onboarding').then((m) => m.Onboarding),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: 'feed', loadComponent: () => import('./pages/feed/feed').then((m) => m.Feed) },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'events',
        loadComponent: () => import('./pages/events/events').then((m) => m.Events),
      },
      {
        path: 'events/:id',
        loadComponent: () => import('./pages/event-page/event-page').then((m) => m.EventPage),
      },
      {
        path: 'search',
        loadComponent: () => import('./pages/search/search').then((m) => m.Search),
      },
      {
        path: 'groups',
        loadComponent: () => import('./pages/groups-list/groups-list').then((m) => m.GroupsList),
      },
      {
        path: 'groups/:id',
        loadComponent: () => import('./pages/groups/group-page').then((m) => m.GroupPage),
      },
      { path: 'chat', loadComponent: () => import('./pages/chat/chat').then((m) => m.Chat) },
      // Legacy alias kept for old bookmarks/links; "Messages" nav entry was a duplicate of "Chat" and was removed.
      { path: 'messages', redirectTo: 'chat' },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications').then((m) => m.Notifications),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
      },
    ],
  },
  { path: '**', redirectTo: 'feed' },
];
