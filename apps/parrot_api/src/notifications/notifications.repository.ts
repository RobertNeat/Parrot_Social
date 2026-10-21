import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.tokens.js';

export interface NotificationRow {
  id: string;
  type: string;
  actor_id: string | null;
  target_id: string | null;
  created_at: Date;
  read: boolean;
  actor_username: string | null;
  actor_first_name: string | null;
  actor_last_name: string | null;
  actor_avatar_media_id: string | null;
}

// LEFT JOIN - actor_id is nullable (system notifications like event-reminder have no actor).
const NOTIFICATION_SELECT = `
  SELECT
    n.id,
    n.type,
    n.actor_id,
    n.target_id,
    n.created_at,
    n.read,
    actor.username AS actor_username,
    actor.first_name AS actor_first_name,
    actor.last_name AS actor_last_name,
    actor.avatar_media_id AS actor_avatar_media_id
  FROM notification n
  LEFT JOIN users actor ON actor.id = n.actor_id
`;

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findByRecipient(userId: string): Promise<NotificationRow[]> {
    const result = await this.pool.query<NotificationRow>(
      `${NOTIFICATION_SELECT} WHERE n.recipient_id = $1
       ORDER BY n.created_at DESC, n.id DESC`,
      [userId],
    );
    return result.rows;
  }

  async markAllReadForRecipient(userId: string): Promise<void> {
    await this.pool.query(
      'UPDATE notification SET read = true WHERE recipient_id = $1 AND read = false',
      [userId],
    );
  }
}
