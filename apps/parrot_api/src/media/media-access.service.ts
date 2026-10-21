import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { MediaAccessStore, MediaAccessRecord } from './media-access.store.js';
import { MediaStorageService } from './media-storage.service.js';

const TOKEN_TTL_MS = 60_000; // short-lived: just long enough for the <img> request to land
export const MEDIA_BINDING_COOKIE_PREFIX = 'media_access_';

/** Internal result of a mint: the controller turns this into a MediaRefDto + a Set-Cookie header,
 * it is never returned to the client as-is (cookieValue must stay server/response-header only). */
export interface MintedRef {
  token: string;
  cookieName: string;
  cookieValue: string;
  expiresAt: Date;
}

@Injectable()
export class MediaAccessService {
  constructor(
    private readonly store: MediaAccessStore,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  /** Resolves `attachHandle` to a storedFileName itself — only this service and the storage layer
   * ever see the stable identifier; it never reaches the client. */
  async mintRef(attachHandle: string): Promise<MintedRef | undefined> {
    const meta = await this.mediaStorage.findMetaByAttachHandle(attachHandle);
    if (!meta) return undefined;

    const cookieValue = randomBytes(32).toString('base64url');
    const bindingHash = hashBinding(cookieValue);
    const token = this.store.issue(
      meta.storedFileName,
      bindingHash,
      TOKEN_TTL_MS,
    );

    return {
      token,
      cookieName: `${MEDIA_BINDING_COOKIE_PREFIX}${token}`,
      cookieValue,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    };
  }

  consumeToken(
    token: string,
    cookieValue: string | undefined,
  ): MediaAccessRecord | undefined {
    if (!cookieValue) return undefined;
    return this.store.consume(token, hashBinding(cookieValue));
  }
}

function hashBinding(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
