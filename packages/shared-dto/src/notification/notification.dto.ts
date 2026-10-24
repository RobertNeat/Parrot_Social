import { MediaRefDto } from '../media/media.dto.js';

export type NotificationType =
  | 'post-like'
  | 'post-upvote'
  | 'post-comment'
  | 'event-interest'
  | 'event-reminder'
  | 'group-invite'
  | 'friend-request';

export class NotificationDto {
  id!: string;
  type!: NotificationType;
  /** Absent for system-generated notifications with no human actor (e.g. event-reminder). */
  actorId?: string;
  actorName?: string;
  actorAvatar?: MediaRefDto;
  /** Id of the post/event/group/user this notification refers to, when applicable. */
  targetId?: string;
  /** Only set for type 'friend-request': the live friendship row id and its current status, so
   * the client can render Accept/Decline (status 'pending') or a settled state after a reload
   * without relying on targetId (the seed data doesn't populate it for this type). */
  friendshipRequestId?: string;
  friendshipStatus?: 'pending' | 'accepted';
  createdAt!: string;
  read!: boolean;
}
