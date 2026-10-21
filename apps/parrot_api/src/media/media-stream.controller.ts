import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  MediaAccessService,
  MEDIA_BINDING_COOKIE_PREFIX,
} from './media-access.service.js';
import { MediaStorageService } from './media-storage.service.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

@Controller('media')
export class MediaStreamController {
  constructor(
    private readonly mediaAccessService: MediaAccessService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  // Deliberately unauthenticated (no Bearer header possible from <img src>) — security comes from the
  // token being single-use, short-lived, and bound to a cookie scoped to this exact path, instead of a JWT check.
  @Get('stream/:token')
  async stream(
    @Param('token') token: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const cookieValue = req.cookies?.[
      `${MEDIA_BINDING_COOKIE_PREFIX}${token}`
    ] as string | undefined;
    const record = this.mediaAccessService.consumeToken(token, cookieValue);
    // Same 404 for "unknown token", "already used", "expired", and "cookie mismatch" —
    // distinguishing these would let a client probe which case it hit.
    if (!record) throw new NotFoundException();

    const file = await this.mediaStorage.readFile(record.storedFileName);
    if (!ALLOWED_MIME_TYPES.has(file.mimeType)) throw new NotFoundException();

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Token is already consumed above, so a cached re-render of the same URL would 404 on refetch anyway;
    // no-store keeps that behavior honest.
    res.setHeader('Cache-Control', 'private, no-store');
    res.clearCookie(`${MEDIA_BINDING_COOKIE_PREFIX}${token}`, {
      path: `/media/stream/${token}`,
    });

    return new StreamableFile(file.stream);
  }
}
