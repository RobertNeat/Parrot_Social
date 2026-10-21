import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import type { Readable } from 'node:stream';
import type { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.tokens.js';

export interface StoredMediaFile {
  storedFileName: string;
  mimeType: string;
  /** Node.js Readable stream of the file bytes. */
  stream: Readable;
}

export interface StoredMediaMeta {
  storedFileName: string;
  mimeType: string;
  ownerId: string;
}

/** Metadata lookups are wired to the `media` table; actual file bytes stay stubbed until the
 * upload endpoint (and PARROT_MEDIA_DIR volume reads) exist. */
@Injectable()
export class MediaStorageService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  // attachHandle, not the DB id, is the lookup key — the id itself must never reach the client.
  async findMetaByAttachHandle(
    attachHandle: string,
  ): Promise<StoredMediaMeta | undefined> {
    const result = await this.pool.query<{
      stored_file_name: string;
      mime_type: string;
      owner_id: string;
    }>(
      'SELECT stored_file_name, mime_type, owner_id FROM media WHERE attach_handle = $1',
      [attachHandle],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      storedFileName: row.stored_file_name,
      mimeType: row.mime_type,
      ownerId: row.owner_id,
    };
  }

  /** Resolves a `media.id` (as stored in e.g. `users.avatar_media_id`) to its attachHandle. */
  async findAttachHandleById(mediaId: string): Promise<string | undefined> {
    const result = await this.pool.query<{ attach_handle: string }>(
      'SELECT attach_handle FROM media WHERE id = $1',
      [mediaId],
    );
    return result.rows[0]?.attach_handle;
  }

  /** Resolves an attachHandle to its `media.id`, scoped to `ownerId` - prevents setting e.g. an
   * avatar to media uploaded by a different user. */
  async findOwnedIdByAttachHandle(
    attachHandle: string,
    ownerId: string,
  ): Promise<string | undefined> {
    const result = await this.pool.query<{ id: string }>(
      'SELECT id FROM media WHERE attach_handle = $1 AND owner_id = $2',
      [attachHandle, ownerId],
    );
    return result.rows[0]?.id;
  }

  // TODO: read from PARROT_MEDIA_DIR (the docker volume mounted at /data, see deploy/compose.yml).
  async readFile(_storedFileName: string): Promise<StoredMediaFile> {
    throw new NotImplementedException('Media file storage is not wired yet.');
  }
}
