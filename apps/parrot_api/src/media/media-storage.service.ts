import { Injectable, NotImplementedException } from '@nestjs/common';
import type { Readable } from 'node:stream';

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

/** Stub for the eventual docker-volume-backed file storage layer. No DB/filesystem wiring yet. */
@Injectable()
export class MediaStorageService {
  // TODO: back this with the `media` table (see deploy/liquibase changelog) once an ORM/DB client exists.
  // attachHandle, not the DB id, is the lookup key — the id itself must never reach the client.
  async findMetaByAttachHandle(
    _attachHandle: string,
  ): Promise<StoredMediaMeta | undefined> {
    throw new NotImplementedException(
      'Media metadata lookup is not wired to a datastore yet.',
    );
  }

  // TODO: read from the docker volume (see open item: no volume mount defined yet in deploy/compose*.yml).
  async readFile(_storedFileName: string): Promise<StoredMediaFile> {
    throw new NotImplementedException('Media file storage is not wired yet.');
  }
}
