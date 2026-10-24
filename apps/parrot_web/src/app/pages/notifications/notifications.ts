import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsService } from '../../core/services/notifications.service';
import { AppNotification } from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications {
  private readonly router = inject(Router);

  constructor(readonly notifications: NotificationsService) {
    void this.notifications.load();
  }

  /** Where clicking the notification body (outside the friend-request buttons) navigates to:
   * events/groups go to their own detail page, everything else (post-like/upvote/comment, and
   * friend-request itself) falls back to the actor's profile since there's no post detail
   * route. */
  open(notification: AppNotification): void {
    if (notification.type === 'event-interest' || notification.type === 'event-reminder') {
      if (notification.targetId) {
        void this.router.navigate(['/events', notification.targetId]);
        return;
      }
    }
    if (notification.type === 'group-invite' && notification.targetId) {
      void this.router.navigate(['/groups', notification.targetId]);
      return;
    }
    if (notification.actorId) {
      void this.router.navigate(['/profile', notification.actorId]);
    }
  }

  accept(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    if (!notification.friendshipRequestId) return;
    void this.notifications.acceptFriendRequest(notification.id, notification.friendshipRequestId);
  }

  decline(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    if (!notification.friendshipRequestId) return;
    void this.notifications.declineFriendRequest(notification.id, notification.friendshipRequestId);
  }
}
