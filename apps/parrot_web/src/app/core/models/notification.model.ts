import type { NotificationType } from '@parrot-social/shared-dto';

export interface AppNotification {
  id: string;
  type: NotificationType;
  icon: string;
  text: string;
  timeAgo: string;
  read: boolean;
  actorId?: string;
  targetId?: string;
  /** Only set for type 'friend-request' - the live friendship row id/status, used to render and
   * drive Accept/Decline directly from the notification list. */
  friendshipRequestId?: string;
  friendshipStatus?: 'pending' | 'accepted';
}
