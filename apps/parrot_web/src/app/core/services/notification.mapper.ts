import type { NotificationDto, NotificationType } from '@parrot-social/shared-dto';
import { AppNotification } from '../models/notification.model';

// icon names match the material-symbols-outlined names used by mock-data.ts (n1-n5), extended
// by analogy for the two types the mock never covered (post-upvote, event-interest).
const ICON_BY_TYPE: Record<NotificationType, string> = {
  'post-like': 'favorite',
  'post-upvote': 'thumb_up', // same icon as the feed's upvote button (post-card.html)
  'post-comment': 'chat_bubble',
  'event-interest': 'event',
  'event-reminder': 'event',
  'group-invite': 'group',
  'friend-request': 'person_add',
};

// Mirrors mock-data.ts's exact phrasing for the types it covers; the DTO carries only
// actorName/targetId (no post/group/event title), so n3/n4's mock text (which names the
// event/group) can't be reproduced verbatim - kept generic but same tone instead.
function renderText(type: NotificationType, actorName: string | undefined): string {
  const actor = actorName ?? 'Someone';
  switch (type) {
    case 'post-like':
      return `${actor} liked your post.`;
    case 'post-upvote':
      return `${actor} upvoted your post.`;
    case 'post-comment':
      return `${actor} commented on your post.`;
    case 'event-interest':
      return `${actor} is interested in your event.`;
    case 'event-reminder':
      return 'An event you are interested in is starting soon.';
    case 'group-invite':
      return actorName ? `${actor} added you to a group.` : 'You were added to a group.';
    case 'friend-request':
      return `${actor} sent you a friend request.`;
  }
}

// No existing relative-time helper in the codebase (checked post.mapper.ts/chat.mapper.ts) -
// minimal inline implementation, matching mock-data.ts's short format ('5m', '1h', '1d', no "ago").
function toTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function toLocalNotification(dto: NotificationDto): AppNotification {
  return {
    id: dto.id,
    type: dto.type,
    icon: ICON_BY_TYPE[dto.type],
    text: renderText(dto.type, dto.actorName),
    timeAgo: toTimeAgo(dto.createdAt),
    read: dto.read,
    actorId: dto.actorId,
    targetId: dto.targetId,
    friendshipRequestId: dto.friendshipRequestId,
    friendshipStatus: dto.friendshipStatus,
  };
}
