import type {
  FriendshipDto,
  FriendshipStatusDto,
} from '@parrot-social/shared-dto';
import type { FriendshipRow } from './friendship.repository.js';

export function toFriendshipDto(row: FriendshipRow): FriendshipDto {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

/** Viewer-relative status: `viewerId` is the logged-in user, `row` (if any) is the friendship
 * between them and the profile being viewed. */
export function toFriendshipStatusDto(
  viewerId: string,
  row: FriendshipRow | undefined,
): FriendshipStatusDto {
  if (!row) {
    return { status: 'none' };
  }
  if (row.status === 'accepted') {
    return { status: 'friends', requestId: row.id };
  }
  const isRequester = row.requester_id === viewerId;
  return {
    status: isRequester ? 'pending_sent' : 'pending_received',
    requestId: row.id,
  };
}
