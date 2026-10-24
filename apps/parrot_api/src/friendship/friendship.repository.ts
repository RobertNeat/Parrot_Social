import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.tokens.js';

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: Date;
}

@Injectable()
export class FriendshipRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /** The single row (if any) involving both users, regardless of direction - the unique pair
   * index (`ux_friendship_pair`) guarantees there is at most one. */
  async findBetween(
    userId: string,
    otherUserId: string,
  ): Promise<FriendshipRow | undefined> {
    const result = await this.pool.query<FriendshipRow>(
      `SELECT * FROM friendship
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
      [userId, otherUserId],
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<FriendshipRow | undefined> {
    const result = await this.pool.query<FriendshipRow>(
      'SELECT * FROM friendship WHERE id = $1',
      [id],
    );
    return result.rows[0];
  }

  /** Inserts the friendship and its recipient-facing notification together - a CTE keeps both
   * writes atomic without a separate transaction/client checkout, mirroring
   * `groups.repository.create`. */
  async create(
    requesterId: string,
    addresseeId: string,
  ): Promise<FriendshipRow> {
    const result = await this.pool.query<FriendshipRow>(
      `WITH f AS (
         INSERT INTO friendship (requester_id, addressee_id)
         VALUES ($1, $2)
         RETURNING *
       ), n AS (
         INSERT INTO notification (type, recipient_id, actor_id, target_id)
         SELECT 'friend-request', $2, $1, f.id FROM f
       )
       SELECT * FROM f`,
      [requesterId, addresseeId],
    );
    return result.rows[0];
  }

  /** Accept only succeeds when the caller is the addressee and the request is still pending -
   * putting the authorization in the WHERE clause avoids a check-then-act race. Returns the
   * updated row, or undefined if no row matched (not found / not addressee / not pending). */
  async accept(
    id: string,
    addresseeId: string,
  ): Promise<FriendshipRow | undefined> {
    const result = await this.pool.query<FriendshipRow>(
      `UPDATE friendship SET status = 'accepted'
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, addresseeId],
    );
    return result.rows[0];
  }

  /** Decline deletes the row rather than storing a 'declined' status - the status CHECK
   * constraint only allows pending/accepted, and keeping a dead row would also block a future
   * request between the same pair via `ux_friendship_pair`. Returns the deleted row so the
   * caller can confirm it existed and was pending/addressed to them. */
  async declineOrCancel(
    id: string,
    callerId: string,
  ): Promise<FriendshipRow | undefined> {
    const result = await this.pool.query<FriendshipRow>(
      `DELETE FROM friendship
       WHERE id = $1 AND status = 'pending' AND (addressee_id = $2 OR requester_id = $2)
       RETURNING *`,
      [id, callerId],
    );
    return result.rows[0];
  }

  /** Unfriend: deletes an accepted friendship between the caller and `otherUserId`. */
  async deleteAccepted(userId: string, otherUserId: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM friendship
       WHERE status = 'accepted'
         AND ((requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1))`,
      [userId, otherUserId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
