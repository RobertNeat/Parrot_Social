import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { NotificationDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/notification.model';
import { toLocalNotification } from './notification.mapper';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  async load(): Promise<void> {
    const dtos = await firstValueFrom(this.http.get<NotificationDto[]>(this.baseUrl));
    this.notifications.set(dtos.map(toLocalNotification));
  }

  async markAllRead(): Promise<void> {
    try {
      const dtos = await firstValueFrom(
        this.http.post<NotificationDto[]>(`${this.baseUrl}/mark-all-read`, {}),
      );
      this.notifications.set(dtos.map(toLocalNotification));
    } catch {
      // Network error - no optimistic mutation was made, so no rollback needed.
    }
  }
}
