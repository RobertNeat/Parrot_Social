import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.tokens.js';

export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  work: string | null;
  education: string | null;
  relationship: string | null;
  inhabitance: string | null;
  provenance: string | null;
  avatar_media_id: string | null;
  cover_media_id: string | null;
  created_at: Date;
}

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /** `identifier` may be a username or an email; lookup is case-insensitive to match the
   * `ux_users_username_lower`/`ux_users_email_lower` unique indexes. */
  async findByIdentifier(identifier: string): Promise<UserRow | undefined> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [identifier],
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<UserRow | undefined> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    return result.rows[0];
  }

  async usernameOrEmailTaken(
    username: string,
    email: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [username, email],
    );
    return result.rows.length > 0;
  }

  async create(input: {
    username: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<UserRow> {
    const result = await this.pool.query<UserRow>(
      `INSERT INTO users (username, email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.username,
        input.email,
        input.passwordHash,
        input.firstName,
        input.lastName,
      ],
    );
    return result.rows[0];
  }

  /** Only fields present in `patch` are updated - `undefined` means "leave unchanged", distinct
   * from an explicit empty string. Media id columns accept `null` to clear them. */
  async update(
    id: string,
    patch: {
      firstName?: string;
      lastName?: string;
      bio?: string | null;
      work?: string | null;
      education?: string | null;
      relationship?: string | null;
      inhabitance?: string | null;
      provenance?: string | null;
      avatarMediaId?: string | null;
      coverMediaId?: string | null;
    },
  ): Promise<UserRow> {
    const columns: Record<string, unknown> = {
      first_name: patch.firstName,
      last_name: patch.lastName,
      bio: patch.bio,
      work: patch.work,
      education: patch.education,
      relationship: patch.relationship,
      inhabitance: patch.inhabitance,
      provenance: patch.provenance,
      avatar_media_id: patch.avatarMediaId,
      cover_media_id: patch.coverMediaId,
    };
    const entries = Object.entries(columns).filter(
      ([, value]) => value !== undefined,
    );
    if (entries.length === 0) {
      return (await this.findById(id))!;
    }
    const setClause = entries
      .map(([column], index) => `${column} = $${index + 2}`)
      .join(', ');
    const values = entries.map(([, value]) => value);
    const result = await this.pool.query<UserRow>(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return result.rows[0];
  }
}
