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
  createdAt!: string;
  read!: boolean;
}
