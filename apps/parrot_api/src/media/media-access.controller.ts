import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  RefreshMediaRefRequestDto,
  RefreshMediaRefResponseDto,
} from '@parrot-social/shared-dto';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { MediaRefBuilderService } from './media-ref-builder.service.js';

/** Refresh for a MediaRefDto that expired/404'd before the <img> request landed. Scoped to the
 * caller's own uploads only (preview after upload) — refreshing someone else's post/avatar image
 * instead re-fetches that parent resource, which mints a fresh MediaRefDto itself. */
@Controller('media')
export class MediaAccessController {
  constructor(private readonly mediaRefBuilder: MediaRefBuilderService) {}

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(
    @Body() body: RefreshMediaRefRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshMediaRefResponseDto> {
    // TODO: once auth/storage are real, verify each attachHandle belongs to the caller before minting.
    const refs: RefreshMediaRefResponseDto['refs'] = {};
    for (const attachHandle of body.attachHandles) {
      const ref = await this.mediaRefBuilder.buildRef(attachHandle, res);
      if (ref) refs[attachHandle] = ref;
    }
    return { refs };
  }
}
