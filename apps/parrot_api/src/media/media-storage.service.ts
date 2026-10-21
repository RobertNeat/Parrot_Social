import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import type { Pool } from 'pg';
import type { MediaDto } from '@parrot-social/shared-dto';
import { DATABASE_POOL } from '../database/database.tokens.js';

// Keyed by mime type, not the client-supplied original filename's extension - the extension is
// cosmetic only (readFile serves bytes with Content-Type from the DB column, never from the
// filesystem extension), but a sane extension on disk is still useful for manual inspection.
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const ORIGINAL_FILE_NAME_MAX_LENGTH = 255; // matches media.original_file_name varchar(255)

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

// Checked in order; first directory that actually contains the file wins. PARROT_MEDIA_DIR is the
// real uploads volume (written by saveUpload below); PARROT_SEED_MEDIA_DIR is the dev-only bind
// mount of deploy/liquibase/seed/media (see deploy/compose.dev.yml).
function candidateMediaDirs(): string[] {
  return [
    process.env.PARROT_MEDIA_DIR,
    process.env.PARROT_SEED_MEDIA_DIR,
  ].filter((dir): dir is string => !!dir);
}

/** Metadata lookups and real file bytes are both wired to the `media` table / media volumes. */
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

  /** Looks up `mime_type` by `stored_file_name` - readFile only gets the stored name (not the
   * attachHandle), so it needs its own narrow query rather than reusing findMetaByAttachHandle. */
  private async findMimeTypeByStoredFileName(
    storedFileName: string,
  ): Promise<string | undefined> {
    const result = await this.pool.query<{ mime_type: string }>(
      'SELECT mime_type FROM media WHERE stored_file_name = $1',
      [storedFileName],
    );
    return result.rows[0]?.mime_type;
  }

  async readFile(storedFileName: string): Promise<StoredMediaFile> {
    // Defense in depth: stored_file_name comes straight out of the DB column, but it must never
    // be trusted as a filesystem path - reject anything that isn't a plain basename.
    if (
      !storedFileName ||
      storedFileName.includes('/') ||
      storedFileName.includes('\\') ||
      storedFileName.includes('..') ||
      path.basename(storedFileName) !== storedFileName
    ) {
      throw new NotFoundException();
    }

    const mimeType = await this.findMimeTypeByStoredFileName(storedFileName);
    if (!mimeType) throw new NotFoundException();

    for (const dir of candidateMediaDirs()) {
      const fullPath = path.join(dir, storedFileName);
      try {
        const stats = await fs.promises.stat(fullPath);
        if (!stats.isFile()) continue;
        return {
          storedFileName,
          mimeType,
          stream: fs.createReadStream(fullPath),
        };
      } catch {
        // Not found in this directory - try the next candidate.
      }
    }

    throw new NotFoundException();
  }

  /** Persists an uploaded file to PARROT_MEDIA_DIR and records it in the `media` table. The
   * stored_file_name is always a fresh random name, never the client-supplied original filename -
   * that avoids both path-traversal (see readFile's defense-in-depth check above) and collisions. */
  async saveUpload(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
    ownerId: string,
  ): Promise<MediaDto> {
    const mediaDir = process.env.PARROT_MEDIA_DIR;
    if (!mediaDir) {
      throw new InternalServerErrorException(
        'PARROT_MEDIA_DIR is not configured on this server',
      );
    }

    const extension = EXTENSION_BY_MIME_TYPE[mimeType] ?? '';
    const storedFileName = `${randomUUID()}${extension}`;
    const truncatedOriginalFileName = originalFileName.slice(
      0,
      ORIGINAL_FILE_NAME_MAX_LENGTH,
    );

    await fs.promises.mkdir(mediaDir, { recursive: true });
    const fullPath = path.join(mediaDir, storedFileName);
    await fs.promises.writeFile(fullPath, buffer, { flag: 'wx' });

    try {
      const result = await this.pool.query<{
        attach_handle: string;
        original_file_name: string;
        mime_type: string;
        size: string;
        created_at: Date;
      }>(
        `INSERT INTO media (stored_file_name, original_file_name, mime_type, size, owner_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING attach_handle, original_file_name, mime_type, size, created_at`,
        [
          storedFileName,
          truncatedOriginalFileName,
          mimeType,
          buffer.length,
          ownerId,
        ],
      );
      const row = result.rows[0];
      return {
        attachHandle: row.attach_handle,
        originalFileName: row.original_file_name,
        mimeType: row.mime_type,
        size: Number(row.size), // bigint column -> pg returns a string
        createdAt: row.created_at.toISOString(),
      };
    } catch (error) {
      // INSERT failed after the file already landed on disk - don't leave an orphaned file behind.
      await fs.promises.unlink(fullPath).catch(() => {});
      throw error;
    }
  }
}
