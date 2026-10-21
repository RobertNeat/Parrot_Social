import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.tokens.js';

export interface PostRow {
  id: string;
  author_id: string;
  author_username: string;
  author_first_name: string;
  author_last_name: string;
  author_avatar_media_id: string | null;
  group_id: string | null;
  text: string;
  image_media_id: string | null;
  created_at: Date;
  liked: boolean;
  like_count: number;
  upvoted: boolean;
  upvote_count: number;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  author_username: string;
  author_first_name: string;
  author_last_name: string;
  author_avatar_media_id: string | null;
  text: string;
  created_at: Date;
}

// node-postgres returns bigint aggregates (count(*)) as strings - cast every count/exists to a
// native int/bool so DTO fields stay real numbers/booleans, not numeric strings.
const POST_SELECT = `
  SELECT
    p.id,
    p.author_id,
    u.username AS author_username,
    u.first_name AS author_first_name,
    u.last_name AS author_last_name,
    u.avatar_media_id AS author_avatar_media_id,
    p.group_id,
    p.text,
    p.image_media_id,
    p.created_at,
    EXISTS (SELECT 1 FROM post_like pl WHERE pl.post_id = p.id AND pl.user_id = $1) AS liked,
    (SELECT count(*)::int FROM post_like pl WHERE pl.post_id = p.id) AS like_count,
    EXISTS (SELECT 1 FROM post_upvote pu WHERE pu.post_id = p.id AND pu.user_id = $1) AS upvoted,
    (SELECT count(*)::int FROM post_upvote pu WHERE pu.post_id = p.id) AS upvote_count
  FROM post p
  JOIN users u ON u.id = p.author_id
`;

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

@Injectable()
export class PostsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findMainFeed(
    viewerId: string,
    page: number,
    pageSize: number,
  ): Promise<{ rows: PostRow[]; totalCount: number }> {
    const clampedPageSize = Math.min(
      Math.max(1, pageSize || PAGE_SIZE_DEFAULT),
      PAGE_SIZE_MAX,
    );
    const clampedPage = Math.max(1, page || 1);
    const offset = (clampedPage - 1) * clampedPageSize;

    const [rowsResult, countResult] = await Promise.all([
      this.pool.query<PostRow>(
        `${POST_SELECT}
         WHERE p.group_id IS NULL
         ORDER BY p.created_at DESC, p.id DESC
         LIMIT $2 OFFSET $3`,
        [viewerId, clampedPageSize, offset],
      ),
      this.pool.query<{ count: number }>(
        'SELECT count(*)::int AS count FROM post WHERE group_id IS NULL',
      ),
    ]);

    return { rows: rowsResult.rows, totalCount: countResult.rows[0].count };
  }

  async findById(
    postId: string,
    viewerId: string,
  ): Promise<PostRow | undefined> {
    const result = await this.pool.query<PostRow>(
      `${POST_SELECT} WHERE p.id = $2`,
      [viewerId, postId],
    );
    return result.rows[0];
  }

  async findCommentsByPostIds(postIds: string[]): Promise<CommentRow[]> {
    if (postIds.length === 0) return [];
    const result = await this.pool.query<CommentRow>(
      `SELECT
         c.id, c.post_id, c.author_id,
         u.username AS author_username,
         u.first_name AS author_first_name,
         u.last_name AS author_last_name,
         u.avatar_media_id AS author_avatar_media_id,
         c.text, c.created_at
       FROM comment c
       JOIN users u ON u.id = c.author_id
       WHERE c.post_id = ANY($1)
       ORDER BY c.created_at ASC, c.id ASC`,
      [postIds],
    );
    return result.rows;
  }

  async create(input: {
    authorId: string;
    text: string;
    imageMediaId?: string;
  }): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO post (author_id, text, image_media_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [input.authorId, input.text, input.imageMediaId ?? null],
    );
    return result.rows[0].id;
  }

  /** Returns the deleted post's id, or undefined if it didn't exist or wasn't owned by `authorId`. */
  async deleteOwned(
    postId: string,
    authorId: string,
  ): Promise<string | undefined> {
    const result = await this.pool.query<{ id: string }>(
      'DELETE FROM post WHERE id = $1 AND author_id = $2 RETURNING id',
      [postId, authorId],
    );
    return result.rows[0]?.id;
  }

  async exists(postId: string): Promise<boolean> {
    const result = await this.pool.query('SELECT 1 FROM post WHERE id = $1', [
      postId,
    ]);
    return result.rows.length > 0;
  }

  async like(postId: string, userId: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO post_like (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, userId],
    );
  }

  async unlike(postId: string, userId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM post_like WHERE post_id = $1 AND user_id = $2',
      [postId, userId],
    );
  }

  async upvote(postId: string, userId: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO post_upvote (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, userId],
    );
  }

  async removeUpvote(postId: string, userId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM post_upvote WHERE post_id = $1 AND user_id = $2',
      [postId, userId],
    );
  }

  async addComment(input: {
    postId: string;
    authorId: string;
    text: string;
  }): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO comment (post_id, author_id, text)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [input.postId, input.authorId, input.text],
    );
    return result.rows[0].id;
  }
}
