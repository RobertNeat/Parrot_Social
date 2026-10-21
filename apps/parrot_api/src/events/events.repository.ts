import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.tokens.js';

export interface EventRow {
  id: string;
  title: string;
  description: string;
  image_media_id: string | null;
  starts_at: Date;
  interested: boolean;
  interested_count: number;
}

// Same double-subquery shape as PostsRepository's POST_SELECT: count(*) cast to ::int and
// EXISTS cast to a native bool so DTO fields aren't numeric/boolean-looking strings.
const EVENT_SELECT = `
  SELECT
    e.id,
    e.title,
    e.description,
    e.image_media_id,
    e.starts_at,
    EXISTS (
      SELECT 1 FROM event_interest ei WHERE ei.event_id = e.id AND ei.user_id = $1
    ) AS interested,
    (SELECT count(*)::int FROM event_interest ei WHERE ei.event_id = e.id) AS interested_count
  FROM event e
`;

@Injectable()
export class EventsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findAll(viewerId: string): Promise<EventRow[]> {
    const result = await this.pool.query<EventRow>(
      `${EVENT_SELECT} ORDER BY e.starts_at ASC, e.id ASC`,
      [viewerId],
    );
    return result.rows;
  }

  async findById(
    eventId: string,
    viewerId: string,
  ): Promise<EventRow | undefined> {
    const result = await this.pool.query<EventRow>(
      `${EVENT_SELECT} WHERE e.id = $2`,
      [viewerId, eventId],
    );
    return result.rows[0];
  }

  async exists(eventId: string): Promise<boolean> {
    const result = await this.pool.query('SELECT 1 FROM event WHERE id = $1', [
      eventId,
    ]);
    return result.rows.length > 0;
  }

  async markInterested(eventId: string, userId: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO event_interest (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [eventId, userId],
    );
  }

  async unmarkInterested(eventId: string, userId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM event_interest WHERE event_id = $1 AND user_id = $2',
      [eventId, userId],
    );
  }

  async create(input: {
    title: string;
    description: string;
    startsAt: string;
    imageMediaId?: string;
    createdBy: string;
  }): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO event (title, description, starts_at, image_media_id, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        input.title,
        input.description,
        input.startsAt,
        input.imageMediaId ?? null,
        input.createdBy,
      ],
    );
    return result.rows[0].id;
  }
}
