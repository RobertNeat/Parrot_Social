import type { Response } from 'express';
import type {
  NotificationDto,
  NotificationType,
} from '@parrot-social/shared-dto';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import type { NotificationRow } from './notifications.repository.js';

export async function toNotificationDto(
  row: NotificationRow,
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
): Promise<NotificationDto> {
  const hasActor = row.actor_id !== null;
  return {
    id: row.id,
    type: row.type as NotificationType,
    actorId: row.actor_id ?? undefined,
    actorName: hasActor
      ? `${row.actor_first_name} ${row.actor_last_name}`
      : undefined,
    actorAvatar: hasActor
      ? await mediaRefBuilder.buildRefForMediaId(row.actor_avatar_media_id, res)
      : undefined,
    targetId: row.target_id ?? undefined,
    friendshipRequestId: row.friendship_id ?? undefined,
    friendshipStatus: row.friendship_status ?? undefined,
    createdAt: row.created_at.toISOString(),
    read: row.read,
  };
}
