import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { MediaRefDto } from '@parrot-social/shared-dto';
import { MediaAccessService } from './media-access.service.js';

const BINDING_COOKIE_TTL_MS = 60_000; // matches the token TTL in MediaAccessService

// parrot-web and parrot-api are separate origins (nginx does not proxy /media), so the URL
// embedded in MediaRefDto must be absolute. Defaults to this process's own listen port so plain
// `nest start --watch` (PORT unset) still works. secure is derived from this origin's own scheme,
// not NODE_ENV, since a production deployment on a plain-http LAN would otherwise drop the cookie.
const API_PUBLIC_ORIGIN =
  process.env.PARROT_API_PUBLIC_ORIGIN ??
  `http://localhost:${process.env.PORT ?? 3000}`;
const USE_SECURE_COOKIE = API_PUBLIC_ORIGIN.startsWith('https://');

/** Mints a MediaRefDto for `attachHandle` and attaches the matching per-token Set-Cookie header to `res`. */
@Injectable()
export class MediaRefBuilderService {
  constructor(private readonly mediaAccessService: MediaAccessService) {}

  async buildRef(
    attachHandle: string,
    res: Response,
  ): Promise<MediaRefDto | undefined> {
    const minted = await this.mediaAccessService.mintRef(attachHandle);
    if (!minted) return undefined;

    res.cookie(minted.cookieName, minted.cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: USE_SECURE_COOKIE,
      path: `/media/stream/${minted.token}`,
      maxAge: BINDING_COOKIE_TTL_MS,
    });

    return {
      url: `${API_PUBLIC_ORIGIN}/media/stream/${minted.token}`,
      expiresAt: minted.expiresAt.toISOString(),
    };
  }
}
