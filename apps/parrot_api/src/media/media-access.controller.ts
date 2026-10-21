import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  RefreshMediaRefRequestDto,
  RefreshMediaRefResponseDto,
} from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MediaRefBuilderService } from './media-ref-builder.service.js';
import { MediaStorageService } from './media-storage.service.js';

/** Refresh for a MediaRefDto that expired/404'd before the <img> request landed. Scoped to the
 * caller's own uploads only (preview after upload) — refreshing someone else's post/avatar image
 * instead re-fetches that parent resource, which mints a fresh MediaRefDto itself. */
@Controller('media')
export class MediaAccessController {
  constructor(
    private readonly mediaRefBuilder: MediaRefBuilderService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(
    @Body() body: RefreshMediaRefRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshMediaRefResponseDto> {
    const userId = (req as Request & { user: { id: string } }).user.id;
    const refs: RefreshMediaRefResponseDto['refs'] = {};
    for (const attachHandle of body.attachHandles ?? []) {
      // Ownership check before minting — an attachHandle not owned by the caller (or not a real
      // media row) is silently skipped, same soft-fail style as a 404'd buildRef below.
      const meta = await this.mediaStorage.findMetaByAttachHandle(attachHandle);
      if (!meta || meta.ownerId !== userId) continue;

      const ref = await this.mediaRefBuilder.buildRef(attachHandle, res);
      if (ref) refs[attachHandle] = ref;
    }
    return { refs };
  }
}
