import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { NotificationDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/notification.model';
import { toLocalNotification } from './notification.mapper';
import { FriendshipService } from './friendship.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly friendshipService = inject(FriendshipService);
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

  /** Optimistically marks the notification's friendship as accepted/declined right away so the
   * Accept/Decline buttons disappear immediately; on failure it's left as-is (a reload would
   * show the true state again). */
  async acceptFriendRequest(notificationId: string, requestId: string): Promise<void> {
    const result = await this.friendshipService.accept(requestId);
    if (!result) return;
    this.applyFriendshipStatus(notificationId, 'accepted');
  }

  async declineFriendRequest(notificationId: string, requestId: string): Promise<void> {
    const ok = await this.friendshipService.decline(requestId);
    if (!ok) return;
    this.notifications.update((list) => list.filter((n) => n.id !== notificationId));
  }

  private applyFriendshipStatus(notificationId: string, status: 'pending' | 'accepted'): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === notificationId ? { ...n, friendshipStatus: status } : n)),
    );
  }
}
