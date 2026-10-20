import { Injectable, computed, signal } from '@angular/core';
import { AppNotification } from '../models/notification.model';
import { NOTIFICATIONS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly notifications = signal<AppNotification[]>(NOTIFICATIONS.map((n) => ({ ...n })));
  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }
}
