export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

/** Viewer-relative status between the caller and a target user, plus the friendship row id
 * (needed by the caller to accept/decline when status is pending_received, or to know what to
 * delete when status is friends/pending_sent). */
export class FriendshipStatusDto {
  status!: FriendshipStatus;
  requestId?: string;
}

export class SendFriendRequestDto {
  addresseeId!: string;
}

export class FriendshipDto {
  id!: string;
  requesterId!: string;
  addresseeId!: string;
  status!: 'pending' | 'accepted';
  createdAt!: string;
}
