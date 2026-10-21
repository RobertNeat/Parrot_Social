import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.tokens.js';

export interface GroupSummaryRow {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  member_count: number;
  joined: boolean;
}

export interface GroupMemberRow {
  group_id: string;
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_media_id: string | null;
}

const GROUP_SUMMARY_SELECT = `
  SELECT
    g.id,
    g.name,
    g.description,
    g.owner_id,
    (SELECT count(*)::int FROM group_member gm WHERE gm.group_id = g.id) AS member_count,
    EXISTS (
      SELECT 1 FROM group_member gm WHERE gm.group_id = g.id AND gm.user_id = $1
    ) AS joined
  FROM groups g
`;

@Injectable()
export class GroupsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findAll(viewerId: string): Promise<GroupSummaryRow[]> {
    const result = await this.pool.query<GroupSummaryRow>(
      `${GROUP_SUMMARY_SELECT} ORDER BY g.name`,
      [viewerId],
    );
    return result.rows;
  }

  async findById(
    groupId: string,
    viewerId: string,
  ): Promise<GroupSummaryRow | undefined> {
    const result = await this.pool.query<GroupSummaryRow>(
      `${GROUP_SUMMARY_SELECT} WHERE g.id = $2`,
      [viewerId, groupId],
    );
    return result.rows[0];
  }

  async findOwnerName(
    ownerId: string,
  ): Promise<{ firstName: string; lastName: string } | undefined> {
    const result = await this.pool.query<{
      first_name: string;
      last_name: string;
    }>('SELECT first_name, last_name FROM users WHERE id = $1', [ownerId]);
    const row = result.rows[0];
    return row && { firstName: row.first_name, lastName: row.last_name };
  }

  async findMembersByGroupIds(groupIds: string[]): Promise<GroupMemberRow[]> {
    if (groupIds.length === 0) return [];
    const result = await this.pool.query<GroupMemberRow>(
      `SELECT
         gm.group_id,
         u.id, u.username, u.first_name, u.last_name, u.avatar_media_id
       FROM group_member gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = ANY($1)
       ORDER BY u.first_name, u.last_name`,
      [groupIds],
    );
    return result.rows;
  }

  async exists(groupId: string): Promise<boolean> {
    const result = await this.pool.query('SELECT 1 FROM groups WHERE id = $1', [
      groupId,
    ]);
    return result.rows.length > 0;
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM group_member WHERE group_id = $1 AND user_id = $2',
      [groupId, userId],
    );
    return result.rows.length > 0;
  }

  async getOwnerId(groupId: string): Promise<string | undefined> {
    const result = await this.pool.query<{ owner_id: string }>(
      'SELECT owner_id FROM groups WHERE id = $1',
      [groupId],
    );
    return result.rows[0]?.owner_id;
  }

  async join(groupId: string, userId: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO group_member (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [groupId, userId],
    );
  }

  async leave(groupId: string, userId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM group_member WHERE group_id = $1 AND user_id = $2',
      [groupId, userId],
    );
  }

  /** Inserts the group and enrolls the owner as its first member in a single statement - a CTE
   * keeps both writes atomic without needing a separate transaction/client checkout. */
  async create(input: {
    name: string;
    description: string;
    ownerId: string;
  }): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `WITH g AS (
         INSERT INTO groups (name, description, owner_id)
         VALUES ($1, $2, $3)
         RETURNING id
       )
       INSERT INTO group_member (group_id, user_id)
       SELECT id, $3 FROM g
       RETURNING group_id AS id`,
      [input.name, input.description, input.ownerId],
    );
    return result.rows[0].id;
  }
}
