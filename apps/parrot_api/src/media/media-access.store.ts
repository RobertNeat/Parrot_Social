import { Injectable } from '@nestjs/common';

export interface MediaAccessRecord {
  storedFileName: string;
  /** Hash of the per-token httpOnly cookie value; never the raw cookie. */
  bindingHash: string;
  expiresAt: Date;
}

/** Contract for token/cookie state storage. Abstract class so it can double as a DI token. */
export abstract class MediaAccessStore {
  abstract issue(
    storedFileName: string,
    bindingHash: string,
    ttlMs: number,
  ): string;
  /** Validates + consumes (single use) in one step; returns the record only if it was valid and unused. */
  abstract consume(
    token: string,
    bindingHash: string,
  ): MediaAccessRecord | undefined;
}

/** In-memory Map-based stub — temporary until a real datastore (Redis/DB) backs this. Lost on restart,
 * not shared across instances; fine for a single-process dev/demo deployment only. */
@Injectable()
export class InMemoryMediaAccessStore extends MediaAccessStore {
  private readonly tokens = new Map<string, MediaAccessRecord>();

  issue(storedFileName: string, bindingHash: string, ttlMs: number): string {
    this.pruneExpired();
    const token = crypto.randomUUID();
    this.tokens.set(token, {
      storedFileName,
      bindingHash,
      expiresAt: new Date(Date.now() + ttlMs),
    });
    return token;
  }

  consume(token: string, bindingHash: string): MediaAccessRecord | undefined {
    const record = this.tokens.get(token);
    // Delete immediately (before any further checks) so two concurrent requests can't both succeed.
    this.tokens.delete(token);
    if (!record) return undefined;
    if (record.expiresAt.getTime() < Date.now()) return undefined;
    if (record.bindingHash !== bindingHash) return undefined;
    return record;
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [token, record] of this.tokens) {
      if (record.expiresAt.getTime() < now) this.tokens.delete(token);
    }
  }
}
